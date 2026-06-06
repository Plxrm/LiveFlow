import type { APIRoute } from 'astro'
import { getOrderById } from '../../../lib/api/orders'
import { getSupabaseAdmin } from '../../../lib/supabase/admin'
const supabaseAdmin = getSupabaseAdmin()

export const GET: APIRoute = async ({ params }) => {
  if (!supabaseAdmin) {
    return new Response(JSON.stringify({ error: "Supabase not configured" }), { 
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  try {
    const order = await getOrderById(params.id as string)
    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), { status: 404 })
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
