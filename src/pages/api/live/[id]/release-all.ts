import type { APIRoute } from 'astro'

export const POST: APIRoute = async ({ request }) => {
  try {
    const { getSupabaseAdmin } = await import('../../../../lib/supabase/admin')
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 503 })

    const body = await request.json()
    const { product_id } = body

    const { error } = await supabaseAdmin
      .from('product_keys')
      .update({ is_released: true })
      .eq('product_id', product_id)
      .eq('status', 'available')

    if (error) throw error

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}
