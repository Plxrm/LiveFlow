import type { APIRoute } from 'astro'

export const GET: APIRoute = async ({ request }) => {
  try {
    const { getSupabaseAdmin } = await import('../../../lib/supabase/admin')
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 503 })

    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const search = url.searchParams.get('search')

    let query = supabaseAdmin
      .from('product_keys')
      .select(`
        *,
        products(name, description, free_shipping, shipping_fee)
      `)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    if (search) {
      query = query.or(`key_code.ilike.%${search}%`)
    }

    const { data, error } = await query
    if (error) throw error

    return new Response(JSON.stringify(data), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const { getSupabaseAdmin } = await import('../../../lib/supabase/admin')
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 503 })

    const body = await request.json()
    const { name, description, prefix, quantity, free_shipping, shipping_fee, price } = body

    // 1. Find or create product by name
    let productId = null
    const { data: existingProduct } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('name', name)
      .limit(1)
      .maybeSingle()

    if (existingProduct) {
      productId = existingProduct.id
    } else {
      const { data: newProduct, error: prodErr } = await supabaseAdmin
        .from('products')
        .insert({
          name,
          description: description || null,
          free_shipping,
          price: shipping_fee || 0,
          stock: 0, // Not used strictly anymore, but required
          sku: prefix
        })
        .select('id')
        .single()
      if (prodErr) throw prodErr
      productId = newProduct.id
    }

    // 2. Generate and insert keys
    const keysToInsert = []
    for (let i = 1; i <= quantity; i++) {
      keysToInsert.push({
        product_id: productId,
        key_code: `${prefix}${i}`,
        price: price,
        status: 'available',
        is_released: false
      })
    }

    const { error: keysErr } = await supabaseAdmin
      .from('product_keys')
      .insert(keysToInsert)

    if (keysErr) throw keysErr

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}
