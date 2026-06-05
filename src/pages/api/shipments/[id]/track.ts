import type { APIRoute } from 'astro'
import { updateShipmentStatus } from '../../../../lib/api/shipping'

export const GET: APIRoute = async ({ params }) => {
  try {
    const shipmentId = params.id as string
    const result = await updateShipmentStatus(shipmentId)

    if (!result) {
      return new Response(JSON.stringify({ error: 'ไม่สามารถดึงสถานะได้' }), { status: 404 })
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    console.error('Track endpoint error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
