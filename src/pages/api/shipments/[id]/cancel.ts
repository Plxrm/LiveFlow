import type { APIRoute } from 'astro'
import { cancelOrderShipment } from '../../../../lib/api/shipping'

export const POST: APIRoute = async (context) => {
  try {
    const shipmentId = context.params.id as string

    // ดึง runtime env จาก Cloudflare
    const runtimeEnv = (context.locals as any)?.runtime?.env || {}
    const { getKexConfig } = await import('../../../../lib/kex/get-config')
    const kexConfig = getKexConfig(runtimeEnv)

    const success = await cancelOrderShipment(shipmentId, kexConfig)

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
