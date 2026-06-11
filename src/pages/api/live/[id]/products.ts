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
    const releaseMode = body.release_mode || 'all'

    // Add to live_products with release_mode
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('name')
      .eq('id', body.product_id)
      .single()

    const { data: lp, error } = await supabaseAdmin
      .from('live_products')
      .insert([{
        live_session_id: params.id as string,
        product_id: body.product_id,
        cf_code: product?.name || 'PRODUCT',
        release_mode: releaseMode
      }])
      .select()
      .single()

    if (error) throw error

    // If releaseMode is 'all', release keys immediately
    if (releaseMode === 'all') {
      await supabaseAdmin
        .from('product_keys')
        .update({ is_released: true })
        .eq('product_id', body.product_id)
        .eq('status', 'available')
    }

    return new Response(JSON.stringify(lp), { status: 201 })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
