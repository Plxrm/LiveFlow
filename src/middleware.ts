import { defineMiddleware } from 'astro:middleware'
import { createClient } from '@supabase/supabase-js'

// Paths ที่ไม่ต้อง login
const PUBLIC_PATHS = [
  '/login',
  '/checkout',
  '/api/line/webhook',
  '/api/auth/login',
  '/api/auth/logout',
  '/print/',
  '/api/orders',
  '/api/customers',
  '/api/cron',
  '/api/checkout',
  '/api/checkslip',
]

export const onRequest = defineMiddleware(async ({ request, redirect, cookies }, next) => {
  const url = new URL(request.url)
  const path = url.pathname

  // ข้าม public paths
  if (PUBLIC_PATHS.some(p => path.startsWith(p))) return next()

  // ข้าม API routes อื่นๆ (ใช้ service role key อยู่แล้ว)
  if (path.startsWith('/api/')) return next()

  // ข้าม static assets
  if (path.startsWith('/_') || path.includes('.')) return next()

  // เช็ค login token
  const token = cookies.get('sb-token')?.value

  if (!token) {
    return redirect('/login')
  }

  // verify token กับ Supabase
  try {
    const supabase = createClient(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.PUBLIC_SUPABASE_ANON_KEY
    )

    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      cookies.delete('sb-token', { path: '/' })
      cookies.delete('sb-refresh-token', { path: '/' })
      return redirect('/login')
    }
  } catch {
    cookies.delete('sb-token', { path: '/' })
    return redirect('/login')
  }

  return next()
})
