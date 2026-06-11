import type { APIRoute } from 'astro'
import { getSupabaseAdmin } from '../../../../lib/supabase/admin'
import { createOrderShipment, hasCompleteAddress } from '../../../../lib/api/shipping'
import { pushMessage } from '../../../../lib/line/client'
import { getSettings } from '../../../../lib/api/settings'
import { getTemplatesByStep, buildMessages } from '../../../../lib/api/messages'

export const PUT: APIRoute = async ({ params }) => {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      return new Response(
        JSON.stringify({ error: 'DB not configured' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const id = params.id as string

    // 1. ยืนยัน payment
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!payment || !payment.order_id) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 2. อัปเดต order → paid
    await supabaseAdmin
      .from('orders')
      .update({ status: 'paid' })
      .eq('id', payment.order_id)

    // 3. ดึง customer เพื่อเช็คที่อยู่
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('*, customers(*)')
      .eq('id', payment.order_id)
      .single()

    const customer = (order as any)?.customers

    // 4. ดึง settings เช็ค auto_ship_on_payment
    try {
      const settings = await getSettings()

      if (settings.auto_ship_on_payment && customer) {
        if (hasCompleteAddress(customer)) {
          // ─── มีที่อยู่ครบ → สร้างพัสดุอัตโนมัติ ───────────────────
          const shipResult = await createOrderShipment(payment.order_id)
          if (shipResult && !('error' in shipResult)) {
            console.log('Auto-ship created:', (shipResult as any).tracking_number)
          } else {
            console.error('Auto-ship failed:', shipResult)
          }
        } else if (customer.line_user_id) {
          // ─── ไม่มีที่อยู่ → ส่ง LINE ถามที่อยู่ ────────────────────
          try {
            const checkoutUrl = import.meta.env.PUBLIC_CHECKOUT_URL
              || import.meta.env.PUBLIC_SUPABASE_URL?.replace('supabase.co', 'vercel.app')
              || ''
            const confirmedTpls = await getTemplatesByStep('payment_confirmed')
            const confirmedMsgs = confirmedTpls.length > 0
              ? buildMessages(confirmedTpls, {
                  order_number: order?.order_number || '',
                  amount: String(payment.amount || ''),
                  customer_name: (customer as any).display_name || 'ลูกค้า',
                })
              : [
                  {
                    type: 'text',
                    text:
                      `✅ ยืนยันการชำระเงินแล้ว!\n\n` +
                      `กรุณากรอกที่อยู่จัดส่งเพื่อให้ระบบจัดส่งพัสดุให้คุณ:\n` +
                      `${checkoutUrl}?order=${payment.order_id}`
                  }
                ]
            await pushMessage(customer.line_user_id, confirmedMsgs)
          } catch (e) {
            console.error('LINE notify error:', e)
          }
        }
      }
    } catch (e) {
      console.error('Settings/auto-ship error:', e)
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    console.error('Confirm error:', err)
    return new Response(
      JSON.stringify({ error: err?.message || 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
