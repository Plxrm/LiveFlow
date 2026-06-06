import type { APIRoute } from 'astro'
import { getOrders } from '../../../lib/api/orders'
import { getSupabaseAdmin } from '../../../lib/supabase/admin'
const supabaseAdmin = getSupabaseAdmin()

export const GET: APIRoute = async ({ request }) => {
  if (!supabaseAdmin) {
    return new Response(JSON.stringify({ error: "Supabase not configured" }), { 
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  try {
    const url = new URL(request.url)
    const status = url.searchParams.get('status') || undefined
    const search = url.searchParams.get('search') || undefined
    const live_session_id = url.searchParams.get('live_session_id') || undefined

    const orders = await getOrders({ status, search, live_session_id })
    return new Response(JSON.stringify(orders), { 
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
