import type { APIRoute } from 'astro'

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const { getSupabaseAdmin } = await import('../../../lib/supabase/admin')
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 503 })

    const body = await request.json()
    const { key_code, price, name, free_shipping, shipping_fee } = body

    // 1. Update key_code and price in product_keys
    const { data: keyData, error: keyError } = await supabaseAdmin
      .from('product_keys')
      .update({ key_code, price })
      .eq('id', params.id)
      .select('product_id')
      .single()

    if (keyError) throw keyError

    // 2. Update name, free_shipping, shipping_fee in products table
    if (keyData?.product_id) {
      const { error: prodError } = await supabaseAdmin
        .from('products')
        .update({
          name,
          free_shipping,
          price: shipping_fee || 0 // price in products table is shipping_fee
        })
        .eq('id', keyData.product_id)
        
      if (prodError) throw prodError
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const { getSupabaseAdmin } = await import('../../../lib/supabase/admin')
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 503 })

    const { error } = await supabaseAdmin
      .from('product_keys')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}
