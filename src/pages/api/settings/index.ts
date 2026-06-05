import type { APIRoute } from 'astro'
import { getSettings, updateSettings } from '../../../lib/api/settings'

export const GET: APIRoute = async () => {
  try {
    const settings = await getSettings()
    return new Response(JSON.stringify(settings), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json()
    const settings = await updateSettings(body)
    return new Response(JSON.stringify(settings), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
