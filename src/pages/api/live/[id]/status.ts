import type { APIRoute } from 'astro'
import { updateLiveSessionStatus } from '../../../../lib/api/live'
import { getSupabaseAdmin } from '../../../../lib/supabase/admin'
const supabaseAdmin = getSupabaseAdmin()

export const PUT: APIRoute = async ({ params, request }) => {
  if (!supabaseAdmin) {
    return new Response(JSON.stringify({ error: "Supabase not configured" }), { status: 503 })
  }
  try {
    const body = await request.json()
    const session = await updateLiveSessionStatus(params.id as string, body.status)
    return new Response(JSON.stringify(session), { status: 200 })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
