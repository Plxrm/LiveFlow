import type { APIRoute } from 'astro'
import { unbanCustomer } from '../../../../lib/api/customers'

export const PUT: APIRoute = async ({ params }) => {
  const id = params.id as string
  try {
    const customer = await unbanCustomer(id)
    if (!customer) {
      return new Response(JSON.stringify({ error: 'Customer not found or unban failed' }), {
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
