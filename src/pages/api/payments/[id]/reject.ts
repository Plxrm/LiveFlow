import type { APIRoute } from 'astro'
import { supabaseAdmin } from '../../../../lib/supabase/admin'

export const PUT: APIRoute = async ({ params }) => {
  if (!supabaseAdmin) return new Response('Supabase not configured', { status: 503 })
  try {
    const id = params.id as string
    
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .update({ status: 'rejected' })
      .eq('id', id)
      .select()
      .single()
      
    if (error) throw error

    return new Response(JSON.stringify(payment), { status: 200 })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
