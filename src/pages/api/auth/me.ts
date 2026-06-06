import type { APIRoute } from 'astro'
import { createClient } from '@supabase/supabase-js'

export const GET: APIRoute = async ({ cookies }) => {
  const token = cookies.get('sb-token')?.value

  if (!token) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY
  )

  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ email: user.email, id: user.id }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
}
