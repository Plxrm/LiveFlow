import type { APIRoute } from 'astro'
import { getCustomers } from '../../../lib/api/customers'
import { supabaseAdmin } from '../../../lib/supabase/admin'

export const GET: APIRoute = async ({ request }) => {
  if (!supabaseAdmin) {
    return new Response(JSON.stringify({ error: "Supabase not configured" }), { status: 503 })
  }
  try {
    const url = new URL(request.url)
    const search = url.searchParams.get('search') || undefined
    const customers = await getCustomers(search)
    return new Response(JSON.stringify(customers), { status: 200 })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
