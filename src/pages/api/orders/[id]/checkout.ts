import type { APIRoute } from 'astro'

export const GET: APIRoute = async ({ params }) => {
  try {
    const { getSupabaseAdmin } = await import('../../../../lib/supabase/admin')
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      return new Response(
        JSON.stringify({ error: 'DB not configured' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { data: order } = await supabaseAdmin
      .from('orders')
      .select(`
        id, order_number, total, shipping_fee, status,
        customers(id, display_name, phone,
          address_detail, subdistrict, district,
          province, zipcode),
        order_items(product_name, price, quantity)
      `)
      .eq('id', params.id)
      .single()

    if (!order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify(order),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
