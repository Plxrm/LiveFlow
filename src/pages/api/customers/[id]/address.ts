import type { APIRoute } from 'astro'

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const { getSupabaseAdmin } = await import('../../../../lib/supabase/admin')
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      return new Response(
        JSON.stringify({ error: 'DB not configured' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const body = await request.json()
    const { data, error } = await supabaseAdmin
      .from('customers')
      .update({
        display_name: body.display_name,
        phone: body.phone,
        address_detail: body.address_detail,
        subdistrict: body.subdistrict,
        district: body.district,
        province: body.province,
        zipcode: body.zipcode
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, customer: data }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
