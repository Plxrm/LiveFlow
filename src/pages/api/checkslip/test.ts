import type { APIRoute } from 'astro'
import { getCreditBalance } from '../../../lib/checkslip/client'

/**
 * POST /api/checkslip/test
 * Body (optional JSON): { token: string }
 * Tests Check-Slip API connectivity by fetching credit balance.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    let tokenOverride: string | undefined
    try {
      const body = await request.json()
      tokenOverride = body?.token || undefined
    } catch {
      // no body → use settings token
    }

    const result = await getCreditBalance(tokenOverride)

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error?.message || 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
