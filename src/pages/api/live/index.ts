import type { APIRoute } from 'astro'
import { getLiveSessions, createLiveSession } from '../../../lib/api/live'
import { supabaseAdmin } from '../../../lib/supabase/admin'

export const GET: APIRoute = async () => {
  if (!supabaseAdmin) {
    return new Response(JSON.stringify({ error: "Supabase not configured" }), { status: 503 })
  }
  try {
    const sessions = await getLiveSessions()
    return new Response(JSON.stringify(sessions), { status: 200 })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}

export const POST: APIRoute = async ({ request }) => {
  if (!supabaseAdmin) {
    return new Response(JSON.stringify({ error: "Supabase not configured" }), { status: 503 })
  }
  try {
    const body = await request.json()
    const session = await createLiveSession(body)
    return new Response(JSON.stringify(session), { status: 201 })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
