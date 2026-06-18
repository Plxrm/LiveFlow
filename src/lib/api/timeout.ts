import { getSupabaseAdmin } from '../supabase/admin'
import { getSettings } from './settings'
import { pushMessage } from '../line/client'
import { getTemplatesByStep, buildMessages } from './messages'

// เช็ค orders ที่หมดเวลา
export async function processExpiredOrders() {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return { cancelled: 0, banned: 0 }

  const settings = await getSettings()
  const timeout = settings.payment_timeout_minutes || 30
  const cutoff = new Date(
    Date.now() - timeout * 60 * 1000
  ).toISOString()

  // หา orders ที่ pending/confirmed + สร้างนานกว่า timeout
  const { data: expiredOrders } = await supabaseAdmin
    .from('orders')
    .select('*, customers(*)')
    .in('status', ['pending', 'confirmed'])
    .lt('created_at', cutoff)

  if (!expiredOrders || expiredOrders.length === 0) {
    return { cancelled: 0, banned: 0 }
  }

  let cancelledCount = 0
  let bannedCount = 0

  for (const order of expiredOrders) {
    // 1. ยกเลิก order
    await supabaseAdmin
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', order.id)

    // 2. ปล่อย reserved keys กลับ
    const { data: releasedKeys } = await supabaseAdmin
      .from('product_keys')
      .update({
        status: 'available',
        order_id: null,
        is_released: true,
      })
      .eq('order_id', order.id)
      .eq('status', 'reserved')
      .select('product_id')

    // อัปเดต stock
    if (releasedKeys && releasedKeys.length > 0) {
      const productIds = Array.from(new Set(releasedKeys.map((k: any) => k.product_id)))
      for (const pid of productIds) {
        const { count } = await supabaseAdmin
          .from('product_keys')
          .select('*', { count: 'exact', head: true })
          .eq('product_id', pid)
          .eq('status', 'available')
        await supabaseAdmin
          .from('products')
          .update({ stock: count || 0 })
          .eq('id', pid)
      }
    }

    cancelledCount++

    // 3. เพิ่ม unpaid_count ลูกค้า
    const customer = order.customers
    if (customer) {
      const newUnpaidCount = (customer.unpaid_count || 0) + 1

      await supabaseAdmin
        .from('customers')
        .update({ unpaid_count: newUnpaidCount })
        .eq('id', customer.id)

      // 4. แบนอัตโนมัติถ้าเกินจำนวนครั้ง
      const banThreshold = settings.ban_after_unpaid_count || 2

      if (
        settings.auto_ban_on_timeout &&
        newUnpaidCount >= banThreshold &&
        !customer.is_banned
      ) {
        await supabaseAdmin
          .from('customers')
          .update({
            is_banned: true,
            ban_reason: `ไม่ชำระเงิน ${newUnpaidCount} ครั้ง (อัตโนมัติ)`,
            banned_at: new Date().toISOString(),
            ban_count: (customer.ban_count || 0) + 1,
          })
          .eq('id', customer.id)

        bannedCount++

        // ส่ง LINE แจ้งลูกค้าว่าถูกแบน
        try {
          if (customer.line_user_id) {
            await pushMessage(customer.line_user_id, [
              {
                type: 'text',
                text:
                  '🚫 บัญชีของคุณถูกระงับชั่วคราว\n' +
                  `เนื่องจากไม่ชำระเงิน ${newUnpaidCount} ครั้ง\n` +
                  'กรุณาติดต่อแอดมินเพื่อปลดระงับ',
              },
            ])
          }
        } catch (e) {
          console.error('Ban notify error:', e)
        }
      }

      // 5. ส่ง LINE แจ้งยกเลิก
      try {
        if (customer.line_user_id) {
          const templates = await getTemplatesByStep('order_cancelled')
          if (templates.length > 0) {
            const msgs = buildMessages(templates, {
              order_number: order.order_number,
            })
            await pushMessage(customer.line_user_id, msgs)
          } else {
            await pushMessage(customer.line_user_id, [
              {
                type: 'text',
                text: `🚫 ออเดอร์ ${order.order_number} ถูกยกเลิก\nเนื่องจากหมดเวลาชำระเงิน`,
              },
            ])
          }
        }
      } catch (e) {
        console.error('Cancel notify error:', e)
      }
    }
  }

  return { cancelled: cancelledCount, banned: bannedCount }
}

// ส่งเตือนก่อนหมดเวลา
export async function sendTimeoutWarnings() {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return 0

  const settings = await getSettings()
  const timeout = settings.payment_timeout_minutes || 30
  const warning = settings.warning_before_timeout_minutes || 5
  const warningTime = timeout - warning

  const cutoff = new Date(
    Date.now() - warningTime * 60 * 1000
  ).toISOString()

  const cutoffMax = new Date(
    Date.now() - timeout * 60 * 1000
  ).toISOString()

  // หา orders ที่ใกล้หมดเวลา (ในช่วง warning window)
  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('*, customers(line_user_id, display_name)')
    .in('status', ['pending', 'confirmed'])
    .lt('created_at', cutoff)
    .gt('created_at', cutoffMax)

  if (!orders) return 0

  let warned = 0
  for (const order of orders) {
    try {
      const lineId = order.customers?.line_user_id
      if (lineId) {
        await pushMessage(lineId, [
          {
            type: 'text',
            text:
              `⏰ เหลือเวลาอีก ${warning} นาที!\n` +
              `📋 ออเดอร์: ${order.order_number}\n` +
              `💰 ยอด: ฿${Number(order.total).toLocaleString()}\n` +
              `กรุณาชำระเงินก่อนหมดเวลา`,
            quickReply: {
              items: [
                {
                  type: 'action',
                  action: {
                    type: 'message',
                    label: '📋 รวมยอด',
                    text: 'รวมยอด',
                  },
                },
              ],
            },
          },
        ])
        warned++
      }
    } catch (e) {
      console.error('Warning notify error:', e)
    }
  }
  return warned
}
