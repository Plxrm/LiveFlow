import type { APIRoute } from 'astro'
import { updateTemplate, deleteTemplate } from '../../../lib/api/messages'

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const id = params.id as string
    if (!id) {
      return new Response(JSON.stringify({ error: 'id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const body = await request.json()
    const template = await updateTemplate(id, body)

    if (!template) {
      return new Response(JSON.stringify({ error: 'Failed to update template' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify(template), {
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

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const id = params.id as string
    if (!id) {
      return new Response(JSON.stringify({ error: 'id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const success = await deleteTemplate(id)

    if (!success) {
      return new Response(JSON.stringify({ error: 'Failed to delete template' }), {
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
