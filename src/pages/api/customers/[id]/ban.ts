import type { APIRoute } from 'astro'
import { banCustomer } from '../../../../lib/api/customers'

export const PUT: APIRoute = async ({ params, request }) => {
  const id = params.id as string
  try {
    const body = await request.json()
    const reason = body.reason || 'แบนโดยแอดมิน'
    const customer = await banCustomer(id, reason)
    if (!customer) {
      return new Response(JSON.stringify({ error: 'Customer not found or ban failed' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return new Response(JSON.stringify(customer), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
