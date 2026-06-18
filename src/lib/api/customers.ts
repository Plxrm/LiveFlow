import { getSupabaseAdmin } from '../supabase/admin'
const supabaseAdmin = getSupabaseAdmin()

export async function getCustomers(search?: string) {
  if (!supabaseAdmin) return []
  try {
    let query = supabaseAdmin
      .from('customers')
      .select('*, orders(id)')
      .order('created_at', { ascending: false })

    const { data, error } = await query
    if (error) throw error

    let result = (data || []).map(c => ({
      ...c,
      order_count: c.orders?.length || 0
    }))

    if (search) {
      const s = search.toLowerCase()
      result = result.filter(c => 
        (c.display_name && c.display_name.toLowerCase().includes(s)) ||
        (c.phone && c.phone.includes(s))
      )
    }

    return result
  } catch (error) {
    console.error('Error in getCustomers:', error)
    return []
  }
}

export async function getCustomerById(id: string) {
  if (!supabaseAdmin) return null
  try {
    const { data: customer, error } = await supabaseAdmin
      .from('customers')
      .select(`
        *,
        orders (*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    
    // Sort orders by created_at desc and take top 10
    if (customer && customer.orders) {
      customer.orders = customer.orders
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10)
    }

    return customer
  } catch (error) {
    console.error(`Error in getCustomerById(${id}):`, error)
    return null
  }
}

export async function getBannedCustomers() {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return []
  try {
    const { data, error } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('is_banned', true)
      .order('banned_at', { ascending: false })
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error in getBannedCustomers:', error)
    return []
  }
}

export async function banCustomer(id: string, reason: string) {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return null
  try {
    // ดึง ban_count ปัจจุบันก่อน
    const { data: existing } = await supabaseAdmin
      .from('customers')
      .select('ban_count')
      .eq('id', id)
      .single()

    const { data, error } = await supabaseAdmin
      .from('customers')
      .update({
        is_banned: true,
        ban_reason: reason,
        banned_at: new Date().toISOString(),
        ban_count: (existing?.ban_count || 0) + 1,
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  } catch (error) {
    console.error(`Error in banCustomer(${id}):`, error)
    return null
  }
}

export async function unbanCustomer(id: string) {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return null
  try {
    const { data, error } = await supabaseAdmin
      .from('customers')
      .update({
        is_banned: false,
        ban_reason: null,
        banned_at: null,
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  } catch (error) {
    console.error(`Error in unbanCustomer(${id}):`, error)
    return null
  }
}
