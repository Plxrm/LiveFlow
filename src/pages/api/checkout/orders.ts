import type { APIRoute } from 'astro'
import { getSupabaseAdmin } from '../../../lib/supabase/admin'
import { getSettings } from '../../../lib/api/settings'

/**
 * GET /api/checkout/orders?customer=<id>&order=<id>
 * Returns pending/confirmed orders for a customer, plus settings and customer data.
 */
export const GET: APIRoute = async ({ url }) => {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    return new Response(JSON.stringify({ error: 'Service unavailable' }), { status: 503 })
  }

  const customerId = url.searchParams.get('customer') || ''
  const specificOrderId = url.searchParams.get('order') || ''

  try {
    // Fetch customer
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single()

    if (!customer) {
      return new Response(JSON.stringify({ error: 'Customer not found' }), { status: 404 })
    }

    // Fetch pending/confirmed orders
    let ordersQuery = supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items(id, product_name, price, quantity, product_id)
      `)
      .eq('customer_id', customerId)
      .in('status', ['pending', 'confirmed'])
      .order('created_at', { ascending: true })

    if (specificOrderId) {
      ordersQuery = ordersQuery.eq('id', specificOrderId)
    }

    const { data: orders } = await ordersQuery

    // Fetch settings (payment method + slip verify method)
    const settings = await getSettings()

    const safeSettings = {
      payment_method: settings.payment_method,
      bank_name: settings.bank_name,
      bank_account_number: settings.bank_account_number,
      bank_account_name: settings.bank_account_name,
      payment_qr_image: settings.payment_qr_image,
      payment_qr_text: settings.payment_qr_text,
      promptpay_number: settings.promptpay_number,
      promptpay_name: settings.promptpay_name,
      slip_verify_method: settings.slip_verify_method,
    }

    return new Response(
      JSON.stringify({ orders: orders || [], customer, settings: safeSettings }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    console.error('checkout/orders error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
