import type { APIRoute } from 'astro'
import { bulkDeleteProductKeys } from '../../../../../lib/api/products'
import { supabaseAdmin } from '../../../../../lib/supabase/admin'

export const POST: APIRoute = async ({ params, request }) => {
  if (!supabaseAdmin) {
    return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  try {
    const body = await request.json()
    const ids: string[] = body.ids || []
    if (ids.length === 0) {
      return new Response(JSON.stringify({ error: 'No IDs provided' }), { status: 400 })
    }
    await bulkDeleteProductKeys(ids)
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 })
  }
}
