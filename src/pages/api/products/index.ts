import type { APIRoute } from 'astro'
import { getProducts, createProduct } from '../../../lib/api/products'
import { getSupabaseAdmin } from '../../../lib/supabase/admin'
const supabaseAdmin = getSupabaseAdmin()

export const GET: APIRoute = async ({ request }) => {
  if (!supabaseAdmin) {
    return new Response(JSON.stringify({ error: "Supabase not configured" }), { 
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const url = new URL(request.url)
    const search = url.searchParams.get('search') || undefined
    const isActiveParam = url.searchParams.get('is_active')
    let is_active: boolean | undefined
    if (isActiveParam === 'true') is_active = true
    if (isActiveParam === 'false') is_active = false

    const products = await getProducts({ search, is_active })
    return new Response(JSON.stringify(products), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export const POST: APIRoute = async ({ request }) => {
  if (!supabaseAdmin) {
    return new Response(JSON.stringify({ error: "Supabase not configured" }), { 
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const body = await request.json()
    const product = await createProduct(body)
    return new Response(JSON.stringify(product), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
