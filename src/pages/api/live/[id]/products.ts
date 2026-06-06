import type { APIRoute } from 'astro'
import { getAvailableProducts, addProductToLive } from '../../../../lib/api/live'
import { getSupabaseAdmin } from '../../../../lib/supabase/admin'
const supabaseAdmin = getSupabaseAdmin()

export const GET: APIRoute = async ({ params }) => {
  if (!supabaseAdmin) {
    return new Response(JSON.stringify({ error: "Supabase not configured" }), { status: 503 })
  }
  try {
    const products = await getAvailableProducts(params.id as string)
    return new Response(JSON.stringify(products), { status: 200 })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}

export const POST: APIRoute = async ({ params, request }) => {
  if (!supabaseAdmin) {
    return new Response(JSON.stringify({ error: "Supabase not configured" }), { status: 503 })
  }
  try {
    const body = await request.json()
    const payload = {
      ...body,
      live_session_id: params.id as string
    }
    const lp = await addProductToLive(payload)
    return new Response(JSON.stringify(lp), { status: 201 })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
