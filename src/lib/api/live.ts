import { getSupabaseAdmin } from '../supabase/admin'

export async function getLiveSessions() {
  const supabaseAdmin = getSupabaseAdmin()
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
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return null
  try {
    const { data: session, error } = await supabaseAdmin
      .from('live_sessions')
      .select(`
        *,
        live_products (
          id, cf_code,
          products ( id, name, price, stock, image_url, free_shipping )
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    // เสริม available_keys สำหรับแต่ละ product
    if (session?.live_products) {
      const productIds = session.live_products
        .map((lp: any) => lp.products?.id)
        .filter(Boolean)

      if (productIds.length > 0) {
        const { data: keys } = await supabaseAdmin
          .from('product_keys')
          .select('id, key_code, price, status, product_id')
          .in('product_id', productIds)
          .eq('status', 'available')
          .order('key_code', { ascending: true })

        const keysMap = new Map<string, any[]>()
        for (const k of keys || []) {
          if (!keysMap.has(k.product_id)) keysMap.set(k.product_id, [])
          keysMap.get(k.product_id)!.push(k)
        }

        ;(session.live_products as any[]).forEach((lp: any) => {
          const pid = lp.products?.id
          lp.available_keys = pid ? (keysMap.get(pid) || []) : []
        })
      }
    }

    return session
  } catch (error) {
    console.error(`Error in getLiveSessionById(${id}):`, error)
    return null
  }
}

export async function createLiveSession(data: { title: string; note?: string }) {
  const supabaseAdmin = getSupabaseAdmin()
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
  const supabaseAdmin = getSupabaseAdmin()
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
}) {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return null
  try {
    // ใช้ product name เป็น cf_code default
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('name')
      .eq('id', data.product_id)
      .single()

    const { data: lp, error } = await supabaseAdmin
      .from('live_products')
      .insert([{
        live_session_id: data.live_session_id,
        product_id: data.product_id,
        cf_code: product?.name || 'PRODUCT'
      }])
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
  const supabaseAdmin = getSupabaseAdmin()
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
  const supabaseAdmin = getSupabaseAdmin()
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

    const filtered = (products || []).filter(p => !existingIds.includes(p.id))

    // เสริม available_keys preview (เช็คว่ามี keys พร้อมขายกี่ชิ้น)
    if (filtered.length > 0) {
      const pIds = filtered.map(p => p.id)
      const { data: keys } = await supabaseAdmin
        .from('product_keys')
        .select('id, key_code, price, product_id')
        .in('product_id', pIds)
        .eq('status', 'available')
        .order('key_code', { ascending: true })

      const keysMap = new Map<string, any[]>()
      for (const k of keys || []) {
        if (!keysMap.has(k.product_id)) keysMap.set(k.product_id, [])
        keysMap.get(k.product_id)!.push(k)
      }

      return filtered.map(p => ({
        ...p,
        available_keys: keysMap.get(p.id) || []
      }))
    }

    return filtered
  } catch (error) {
    console.error('Error in getAvailableProducts:', error)
    return []
  }
}
