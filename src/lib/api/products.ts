import { supabaseAdmin } from '../supabase/admin'

export async function getProducts(filters?: { search?: string; is_active?: boolean }) {
  try {
    if (!supabaseAdmin) return []

    let query = supabaseAdmin.from('products').select('*').order('created_at', { ascending: false })

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error in getProducts:', error)
    return []
  }
}

export async function getProductById(id: string) {
  try {
    if (!supabaseAdmin) return null

    const { data, error } = await supabaseAdmin.from('products').select('*').eq('id', id).single()
    if (error) throw error
    return data
  } catch (error) {
    console.error(`Error in getProductById(${id}):`, error)
    return null
  }
}

export async function getProductStats() {
  const defaultStats = { totalProducts: 0, activeProducts: 0, outOfStock: 0, totalValue: 0 }
  try {
    if (!supabaseAdmin) return defaultStats

    const { data, error } = await supabaseAdmin.from('products').select('stock, price, is_active')
    if (error) throw error

    let totalProducts = 0
    let activeProducts = 0
    let outOfStock = 0
    let totalValue = 0

    if (data) {
      totalProducts = data.length
      data.forEach(p => {
        if (p.is_active) {
          activeProducts++
          totalValue += (p.price || 0) * (p.stock || 0)
          if (p.stock === 0) outOfStock++
        }
      })
    }

    return { totalProducts, activeProducts, outOfStock, totalValue }
  } catch (error) {
    console.error('Error in getProductStats:', error)
    return defaultStats
  }
}

export async function createProduct(data: {
  name: string
  description?: string
  free_shipping?: boolean
  is_active?: boolean
}) {
  try {
    if (!supabaseAdmin) throw new Error('Supabase not configured')

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .insert([{
        name: data.name,
        description: data.description ?? null,
        free_shipping: data.free_shipping ?? false,
        is_active: data.is_active ?? true,
        price: 0,   // placeholder — คำนวณจาก key price เมื่อ CF
        stock: 0,
      }])
      .select()
      .single()

    if (error) throw error
    return product
  } catch (error) {
    console.error('Error in createProduct:', error)
    throw error
  }
}

export async function updateProduct(id: string, data: Partial<any>) {
  try {
    if (!supabaseAdmin) throw new Error('Supabase not configured')

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return product
  } catch (error) {
    console.error(`Error in updateProduct(${id}):`, error)
    throw error
  }
}

export async function deleteProduct(id: string) {
  try {
    if (!supabaseAdmin) throw new Error('Supabase not configured')

    const { error } = await supabaseAdmin.from('products').delete().eq('id', id)
    if (error) throw error
    return true
  } catch (error) {
    console.error(`Error in deleteProduct(${id}):`, error)
    throw error
  }
}

// ─── Product Keys ───────────────────────────────────────────────────────────

export async function getProductKeys(productId: string) {
  if (!supabaseAdmin) return []
  const { data } = await supabaseAdmin
    .from('product_keys')
    .select('*')
    .eq('product_id', productId)
    .order('key_code', { ascending: true })
  return data || []
}

export async function addProductKeys(
  productId: string,
  keys: Array<{ key_code: string; price: number; quantity?: number }>
) {
  if (!supabaseAdmin) return []
  const rows: any[] = []
  for (const key of keys) {
    const qty = key.quantity || 1
    for (let i = 0; i < qty; i++) {
      rows.push({
        product_id: productId,
        key_code: key.key_code,
        price: key.price,
        status: 'available'
      })
    }
  }
  const { data } = await supabaseAdmin
    .from('product_keys')
    .insert(rows)
    .select()
  await updateProductStock(productId)
  return data || []
}

export async function deleteProductKey(keyId: string) {
  if (!supabaseAdmin) return false
  const { data: key } = await supabaseAdmin
    .from('product_keys')
    .select('product_id')
    .eq('id', keyId)
    .single()
  await supabaseAdmin
    .from('product_keys')
    .delete()
    .eq('id', keyId)
  if (key) await updateProductStock(key.product_id)
  return true
}

export async function bulkDeleteProductKeys(keyIds: string[]) {
  if (!supabaseAdmin) return false
  const { data: keys } = await supabaseAdmin
    .from('product_keys')
    .select('product_id')
    .in('id', keyIds)
  await supabaseAdmin
    .from('product_keys')
    .delete()
    .in('id', keyIds)
  const productIds = Array.from(new Set((keys?.map(k => k.product_id) || []) as string[]))
  for (const pid of productIds) {
    await updateProductStock(pid)
  }
  return true
}

// อัปเดต stock อัตโนมัติจากจำนวน available keys
export async function updateProductStock(productId: string) {
  if (!supabaseAdmin) return
  const { count } = await supabaseAdmin
    .from('product_keys')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', productId)
    .eq('status', 'available')
  await supabaseAdmin
    .from('products')
    .update({ stock: count || 0 })
    .eq('id', productId)
}
