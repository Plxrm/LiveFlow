import type { APIRoute } from 'astro'
import { updateOrderStatus } from '../../../../lib/api/orders'
import { supabaseAdmin } from '../../../../lib/supabase/admin'
import { markOrderKeysSold, releaseOrderKeys } from '../../../../lib/line/webhook-handler'

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
