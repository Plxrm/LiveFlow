import type { APIRoute } from 'astro'
import { getLiveSessionById } from '../../../lib/api/live'
import { supabaseAdmin } from '../../../lib/supabase/admin'

export const GET: APIRoute = async ({ params }) => {
  if (!supabaseAdmin) {
    return new Response(JSON.stringify({ error: "Supabase not configured" }), { status: 503 })
  }
  try {
    const session = await getLiveSessionById(params.id as string)
    if (!session) {
      return new Response(JSON.stringify({ error: "Session not found" }), { status: 404 })
    }
    return new Response(JSON.stringify(session), { status: 200 })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
