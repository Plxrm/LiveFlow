import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../types/database'

const url = import.meta.env.PUBLIC_SUPABASE_URL
const key = import.meta.env.SUPABASE_SERVICE_ROLE_KEY

export const supabaseAdmin = url && key 
  ? createClient<Database>(url, key) 
  : null
