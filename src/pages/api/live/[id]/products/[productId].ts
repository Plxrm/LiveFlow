import type { APIRoute } from 'astro'
import { removeProductFromLive } from '../../../../../lib/api/live'
import { getSupabaseAdmin } from '../../../../../lib/supabase/admin'
const supabaseAdmin = getSupabaseAdmin()

export const DELETE: APIRoute = async ({ params }) => {
  if (!supabaseAdmin) {
    return new Response(JSON.stringify({ error: "Supabase not configured" }), { status: 503 })
  }
  try {
    await removeProductFromLive(params.productId as string)
    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
