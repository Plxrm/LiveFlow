import type { APIRoute } from 'astro'
import { cancelOrderShipment } from '../../../../lib/api/shipping'

export const POST: APIRoute = async ({ params }) => {
  try {
    const shipmentId = params.id as string
    const success = await cancelOrderShipment(shipmentId)

    if (!success) {
      return new Response(JSON.stringify({ error: 'ยกเลิกพัสดุไม่สำเร็จ' }), { status: 400 })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    console.error('Cancel endpoint error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
