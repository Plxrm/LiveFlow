import type { APIRoute } from 'astro'
import { supabaseAdmin } from '../../../../lib/supabase/admin'
import { createOrderShipment } from '../../../../lib/api/shipping'

export const POST: APIRoute = async ({ params }) => {
  if (!supabaseAdmin) {
    return new Response(JSON.stringify({ error: 'Supabase not configured' }), { status: 503 })
  }
  try {
    const orderId = params.id as string

    // ตรวจสอบว่า order status = 'paid' ก่อนจัดส่ง
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, status, order_number')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: 'ไม่พบออเดอร์' }), { status: 404 })
    }

    if (order.status !== 'paid') {
      return new Response(
        JSON.stringify({ error: `ไม่สามารถจัดส่งได้ สถานะออเดอร์ปัจจุบัน: ${order.status} (ต้องเป็น paid)` }),
        { status: 400 }
      )
    }

    const result = await createOrderShipment(orderId)

    if (!result) {
      return new Response(JSON.stringify({ error: 'สร้างพัสดุไม่สำเร็จ' }), { status: 500 })
    }

    if ('error' in result) {
      return new Response(JSON.stringify(result), { status: 400 })
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    console.error('Ship endpoint error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
