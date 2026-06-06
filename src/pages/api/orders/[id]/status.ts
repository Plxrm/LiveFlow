import type { APIRoute } from 'astro'
import { updateOrderStatus } from '../../../../lib/api/orders'
import { getSupabaseAdmin } from '../../../../lib/supabase/admin'
const supabaseAdmin = getSupabaseAdmin()
import { markOrderKeysSold, releaseOrderKeys } from '../../../../lib/line/webhook-handler'
import { pushMessage } from '../../../../lib/line/client'
import { getTemplatesByStep, buildMessages } from '../../../../lib/api/messages'

export const PUT: APIRoute = async ({ params, request }) => {
  if (!supabaseAdmin) {
    return new Response(JSON.stringify({ error: "Supabase not configured" }), { 
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  try {
    const orderId = params.id as string
    const body = await request.json()
    const newStatus = body.status as string

    const order = await updateOrderStatus(orderId, newStatus)

    // ─── Product key lifecycle ─────────────────────────────────────────────
    if (newStatus === 'completed') {
      await markOrderKeysSold(orderId)
    } else if (newStatus === 'cancelled') {
      await releaseOrderKeys(orderId)
    }

    // ─── LINE notifications for delivered / cancelled ──────────────────────
    if (newStatus === 'completed' || newStatus === 'cancelled') {
      const { data: orderWithCustomer } = await supabaseAdmin
        .from('orders')
        .select('*, customers(*)')
        .eq('id', orderId)
        .single()

      const customer = (orderWithCustomer as any)?.customers
      if (customer?.line_user_id) {
        const step = newStatus === 'completed' ? 'delivered' : 'order_cancelled'
        const tpls = await getTemplatesByStep(step)
        if (tpls.length > 0) {
          const msgs = buildMessages(tpls, {
            order_number: (orderWithCustomer as any)?.order_number || '',
            customer_name: customer.display_name || 'ลูกค้า',
          })
          await pushMessage(customer.line_user_id, msgs)
        }
      }
    }

    return new Response(JSON.stringify(order), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
