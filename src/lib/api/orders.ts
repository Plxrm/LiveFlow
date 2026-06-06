import { supabaseAdmin } from '../supabase/admin'

export async function getOrders(filters?: {
  status?: string
  search?: string
  live_session_id?: string
}) {
  if (!supabaseAdmin) return []
  try {
    let query = supabaseAdmin
      .from('orders')
      .select(`
        id,
        order_number,
        total,
        status,
        created_at,
        live_sessions ( title ),
        customers ( display_name, line_user_id )
      `)
      .order('created_at', { ascending: false })

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }
    
    if (filters?.live_session_id) {
      query = query.eq('live_session_id', filters.live_session_id)
    }

    const { data, error } = await query
    if (error) throw error

    let result = (data || []).map(order => ({
      id: order.id,
      order_number: order.order_number,
      customer_name: (order.customers as any)?.display_name || 'ลูกค้า',
      customer_line_id: (order.customers as any)?.line_user_id || '',
      total: order.total,
      status: order.status,
      live_session_title: (order.live_sessions as any)?.title || null,
      created_at: order.created_at,
    }))

    if (filters?.search) {
      const s = filters.search.toLowerCase()
      result = result.filter(o => 
        o.order_number.toLowerCase().includes(s) || 
        o.customer_name.toLowerCase().includes(s)
      )
    }

    return result
  } catch (error) {
    console.error('Error in getOrders:', error)
    return []
  }
}

export async function getOrderById(id: string) {
  if (!supabaseAdmin) return null
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        customers (display_name, line_user_id, phone, address, address_detail, subdistrict, district, province, zipcode, picture_url),
        order_items (*, products(image_url)),
        payments (id, method, amount, status, slip_url, created_at, confirmed_at),
        shipments (id, carrier, tracking_number, label_pdf_url, status, kex_con_no, kex_ref_no, kex_lh_route, kex_del_route, kex_service_code, kex_status_desc, shipped_at, delivered_at, created_at)
      `)
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  } catch (error) {
    console.error(`Error in getOrderById(${id}):`, error)
    return null
  }
}

export async function getOrderStats() {
  const defaultStats = {
    pending: 0, confirmed: 0, paid: 0,
    shipping: 0, completed: 0, cancelled: 0,
    totalRevenue: 0
  }
  if (!supabaseAdmin) return defaultStats
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('status, total')
    
    if (error) throw error
    
    const stats = { ...defaultStats }
    if (data) {
      data.forEach(order => {
        if (order.status in stats) {
          (stats as any)[order.status]++
        }
        if (['paid', 'shipping', 'completed'].includes(order.status)) {
          stats.totalRevenue += (order.total || 0)
        }
      })
    }
    return stats
  } catch (error) {
    console.error('Error in getOrderStats:', error)
    return defaultStats
  }
}

export async function updateOrderStatus(id: string, status: string) {
  if (!supabaseAdmin) return null
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  } catch (error) {
    console.error(`Error in updateOrderStatus(${id}):`, error)
    return null
  }
}

export async function generateOrderNumber() {
  if (!supabaseAdmin) return 'LF-000000-000'
  try {
    const today = new Date()
    const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000))
    const dateStr = localDate.toISOString().slice(0,10).replace(/-/g, '')
    
    const { count, error } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .ilike('order_number', `LF-${dateStr}-%`)
      
    if (error) throw error
    
    const num = String((count || 0) + 1).padStart(3, '0')
    return `LF-${dateStr}-${num}`
  } catch (error) {
    console.error('Error generating order number:', error)
    return 'LF-000000-000'
  }
}
