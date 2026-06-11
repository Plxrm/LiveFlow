import type { APIRoute } from 'astro'
import { getSupabaseAdmin } from '../../../../lib/supabase/admin'
import { pushMessage } from '../../../../lib/line/client'
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

    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .update({ status: 'rejected' })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // ส่งแจ้งเตือนลูกค้าทาง LINE (ถ้าพังก็ไม่ block)
    try {
      if (payment?.order_id) {
        const { data: order } = await supabaseAdmin
          .from('orders')
          .select('*, customers(*)')
          .eq('id', payment.order_id)
          .single()

        const customer = (order as any)?.customers
        if (customer?.line_user_id) {
          const rejectedTpls = await getTemplatesByStep('payment_rejected')
          if (rejectedTpls.length > 0) {
            const rejectedMsgs = buildMessages(rejectedTpls, {
              order_number: (order as any)?.order_number || '',
              amount: String(payment.amount || ''),
              customer_name: customer.display_name || 'ลูกค้า',
            })
            await pushMessage(customer.line_user_id, rejectedMsgs)
          }
        }
      }
    } catch (e) {
      console.error('LINE notify error:', e)
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    console.error('Reject error:', err)
    return new Response(
      JSON.stringify({ error: err?.message || 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
