import type { APIRoute } from 'astro'
import { getAvailableProducts, addProductToLive } from '../../../../lib/api/live'
import { getSupabaseAdmin } from '../../../../lib/supabase/admin'

export const GET: APIRoute = async ({ params }) => {
  const supabaseAdmin = getSupabaseAdmin()
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
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    return new Response(JSON.stringify({ error: "Supabase not configured" }), { status: 503 })
  }
  try {
    const body = await request.json()
    // รับแค่ product_id เท่านั้น
    const lp = await addProductToLive({
      product_id: body.product_id,
      live_session_id: params.id as string
    })
    return new Response(JSON.stringify(lp), { status: 201 })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
