import type { APIRoute } from 'astro'
import { updateShipmentStatus } from '../../../../lib/api/shipping'

export const GET: APIRoute = async (context) => {
  try {
    const shipmentId = context.params.id as string

    // ดึง runtime env จาก Cloudflare
    const runtimeEnv = (context.locals as any)?.runtime?.env || {}
    const { getKexConfig } = await import('../../../../lib/kex/get-config')
    const kexConfig = getKexConfig(runtimeEnv)

    const result = await updateShipmentStatus(shipmentId, kexConfig)

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
