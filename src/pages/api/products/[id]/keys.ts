import type { APIRoute } from 'astro'
import { getProductKeys, addProductKeys } from '../../../../lib/api/products'
import { getSupabaseAdmin } from '../../../../lib/supabase/admin'
const supabaseAdmin = getSupabaseAdmin()

export const GET: APIRoute = async ({ params }) => {
  if (!supabaseAdmin) {
    return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  try {
    const id = params.id as string
    const keys = await getProductKeys(id)
    return new Response(JSON.stringify(keys), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 })
  }
}

export const POST: APIRoute = async ({ params, request }) => {
  if (!supabaseAdmin) {
    return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  try {
    const id = params.id as string
    const body = await request.json()
    // body: { keys: [{ key_code: "A1", quantity: 1 }, ...] }
    const keys = await addProductKeys(id, body.keys || [])
    return new Response(JSON.stringify(keys), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 })
  }
}
