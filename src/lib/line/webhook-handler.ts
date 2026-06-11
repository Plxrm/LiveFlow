import { getSupabaseAdmin } from '../supabase/admin'
import { parseCFMessage } from './cf-parser'
import { replyMessage, pushMessage, getProfile, getMessageContent } from './client'
import { generateOrderNumber } from '../api/orders'
import { getSettings } from '../api/settings'
import { createOrderShipment, hasCompleteAddress } from '../api/shipping'
import { getTemplatesByStep, buildMessages } from '../api/messages'


export async function handleLineWebhook(body: any) {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return

  const events = body.events || []
  const settings = await getSettings()

  for (const event of events) {
    if (event.type !== 'message') continue

    const userId = event.source.userId
    const replyToken = event.replyToken

    console.log('Webhook event:', {
      type: event.type,
      hasReplyToken: !!replyToken,
      messageType: event.message?.type,
      text: event.message?.text
    })

    // -- Handle Image Upload (Slip) --
    if (event.message.type === 'image') {
      const customer = await findOrCreateCustomer(userId)
      if (!customer) continue

      const { data: order } = await supabaseAdmin.from('orders')
        .select('*')
        .eq('customer_id', customer.id)
        .in('status', ['pending', 'confirmed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!order) {
        const noOrderTpls = await getTemplatesByStep('slip_no_order')
        const noOrderMsgs = noOrderTpls.length > 0
          ? buildMessages(noOrderTpls, {})
          : [{ type: 'text', text: 'ไม่พบออเดอร์ที่รอชำระเงิน' }]
        await replyMessage(replyToken, noOrderMsgs)
        continue
      }

      const buffer = await getMessageContent(event.message.id)
      if (!buffer) {
         await replyMessage(replyToken, [{ type: 'text', text: 'ไม่สามารถดึงรูปสลิปได้' }])
         continue
      }
      
      const fileName = `${order.id}-${Date.now()}.jpg`
      const { error: uploadError } = await supabaseAdmin.storage
        .from('slips')
        .upload(fileName, buffer, { contentType: 'image/jpeg' })

      if (uploadError) {
        console.error('Upload Error:', uploadError)
        await replyMessage(replyToken, [{ type: 'text', text: 'อัปโหลดสลิปไม่สำเร็จ กรุณาลองใหม่' }])
        continue
      }
      
      const { data: publicUrlData } = supabaseAdmin.storage.from('slips').getPublicUrl(fileName)
      const slipUrl = publicUrlData.publicUrl

      await supabaseAdmin.from('payments').insert([{
        order_id: order.id,
        method: 'transfer',
        amount: order.total,
        slip_url: slipUrl,
        status: 'pending'
      }])

      await supabaseAdmin.from('orders').update({ status: 'confirmed' }).eq('id', order.id)

      const slipTpls = await getTemplatesByStep('slip_received')
      const slipMsgs = slipTpls.length > 0
        ? buildMessages(slipTpls, {
            order_number: order.order_number || '',
            amount: String(order.total || ''),
          })
        : [{ type: 'text', text: 'ได้รับสลิปแล้ว รอแอดมินตรวจสอบ' }]
      await replyMessage(replyToken, slipMsgs)

      // ─── Auto-ship trigger (ถ้า auto_confirm + auto_ship เปิดอยู่) ───
      if (settings.auto_confirm_payment && settings.auto_ship_on_payment) {
        // ยืนยัน payment ทันที
        await supabaseAdmin
          .from('payments')
          .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
          .eq('order_id', order.id)
          .eq('status', 'pending')
        await supabaseAdmin.from('orders').update({ status: 'paid' }).eq('id', order.id)

        const { data: customerData } = await supabaseAdmin
          .from('customers').select('*').eq('id', order.customer_id).single()

        if (customerData && hasCompleteAddress(customerData)) {
          await createOrderShipment(order.id)
        } else if (customerData?.line_user_id) {
          const checkoutUrl = import.meta.env.PUBLIC_CHECKOUT_URL || ''
          await pushMessage(customerData.line_user_id, [{
            type: 'text',
            text:
              `✅ ยืนยันการชำระเงินแล้ว!\n\n` +
              `กรุณากรอกที่อยู่จัดส่งเพื่อให้ระบบจัดส่งพัสดุให้คุณ:\n` +
              `${checkoutUrl}?order=${order.id}`
          }])
        }
      }

      continue
    }

    // -- Handle Text Message (CF) --
    if (event.message.type === 'text') {
      const text = event.message.text.trim()

      // ── รวมยอด ──────────────────────────────────────────────────────────────
      if (text === 'รวมยอด' || text === 'รวม') {
        const customer = await findOrCreateCustomer(userId)
        if (!customer) continue

        const { data: pendingOrders } = await supabaseAdmin
          .from('orders')
          .select('order_number, total, shipping_fee')
          .eq('customer_id', customer.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: true })

        if (!pendingOrders || pendingOrders.length === 0) {
          await replyMessage(replyToken, [{ type: 'text', text: 'ไม่มีออเดอร์ที่รอชำระ 😊' }])
          continue
        }

        let summary = '📋 สรุปยอดทั้งหมด:\n\n'
        let grandTotal = 0
        for (const o of pendingOrders as any[]) {
          const orderTotal = Number(o.total) + Number(o.shipping_fee || 0)
          grandTotal += orderTotal
          summary += `• ${o.order_number} — ฿${orderTotal.toLocaleString()}\n`
        }
        summary += `\n💰 รวมทั้งหมด: ฿${grandTotal.toLocaleString()}`
        summary += `\n📦 จำนวน ${pendingOrders.length} ออเดอร์`

        const summaryMessages: any[] = [{ type: 'text', text: summary }]

        if (settings.promptpay_number) {
          summaryMessages.push({
            type: 'flex',
            altText: 'สแกนจ่ายเงินรวม',
            contents: {
              type: 'bubble',
              body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                  { type: 'text', text: 'สแกนจ่ายเงินรวม', weight: 'bold', size: 'lg', align: 'center' },
                  { type: 'image', url: `https://promptpay.io/${settings.promptpay_number}/${grandTotal}.png`, size: 'full', aspectRatio: '1:1' },
                  { type: 'text', text: `฿${grandTotal.toLocaleString()}`, weight: 'bold', size: 'xl', align: 'center' }
                ]
              }
            }
          })
        }

        await replyMessage(replyToken, summaryMessages)
        continue
      }

      // ── CF เฉยๆ ──────────────────────────────────────────────────────────────
      if (text.toUpperCase() === 'CF') {
        await replyMessage(replyToken, [{
          type: 'text',
          text: '🛒 พิมพ์รหัสสินค้าที่ต้องการเลยค่ะ\nเช่น A1, B2, ก1'
        }])
        continue
      }

      // ── ติดต่อแอดมิน ─────────────────────────────────────────────────────────
      if (text.includes('ติดต่อแอดมิน')) {
        await replyMessage(replyToken, [{
          type: 'text',
          text: '📞 แอดมินจะติดต่อกลับโดยเร็วที่สุดค่ะ\nรอสักครู่นะคะ 🙏'
        }])
        continue
      }

      // ── CF parsing ────────────────────────────────────────────────────────────
      const parsed = parseCFMessage(text)

      if (!parsed) continue

      const cfCode = parsed.cf_code

      const customer = await findOrCreateCustomer(userId)
      if (!customer) continue

      // a) หา active live session
      const liveSession = await getActiveLiveSession()
      if (!liveSession) {
        const noLiveTpls = await getTemplatesByStep('cf_no_live')
        const noLiveMsgs = noLiveTpls.length > 0
          ? buildMessages(noLiveTpls, {})
          : [{ type: 'text', text: 'ขออภัย ตอนนี้ยังไม่มีไลฟ์เปิดขาย' }]
        await replyMessage(replyToken, noLiveMsgs)
        await logCF(userId, text, cfCode, null, false, 'no_active_session')
        continue
      }

      const sessionId = liveSession.id

      // b) ค้นหา product_key ที่ key_code ตรงกับ cfCode (case insensitive), status = available
      const { data: key } = await supabaseAdmin
        .from('product_keys')
        .select(`
          id, key_code, price, product_id, is_released,
          products(
            id, name, free_shipping, price
          )
        `)
        .ilike('key_code', cfCode)
        .eq('status', 'available')
        .limit(1)
        .maybeSingle()

      if (!key) {
        // ไม่มี key นี้ หรือขายแล้ว
        const notFoundMsg = `❌ ${cfCode} ไม่พบรหัสนี้ หรือถูกจองแล้ว ลองรหัสอื่นดูนะคะ`
        await replyMessage(replyToken, [{ type: 'text', text: notFoundMsg }])
        await logCF(userId, text, cfCode, sessionId, false, 'key_not_found_or_sold')
        continue
      }

      if (!key.is_released) {
        await replyMessage(replyToken, [{ type: 'text', text: '⏳ สินค้านี้ยังไม่เปิดขาย รอแอดมินปล่อยก่อนนะคะ' }])
        await logCF(userId, text, cfCode, sessionId, false, 'not_released_yet')
        continue
      }

      // c) เช็คว่า product อยู่ในไลฟ์นี้
      const { data: inLive } = await supabaseAdmin
        .from('live_products')
        .select('id')
        .eq('live_session_id', sessionId)
        .eq('product_id', key.product_id)
        .maybeSingle()

      if (!inLive) {
        await replyMessage(replyToken, [{ type: 'text', text: `❌ สินค้าของ ${cfCode} ไม่ได้อยู่ในไลฟ์นี้` }])
        await logCF(userId, text, cfCode, sessionId, false, 'product_not_in_live')
        continue
      }

      const product = (key as any).products
      const productFreeShipping = product?.free_shipping === true
      // products.price เก็บค่าส่ง (ตาม data model)
      const productShippingFee = product?.price ?? 0
      const shippingFee = productFreeShipping ? 0 : productShippingFee

      const keyPrice = key.price
      const total = keyPrice + shippingFee

      // d) สร้าง order ก่อน (ต้องการ order id เพื่อ reserve key)
      const orderNumber = await generateOrderNumber()

      const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert([{
          order_number: orderNumber,
          customer_id: customer.id,
          live_session_id: sessionId,
          status: 'pending',
          total: total,
          shipping_fee: shippingFee
        }])
        .select()
        .single()

      if (orderError || !order) {
        console.error('Failed to create order', orderError)
        await replyMessage(replyToken, [{ type: 'text', text: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' }])
        continue
      }

      // e) reserve เฉพาะ key นี้ 1 ชิ้น (atomic: ตรวจสอบ status อีกครั้งด้วย .eq)
      const { error: reserveError } = await supabaseAdmin
        .from('product_keys')
        .update({ status: 'reserved', order_id: order.id })
        .eq('id', key.id)
        .eq('status', 'available') // double-check กัน race condition

      if (reserveError) {
        // key ถูกจองไปแล้วก่อนที่เราจะ reserve (race condition)
        // ลบ order ที่สร้างไปแล้ว
        await supabaseAdmin.from('orders').delete().eq('id', order.id)
        await replyMessage(replyToken, [{ type: 'text', text: `❌ ${cfCode} ถูกจองแล้ว ลองรหัสอื่นดูนะคะ` }])
        await logCF(userId, text, cfCode, sessionId, false, 'key_race_condition')
        continue
      }

      // f) สร้าง order_items
      await supabaseAdmin.from('order_items').insert([{
        order_id: order.id,
        product_id: key.product_id,
        product_name: `${product?.name || 'สินค้า'} (${key.key_code})`,
        price: keyPrice,
        quantity: 1
      }])

      // อัปเดต stock จาก available keys ที่เหลือ
      const { count } = await supabaseAdmin
        .from('product_keys')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', key.product_id)
        .eq('status', 'available')
      await supabaseAdmin
        .from('products')
        .update({ stock: count || 0 })
        .eq('id', key.product_id)

      // g) ส่งข้อความ CF สำเร็จ
      const shippingText = productFreeShipping ? 'ฟรี!' : `฿${shippingFee.toLocaleString()}`

      const cfSuccessTpls = await getTemplatesByStep('cf_success')
      let replyMessages: any[]

      if (cfSuccessTpls.length > 0) {
        replyMessages = buildMessages(cfSuccessTpls, {
          product_name: `${product?.name || 'สินค้า'} (${key.key_code})`,
          quantity: '1',
          price: keyPrice.toLocaleString(),
          total: total.toLocaleString(),
          order_number: orderNumber,
          shipping_text: shippingText,
          customer_name: customer.display_name || 'ลูกค้า',
          cf_code: cfCode,
        })
      } else {
        const shippingLine = productFreeShipping
          ? '🚚 ค่าส่ง: ฟรี!'
          : `🚚 ค่าส่ง: ฿${shippingFee.toLocaleString()}`

        replyMessages = [
          {
            type: 'text',
            text:
              `✅ สั่งซื้อสำเร็จ!\n` +
              `📦 ${product?.name || 'สินค้า'} (${key.key_code})\n` +
              `💰 ราคา ฿${keyPrice.toLocaleString()}\n` +
              `${shippingLine}\n` +
              `💵 รวม ฿${total.toLocaleString()}\n` +
              `📋 ออเดอร์: ${orderNumber}`
          }
        ]

        if (settings.promptpay_number) {
          replyMessages.push({
            type: 'flex',
            altText: 'สแกนจ่ายเงิน',
            contents: {
              type: 'bubble',
              body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                  { type: 'text', text: 'สแกนจ่ายเงิน', weight: 'bold', size: 'lg' },
                  { type: 'image', url: `https://promptpay.io/${settings.promptpay_number}/${total}.png`, size: 'full', aspectRatio: '1:1' },
                  { type: 'text', text: `฿${total.toLocaleString()}`, weight: 'bold', size: 'xl', align: 'center' },
                  { type: 'text', text: `ออเดอร์: ${orderNumber}`, size: 'sm', color: '#888888', align: 'center' }
                ]
              }
            }
          })
        }
      }

      // เพิ่ม quickReply buttons ใน message สุดท้าย
      if (replyMessages.length > 0) {
        replyMessages[replyMessages.length - 1].quickReply = {
          items: [
            {
              type: 'action',
              action: { type: 'message', label: '🛒 CF ต่อ', text: 'CF' }
            },
            {
              type: 'action',
              action: { type: 'message', label: '📋 รวมยอด', text: 'รวมยอด' }
            },
            {
              type: 'action',
              action: { type: 'message', label: '❓ ติดต่อแอดมิน', text: 'ติดต่อแอดมิน' }
            }
          ]
        }
      }

      console.log('Sending CF reply:', {
        cfCode,
        orderId: order?.id,
        customerLineId: userId,
        messageCount: replyMessages.length
      })

      const replyResult = await replyMessage(replyToken, replyMessages)
      console.log('CF reply result:', replyResult)

      await logCF(userId, text, cfCode, sessionId, true, null)
    }
  }
}

// Helper functions
async function findOrCreateCustomer(lineUserId: string) {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return null
  const { data } = await supabaseAdmin.from('customers').select('*').eq('line_user_id', lineUserId).single()
  if (data) return data
  
  let displayName = 'ลูกค้า (LINE)'
  const profile = await getProfile(lineUserId)
  if (profile && profile.displayName) {
    displayName = profile.displayName
  }

  const { data: newCustomer } = await supabaseAdmin.from('customers').insert([{
    line_user_id: lineUserId,
    display_name: displayName
  }]).select().single()
  
  return newCustomer
}

async function getActiveLiveSession() {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return null
  const { data } = await supabaseAdmin.from('live_sessions').select('*').eq('status', 'live').limit(1).maybeSingle()
  return data
}

async function logCF(userId: string, raw: string, cfCode: string, sessionId: string | null, isValid: boolean, error: string | null) {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return null
  await supabaseAdmin.from('cf_logs').insert([{
    line_user_id: userId,
    raw_message: raw,
    parsed_cf_code: cfCode,
    live_session_id: sessionId,
    is_valid: isValid,
    error_reason: error
  }])
}

// ─── Product Key Lifecycle (called from admin order status changes) ──────────

/** เมื่อ order completed: reserved → sold */
export async function markOrderKeysSold(orderId: string) {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return
  await supabaseAdmin
    .from('product_keys')
    .update({ status: 'sold', sold_at: new Date().toISOString() })
    .eq('order_id', orderId)
    .eq('status', 'reserved')
}

/** เมื่อ order cancelled: reserved → available */
export async function releaseOrderKeys(orderId: string) {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return
  // ดึง product_ids ก่อนเพื่ออัปเดต stock
  const { data: keys } = await supabaseAdmin
    .from('product_keys')
    .select('product_id')
    .eq('order_id', orderId)
    .eq('status', 'reserved')

  await supabaseAdmin
    .from('product_keys')
    .update({ status: 'available', order_id: null })
    .eq('order_id', orderId)
    .eq('status', 'reserved')

  // อัปเดต stock ของทุก product ที่เกี่ยวข้อง
  const productIds = [...new Set(keys?.map(k => k.product_id) || [])]
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
