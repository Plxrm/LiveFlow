import type { APIRoute } from 'astro'
import crypto from 'node:crypto'
import { handleLineWebhook } from '../../../lib/line/webhook-handler'

function verifySignature(body: string, signature: string) {
  const secret = import.meta.env.LINE_CHANNEL_SECRET
  if (!secret) return false
  const hash = crypto
    .createHmac('SHA256', secret)
    .update(body)
    .digest('base64')
  return hash === signature
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const signature = request.headers.get('x-line-signature')
    if (!signature) {
      return new Response('Unauthorized', { status: 401 })
    }

    const bodyText = await request.text()
    if (!verifySignature(bodyText, signature)) {
      return new Response('Invalid Signature', { status: 401 })
    }

    const body = JSON.parse(bodyText)
    await handleLineWebhook(body)

    return new Response('OK', { status: 200 })
  } catch (error: any) {
    console.error('Webhook Error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
