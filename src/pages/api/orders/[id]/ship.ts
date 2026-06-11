import type { APIRoute } from 'astro'

export const POST: APIRoute = async (context) => {
  try {
    const { params } = context
    const { getSupabaseAdmin } = await import('../../../../lib/supabase/admin')
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 503, headers: { 'Content-Type': 'application/json' } })
    }

    // ดึง runtime env จาก Cloudflare
    const runtimeEnv = (context.locals as any)?.runtime?.env || {}
    const { getKexConfig } = await import('../../../../lib/kex/get-config')
    const kexConfig = getKexConfig(runtimeEnv)

    console.log('KEX config check:', {
      hasAppKey: !!kexConfig.appKey,
      hasAppId: !!kexConfig.appId,
      hasMerchantId: !!kexConfig.merchantId,
      env: kexConfig.env
    })

    if (!kexConfig.appKey) {
      return new Response(
        JSON.stringify({ error: 'KEX API ยังไม่ได้ตั้งค่า' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // ดึง order + customer
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        customers(*),
        order_items(*, products:product_id(*))
      `)
      .eq('id', params.id)
      .single()

    if (!order) {
      return new Response(JSON.stringify({ error: 'ไม่พบออเดอร์' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
    }

    // เช็ค status
    if (order.status !== 'paid') {
      return new Response(JSON.stringify({ error: `ออเดอร์สถานะ "${order.status}" ต้องเป็น "paid" เท่านั้น` }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    const customer = order.customers

    // เช็คที่อยู่ครบ
    if (!customer) {
      return new Response(JSON.stringify({ error: 'ไม่พบข้อมูลลูกค้า' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    if (!customer.phone) {
      return new Response(JSON.stringify({ error: 'ลูกค้าไม่มีเบอร์โทร' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    const address = customer.address_detail || customer.address || ''
    const subdistrict = customer.subdistrict || ''
    const zipcode = customer.zipcode || ''

    if (!address || !zipcode) {
      return new Response(
        JSON.stringify({
          error: 'ลูกค้ายังไม่ได้กรอกที่อยู่จัดส่ง',
          missing: { address: !address, zipcode: !zipcode }
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log('Ship order:', {
      orderId: order.id,
      customer: customer.display_name,
      phone: customer.phone,
      address,
      subdistrict,
      zipcode
    })

    // เรียก createOrderShipment พร้อม kexConfig
    const { createOrderShipment } = await import('../../../../lib/api/shipping')
    const result = await createOrderShipment(order.id, kexConfig)

    console.log('Ship result:', result)

    if (result?.error) {
      return new Response(JSON.stringify({ error: result.error }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ success: true, shipment: result }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('Ship error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
