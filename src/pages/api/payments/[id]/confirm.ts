import type { APIRoute } from 'astro'

export const PUT: APIRoute = async ({ params }) => {
  try {
    console.log('Confirm payment:', params.id)

    const { getSupabaseAdmin } = await import(
      '../../../../lib/supabase/admin'
    )
    const supabaseAdmin = getSupabaseAdmin()

    if (!supabaseAdmin) {
      console.error('Supabase not configured')
      return new Response(
        JSON.stringify({ error: 'DB not configured' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // อัปเดต payment status
    const { data: payment, error: payError } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select('*, orders(id, order_number)')
      .single()

    console.log('Payment update:', { payment, payError })

    if (payError) {
      return new Response(
        JSON.stringify({ error: payError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // อัปเดต order status → paid
    if ((payment as any)?.orders?.id) {
      const { error: orderError } = await supabaseAdmin
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', (payment as any).orders.id)

      console.log('Order update:', { orderError })
    }

    // ส่ง LINE แจ้งลูกค้า (ถ้าพังก็ไม่ block)
    try {
      const { getSettings } = await import('../../../../lib/api/settings')
      const { getTemplatesByStep, buildMessages } = await import('../../../../lib/api/messages')
      const { pushMessage } = await import('../../../../lib/line/client')
      const { createOrderShipment, hasCompleteAddress } = await import('../../../../lib/api/shipping')

      const settings = await getSettings()
      const orderId = (payment as any)?.orders?.id

      if (orderId) {
        const { data: order } = await supabaseAdmin
          .from('orders')
          .select('*, customers(*)')
          .eq('id', orderId)
          .single()

        const customer = (order as any)?.customers

        if (settings.auto_ship_on_payment && customer) {
          if (hasCompleteAddress(customer)) {
            const shipResult = await createOrderShipment(orderId)
            console.log('Auto-ship result:', shipResult)
          } else if (customer.line_user_id) {
            const checkoutUrl = import.meta.env.PUBLIC_CHECKOUT_URL || ''
            const confirmedTpls = await getTemplatesByStep('payment_confirmed')
            const msgs = confirmedTpls.length > 0
              ? buildMessages(confirmedTpls, {
                  order_number: (order as any)?.order_number || '',
                  amount: String((payment as any)?.amount || ''),
                  customer_name: customer.display_name || 'ลูกค้า',
                })
              : [{
                  type: 'text',
                  text: `✅ ยืนยันการชำระเงินแล้ว!\n\nกรุณากรอกที่อยู่จัดส่ง:\n${checkoutUrl}?order=${orderId}`
                }]
            await pushMessage(customer.line_user_id, msgs)
          }
        }
      }
    } catch (e) {
      console.error('Post-confirm error (non-fatal):', e)
    }

    return new Response(
      JSON.stringify({ success: true, payment }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Confirm fatal error:', err)
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
