import { getSupabaseAdmin } from '../supabase/admin'
const supabaseAdmin = getSupabaseAdmin()

export async function getDashboardStats() {
  const defaultStats = { totalOrders: 0, pendingOrders: 0, todayRevenue: 0, totalCustomers: 0 }
  try {
    if (!supabaseAdmin) {
      return defaultStats
    }

    const { count: totalOrders } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true })

    const { count: pendingOrders } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    const { count: totalCustomers } = await supabaseAdmin
      .from('customers')
      .select('*', { count: 'exact', head: true })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { data: revenueData } = await supabaseAdmin
      .from('orders')
      .select('total')
      .in('status', ['paid', 'completed'])
      .gte('created_at', today.toISOString())

    const todayRevenue = revenueData?.reduce((sum, order) => sum + (order.total || 0), 0) || 0

    return {
      totalOrders: totalOrders || 0,
      pendingOrders: pendingOrders || 0,
      todayRevenue: todayRevenue,
      totalCustomers: totalCustomers || 0,
    }
  } catch (error) {
    console.error('Error in getDashboardStats:', error)
    return defaultStats
  }
}

export async function getRecentOrders() {
  try {
    if (!supabaseAdmin) {
      return []
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .select(`
        order_number,
        total,
        status,
        created_at,
        customers ( display_name )
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) throw error

    return (data || []).map(order => ({
      order_number: order.order_number,
      total: order.total,
      status: order.status,
      created_at: order.created_at,
      customer_name: (order.customers as any)?.display_name || 'ลูกค้า',
    }))
  } catch (error) {
    console.error('Error in getRecentOrders:', error)
    return []
  }
}

export async function getPendingPayments() {
  try {
    if (!supabaseAdmin) {
      return []
    }

    const { data, error } = await supabaseAdmin
      .from('payments')
      .select(`
        amount,
        slip_url,
        created_at,
        orders!inner (
          order_number,
          customers ( display_name )
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []).map(payment => {
      const order = payment.orders as any
      return {
        order_number: order?.order_number || 'N/A',
        customer_name: order?.customers?.display_name || 'ลูกค้า',
        amount: payment.amount,
        slip_url: payment.slip_url,
        created_at: payment.created_at,
      }
    })
  } catch (error) {
    console.error('Error in getPendingPayments:', error)
    return []
  }
}

export async function getActiveLiveSession() {
  try {
    if (!supabaseAdmin) {
      return null
    }

    const { data: session, error } = await supabaseAdmin
      .from('live_sessions')
      .select('id, title')
      .eq('status', 'live')
      .limit(1)
      .maybeSingle()

    if (error) throw error
    if (!session) return null

    const { count: productCount } = await supabaseAdmin
      .from('live_products')
      .select('*', { count: 'exact', head: true })
      .eq('live_session_id', session.id)

    return {
      id: session.id,
      title: session.title,
      product_count: productCount || 0,
    }
  } catch (error) {
    console.error('Error in getActiveLiveSession:', error)
    return null
  }
}
