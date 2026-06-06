import { supabaseAdmin } from '../supabase/admin'

export interface ProductWithKeys {
  id: string
  name: string
  description: string | null
  stock: number
  is_active: boolean
  free_shipping: boolean
  shipping_fee: number  // stored in products.price field
  created_at: string
  // key stats
  key_type: 'A' | 'B' | null  // A = หลาย key, B = key เดียวหลายชิ้น
  available_count: number
  reserved_count: number
  sold_count: number
  // pricing
  price_min: number | null
  price_max: number | null
  price_single: number | null   // for type B
  // preview keys (first 5 for type A)
  preview_keys: Array<{ id: string; key_code: string; price: number; status: 'available' | 'reserved' | 'sold' }>
  total_keys: number
  // for type B: the single key code
  key_code_b: string | null
}

export async function getProducts(filters?: { search?: string; is_active?: boolean }): Promise<ProductWithKeys[]> {
  try {
    if (!supabaseAdmin) return []

    let query = supabaseAdmin.from('products').select('*').order('created_at', { ascending: false })

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    const { data: products, error } = await query
    if (error) throw error
    if (!products || products.length === 0) return []

    // Fetch all keys for these products in one query
    const productIds = products.map(p => p.id)
    const { data: allKeys } = await supabaseAdmin
      .from('product_keys')
      .select('id, product_id, key_code, price, status')
      .in('product_id', productIds)
      .order('key_code', { ascending: true })

    const keysMap = new Map<string, Array<{ id: string; key_code: string; price: number; status: 'available' | 'reserved' | 'sold' }>>()
    for (const key of allKeys || []) {
      if (!keysMap.has(key.product_id)) keysMap.set(key.product_id, [])
      keysMap.get(key.product_id)!.push(key)
    }

    return products.map(p => {
      const keys = keysMap.get(p.id) || []
      const available = keys.filter(k => k.status === 'available')
      const reserved  = keys.filter(k => k.status === 'reserved')
      const sold      = keys.filter(k => k.status === 'sold')

      // Detect key type: B = all keys share the same key_code
      const uniqueCodes = new Set(keys.map(k => k.key_code))
      const isTypeB = keys.length > 0 && uniqueCodes.size === 1

      let key_type: 'A' | 'B' | null = null
      let price_min: number | null = null
      let price_max: number | null = null
      let price_single: number | null = null
      let key_code_b: string | null = null

      if (isTypeB) {
        key_type = 'B'
        price_single = keys[0]?.price ?? null
        key_code_b = keys[0]?.key_code ?? null
      } else if (keys.length > 0) {
        key_type = 'A'
        const prices = keys.map(k => k.price)
        price_min = Math.min(...prices)
        price_max = Math.max(...prices)
      }

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        stock: p.stock,
        is_active: p.is_active,
        free_shipping: p.free_shipping,
        shipping_fee: p.price ?? 0, // products.price ใช้เก็บค่าส่งต่อสินค้า
        created_at: p.created_at,
        key_type,
        available_count: available.length,
        reserved_count: reserved.length,
        sold_count: sold.length,
        price_min,
        price_max,
        price_single,
        preview_keys: keys.slice(0, 5),
        total_keys: keys.length,
        key_code_b,
      } as ProductWithKeys
    })
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
  shipping_fee?: number
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
        price: data.shipping_fee ?? 0, // price field ใช้เก็บ shipping_fee ต่อสินค้า
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
