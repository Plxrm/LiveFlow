import type { APIRoute } from 'astro'
import { supabaseAdmin } from '../../../../lib/supabase/admin'
import { pushMessage } from '../../../../lib/line/client'
import { getTemplatesByStep, buildMessages } from '../../../../lib/api/messages'

export const PUT: APIRoute = async ({ params }) => {
  if (!supabaseAdmin) return new Response('Supabase not configured', { status: 503 })
  try {
    const id = params.id as string
    
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .update({ status: 'rejected' })
      .eq('id', id)
      .select()
      .single()
      
    if (error) throw error

    // ส่งแจ้งเตือนลูกค้าทาง LINE
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

    return new Response(JSON.stringify(payment), { status: 200 })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
