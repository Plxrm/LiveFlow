import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../types/database'

let _client: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseAdmin() {
  if (_client) return _client

  const url = import.meta.env.PUBLIC_SUPABASE_URL
    || process.env.PUBLIC_SUPABASE_URL
    || ''
  const key = import.meta.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.SUPABASE_SERVICE_ROLE_KEY
    || ''

  if (!url || !key) {
    console.error('Supabase admin not configured',
      { url: !!url, key: !!key })
    return null
  }

  _client = createClient<Database>(url, key)
  return _client
}

// backward compatibility
export const supabaseAdmin = null as any
