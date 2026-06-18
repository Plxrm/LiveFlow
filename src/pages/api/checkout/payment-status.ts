import type { APIRoute } from 'astro'
import { getSupabaseAdmin } from '../../../lib/supabase/admin'

/**
 * GET /api/checkout/payment-status?order_ids=id1,id2
 * Returns { allConfirmed, anyRejected, payments }
 */
export const GET: APIRoute = async ({ request }) => {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    return new Response(JSON.stringify({ error: 'Service unavailable' }), { status: 503 })
  }

  try {
    const url = new URL(request.url)
    const orderIdsParam = url.searchParams.get('order_ids')
    if (!orderIdsParam) {
      return new Response(JSON.stringify({ error: 'Missing order_ids' }), { status: 400 })
    }

    const orderIds = orderIdsParam.split(',').filter(Boolean)

    const { data: payments, error } = await supabaseAdmin
      .from('payments')
      .select('id, order_id, status, verified_at')
      .in('order_id', orderIds)
      .order('created_at', { ascending: false })

    if (error) throw error

    const paymentsData = payments || []

    // For each order, get the latest payment status
    const latestByOrder: Record<string, string> = {}
    for (const p of paymentsData) {
      if (!latestByOrder[p.order_id]) {
        latestByOrder[p.order_id] = p.status
      }
    }

    const statuses = Object.values(latestByOrder)
    const allConfirmed = orderIds.length > 0 &&
      orderIds.every(id => latestByOrder[id] === 'confirmed')
    const anyRejected = statuses.some(s => s === 'rejected')

    return new Response(
      JSON.stringify({ allConfirmed, anyRejected, payments: paymentsData }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    console.error('payment-status error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
