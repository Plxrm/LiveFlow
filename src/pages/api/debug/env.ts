import type { APIRoute } from 'astro'

export const GET: APIRoute = async (context) => {
  const runtimeEnv = (context.locals as any)?.runtime?.env || {}

  const result = {
    // วิธีที่ 1: import.meta.env
    meta_env: {
      KEX_APP_KEY: !!import.meta.env.KEX_APP_KEY,
      PUBLIC_KEX_APP_KEY: !!import.meta.env.PUBLIC_KEX_APP_KEY,
      KEX_APP_ID: !!import.meta.env.KEX_APP_ID,
      PUBLIC_KEX_APP_ID: !!import.meta.env.PUBLIC_KEX_APP_ID,
      SUPABASE_SERVICE_ROLE_KEY: !!import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    // วิธีที่ 2: process.env
    process_env: {
      KEX_APP_KEY: !!process.env.KEX_APP_KEY,
      PUBLIC_KEX_APP_KEY: !!process.env.PUBLIC_KEX_APP_KEY,
      KEX_APP_ID: !!process.env.KEX_APP_ID,
    },
    // วิธีที่ 3: runtime env (Cloudflare)
    runtime_env: {
      KEX_APP_KEY: !!runtimeEnv.KEX_APP_KEY,
      PUBLIC_KEX_APP_KEY: !!runtimeEnv.PUBLIC_KEX_APP_KEY,
      KEX_APP_ID: !!runtimeEnv.KEX_APP_ID,
    },
    // วิธีที่ 4: list runtime keys
    runtime_keys: Object.keys(runtimeEnv),
    // context.locals keys
    locals_keys: Object.keys(context.locals || {}),
  }

  return new Response(
    JSON.stringify(result, null, 2),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
}
