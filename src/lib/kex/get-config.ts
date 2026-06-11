import type { KexConfig } from './client'

// ─── ดึง KEX config จากหลายแหล่ง ────────────────────────────────────────────
// Priority: Cloudflare runtime env → import.meta.env (build-time)

export function getKexConfig(runtimeEnv?: Record<string, string>): KexConfig {
  return {
    appKey:
      runtimeEnv?.KEX_APP_KEY
      || import.meta.env.KEX_APP_KEY
      || import.meta.env.PUBLIC_KEX_APP_KEY
      || '',
    appId:
      runtimeEnv?.KEX_APP_ID
      || import.meta.env.KEX_APP_ID
      || import.meta.env.PUBLIC_KEX_APP_ID
      || '',
    merchantId:
      runtimeEnv?.KEX_MERCHANT_ID
      || import.meta.env.KEX_MERCHANT_ID
      || import.meta.env.PUBLIC_KEX_MERCHANT_ID
      || '',
    env:
      runtimeEnv?.KEX_ENV
      || import.meta.env.KEX_ENV
      || import.meta.env.PUBLIC_KEX_ENV
      || 'poc'
  }
}
