import type { APIRoute } from 'astro'
import { getCustomerById } from '../../../lib/api/customers'
import { supabaseAdmin } from '../../../lib/supabase/admin'

export const GET: APIRoute = async ({ params }) => {
  if (!supabaseAdmin) {
    return new Response(JSON.stringify({ error: "Supabase not configured" }), { status: 503 })
  }
  try {
    const customer = await getCustomerById(params.id as string)
    if (!customer) {
      return new Response(JSON.stringify({ error: "Customer not found" }), { status: 404 })
    }
    return new Response(JSON.stringify(customer), { status: 200 })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
