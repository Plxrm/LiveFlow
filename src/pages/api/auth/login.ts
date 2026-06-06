import type { APIRoute } from 'astro'
import { createClient } from '@supabase/supabase-js'

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'กรุณากรอกอีเมลและรหัสผ่าน' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.PUBLIC_SUPABASE_ANON_KEY
    )

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.session) {
      return new Response(
        JSON.stringify({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { access_token, refresh_token } = data.session

    cookies.set('sb-token', access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 วัน
    })

    cookies.set('sb-refresh-token', refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 วัน
    })

    return new Response(
      JSON.stringify({ success: true, email: data.user.email }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
