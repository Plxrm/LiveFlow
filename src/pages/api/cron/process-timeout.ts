import type { APIRoute } from 'astro'
import { processExpiredOrders, sendTimeoutWarnings } from '../../../lib/api/timeout'

export const GET: APIRoute = async () => {
  try {
    const [result, warned] = await Promise.all([
      processExpiredOrders(),
      sendTimeoutWarnings(),
    ])

    return new Response(
      JSON.stringify({
        ok: true,
        cancelled: result.cancelled,
        banned: result.banned,
        warned,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('process-timeout error:', error)
    return new Response(
      JSON.stringify({ ok: false, error: error?.message || 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
