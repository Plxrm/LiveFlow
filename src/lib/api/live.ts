import { supabaseAdmin } from '../supabase/admin'

export async function getLiveSessions() {
  if (!supabaseAdmin) return []
  try {
    const { data, error } = await supabaseAdmin
      .from('live_sessions')
      .select('*, live_products(id)')
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []).map(s => ({
      ...s,
      product_count: s.live_products?.length || 0
    }))
  } catch (error) {
    console.error('Error in getLiveSessions:', error)
    return []
  }
}

export async function getLiveSessionById(id: string) {
  if (!supabaseAdmin) return null
  try {
    const { data: session, error } = await supabaseAdmin
      .from('live_sessions')
      .select(`
        *,
        live_products (
          id, cf_code, live_price, max_per_person,
          products ( id, name, price, stock, image_url )
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return session
  } catch (error) {
    console.error(`Error in getLiveSessionById(${id}):`, error)
    return null
  }
}

export async function createLiveSession(data: { title: string; note?: string }) {
  if (!supabaseAdmin) return null
  try {
    const { data: session, error } = await supabaseAdmin
      .from('live_sessions')
      .insert([{ ...data, status: 'draft' }])
      .select()
      .single()

    if (error) throw error
    return session
  } catch (error) {
    console.error('Error in createLiveSession:', error)
    throw error
  }
}

export async function updateLiveSessionStatus(id: string, status: 'draft' | 'live' | 'ended') {
  if (!supabaseAdmin) return null
  try {
    const updateData: any = { status }
    if (status === 'live') {
      updateData.started_at = new Date().toISOString()
    } else if (status === 'ended') {
      updateData.ended_at = new Date().toISOString()
    }

    const { data: session, error } = await supabaseAdmin
      .from('live_sessions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return session
  } catch (error) {
    console.error(`Error in updateLiveSessionStatus(${id}):`, error)
    throw error
  }
}

export async function addProductToLive(data: {
  live_session_id: string
  product_id: string
  cf_code: string
  live_price?: number
  max_per_person?: number
}) {
  if (!supabaseAdmin) return null
  try {
    if (data.live_price === undefined) {
       const { data: prod } = await supabaseAdmin.from('products').select('price').eq('id', data.product_id).single()
       if (prod) data.live_price = prod.price
       else data.live_price = 0
    }
    const { data: lp, error } = await supabaseAdmin
      .from('live_products')
      .insert([data])
      .select()
      .single()

    if (error) throw error
    return lp
  } catch (error) {
    console.error('Error in addProductToLive:', error)
    throw error
  }
}

export async function removeProductFromLive(id: string) {
  if (!supabaseAdmin) return null
  try {
    const { error } = await supabaseAdmin.from('live_products').delete().eq('id', id)
    if (error) throw error
    return true
  } catch (error) {
    console.error(`Error in removeProductFromLive(${id}):`, error)
    throw error
  }
}

export async function getAvailableProducts(live_session_id: string) {
  if (!supabaseAdmin) return []
  try {
    const { data: existing } = await supabaseAdmin
      .from('live_products')
      .select('product_id')
      .eq('live_session_id', live_session_id)
      
    const existingIds = existing?.map(e => e.product_id) || []

    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('is_active', true)

    if (error) throw error
    return (products || []).filter(p => !existingIds.includes(p.id))
  } catch (error) {
    console.error('Error in getAvailableProducts:', error)
    return []
  }
}
