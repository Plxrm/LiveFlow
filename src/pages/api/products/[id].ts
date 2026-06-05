import type { APIRoute } from 'astro'
import { getProductById, updateProduct, deleteProduct } from '../../../lib/api/products'
import { supabaseAdmin } from '../../../lib/supabase/admin'

export const GET: APIRoute = async ({ params }) => {
  if (!supabaseAdmin) {
    return new Response(JSON.stringify({ error: "Supabase not configured" }), { 
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const id = params.id as string
    const product = await getProductById(id)
    if (!product) {
      return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404 })
    }
    return new Response(JSON.stringify(product), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 })
  }
}

export const PUT: APIRoute = async ({ params, request }) => {
  if (!supabaseAdmin) {
    return new Response(JSON.stringify({ error: "Supabase not configured" }), { 
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const id = params.id as string
    const body = await request.json()
    const product = await updateProduct(id, body)
    return new Response(JSON.stringify(product), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 })
  }
}

export const DELETE: APIRoute = async ({ params }) => {
  if (!supabaseAdmin) {
    return new Response(JSON.stringify({ error: "Supabase not configured" }), { 
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const id = params.id as string
    await deleteProduct(id)
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 })
  }
}
