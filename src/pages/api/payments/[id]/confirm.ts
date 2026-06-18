import type { APIRoute } from 'astro'

export const PUT: APIRoute = async (context) => {
  const { params, request } = context
  try {
    const { getSupabaseAdmin } = await import('../../../../lib/supabase/admin')
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      return new Response(
        JSON.stringify({ error: 'DB not configured' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 1. อัปเดต payment
    const { data: payment, error: payError } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (payError || !payment) {
      return new Response(
        JSON.stringify({ error: payError?.message || 'Payment not found' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 2. ดึง order + customer
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('*, customers(*)')
      .eq('id', payment.order_id)
      .single()

    if (!order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 3. อัปเดต order status → paid
    await supabaseAdmin
      .from('orders')
      .update({ status: 'paid' })
      .eq('id', order.id)

    // 4. ส่ง LINE แจ้งลูกค้า
    try {
      const { pushMessage } = await import('../../../../lib/line/client')
      const { getTemplatesByStep, buildMessages } = await import('../../../../lib/api/messages')
      const { getSettings } = await import('../../../../lib/api/settings')

      const customer = order.customers
      if (customer?.line_user_id) {
        // ส่งข้อความยืนยันชำระเงิน
        const templates = await getTemplatesByStep('payment_confirmed')
        const variables = {
          order_number: order.order_number,
          amount: String(payment.amount),
          customer_name: customer.display_name || 'ลูกค้า'
        }

        let messages: any[] = []
        if (templates.length > 0) {
          messages = buildMessages(templates, variables)
        } else {
          messages = [{
            type: 'text',
            text: `✅ ยืนยันการชำระเงินเรียบร้อย!\n📋 ออเดอร์: ${order.order_number}\n💰 จำนวน ฿${Number(payment.amount).toLocaleString()}`
          }]
        }

        // 5. เช็คที่อยู่ลูกค้า
        const hasAddress = customer.address_detail
          || customer.address
          || (customer.subdistrict && customer.zipcode)

        if (!hasAddress) {
          // ไม่มีที่อยู่ → ส่งลิงก์กรอก
          const { getBaseUrl } = await import('../../../../lib/utils/get-base-url')
          const baseUrl = await getBaseUrl()

          messages.push({
            type: 'text',
            text: '📮 กรุณากรอกที่อยู่จัดส่ง:\n'
              + `${baseUrl}/checkout?customer=${customer.id}`,
            quickReply: {
              items: [
                {
                  type: 'action',
                  action: {
                    type: 'uri',
                    label: '📮 กรอกที่อยู่',
                    uri: `${baseUrl}/checkout?customer=${customer.id}`
                  }
                },
                {
                  type: 'action',
                  action: {
                    type: 'message',
                    label: '❓ ติดต่อแอดมิน',
                    text: 'ติดต่อแอดมิน'
                  }
                }
              ]
            }
          })
        } else {
          // มีที่อยู่แล้ว → แจ้งกำลังจัดส่ง
          messages.push({
            type: 'text',
            text: '📦 กำลังเตรียมจัดส่งสินค้าให้คุณ\nรอรับพัสดุได้เลยค่ะ'
          })

          // Auto-ship ถ้าเปิดอยู่
          try {
            const settings = await getSettings()
            if (settings.auto_ship_on_payment) {
              // ดึง runtime env จาก Cloudflare
              const runtimeEnv = (context.locals as any)?.runtime?.env || {}
              const { getKexConfig } = await import('../../../../lib/kex/get-config')
              const kexConfig = getKexConfig(runtimeEnv)
              const { createOrderShipment } = await import('../../../../lib/api/shipping')
              await createOrderShipment(order.id, kexConfig)
            }
          } catch (shipErr) {
            console.error('Auto-ship error:', shipErr)
          }
        }

        await pushMessage(customer.line_user_id, messages)
      }
    } catch (lineErr) {
      console.error('LINE notify error:', lineErr)
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Confirm error:', err)
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
