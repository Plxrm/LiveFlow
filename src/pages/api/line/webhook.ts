import type { APIRoute } from 'astro'

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({ status: 'ok' }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.text()

    // ถ้า body ว่าง → return 200
    if (!body) {
      return new Response(
        JSON.stringify({ status: 'ok' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    let parsed: any
    try {
      parsed = JSON.parse(body)
    } catch {
      return new Response(
        JSON.stringify({ status: 'ok' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // LINE Verify request — events ว่างหรือไม่มี
    if (!parsed.events || parsed.events.length === 0) {
      return new Response(
        JSON.stringify({ status: 'ok' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // ลองดึง settings แต่ถ้าพังก็ไม่ block
    let secret = ''
    try {
      const { getSettings } = await import(
        '../../../lib/api/settings'
      )
      const settings = await getSettings()
      secret = settings.line_channel_secret || ''
    } catch (e) {
      console.error('Settings error:', e)
    }

    // Verify signature ถ้ามี secret
    if (secret) {
      const signature = request.headers
        .get('x-line-signature') || ''
      try {
        const crypto = await import('node:crypto')
        const hash = crypto
          .createHmac('SHA256', secret)
          .update(body)
          .digest('base64')
        if (hash !== signature) {
          console.error('Invalid LINE signature')
          return new Response(
            JSON.stringify({ status: 'invalid signature' }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        }
      } catch (e) {
        console.error('Crypto error:', e)
      }
    }

    // Handle events — ถ้าพังก็ไม่ block
    try {
      const { handleLineWebhook } = await import(
        '../../../lib/line/webhook-handler'
      )
      await handleLineWebhook(parsed)
    } catch (e) {
      console.error('Webhook handler error:', e)
    }

    return new Response(
      JSON.stringify({ status: 'ok' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Webhook fatal error:', err)
    // แม้ error ก็ return 200 เพื่อไม่ให้ LINE retry
    return new Response(
      JSON.stringify({ status: 'error' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
