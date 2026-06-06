import type { APIRoute } from 'astro'
import { deleteProductKey } from '../../../../lib/api/products'
import { getSupabaseAdmin } from '../../../../lib/supabase/admin'
const supabaseAdmin = getSupabaseAdmin()

export const PATCH: APIRoute = async ({ params, request }) => {
  if (!supabaseAdmin) {
    return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  try {
    const keyId = params.keyId as string
    const body = await request.json()
    const { error } = await supabaseAdmin
      .from('product_keys')
      .update({ price: body.price })
      .eq('id', keyId)
    if (error) throw error
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 })
  }
}

export const DELETE: APIRoute = async ({ params }) => {
  if (!supabaseAdmin) {
    return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  try {
    const keyId = params.keyId as string
    await deleteProductKey(keyId)
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 })
  }
}
