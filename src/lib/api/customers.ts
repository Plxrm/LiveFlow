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
