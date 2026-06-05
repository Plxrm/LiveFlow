import type { APIRoute } from 'astro'
import { getAllTemplates, createTemplate } from '../../../lib/api/messages'

export const GET: APIRoute = async () => {
  try {
    const grouped = await getAllTemplates()
    return new Response(JSON.stringify(grouped), {
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

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json()

    if (!body.step || !body.msg_type) {
      return new Response(
        JSON.stringify({ error: 'step and msg_type are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const template = await createTemplate({
      step: body.step,
      msg_type: body.msg_type,
      content: body.content,
      image_url: body.image_url,
      sort_order: body.sort_order ?? 0,
    })

    if (!template) {
      return new Response(JSON.stringify({ error: 'Failed to create template' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify(template), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
