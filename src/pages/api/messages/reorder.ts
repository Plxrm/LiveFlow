import type { APIRoute } from 'astro'
import { reorderTemplates } from '../../../lib/api/messages'

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json()

    if (!body.updates || !Array.isArray(body.updates)) {
      return new Response(
        JSON.stringify({ error: 'updates array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const success = await reorderTemplates(body.updates)

    if (!success) {
      return new Response(JSON.stringify({ error: 'Failed to reorder templates' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
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
