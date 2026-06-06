import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../types/database'

let _client: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseClient() {
  if (_client) return _client

  const url = import.meta.env.PUBLIC_SUPABASE_URL
    || process.env.PUBLIC_SUPABASE_URL
    || ''
  const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY
    || process.env.PUBLIC_SUPABASE_ANON_KEY
    || ''

  if (!url || !key) return null

  _client = createClient<Database>(url, key)
  return _client
}

export const supabase = null as any
