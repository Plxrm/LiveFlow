import { Hono } from 'hono'

export const lineRoute = new Hono()

/**
 * LINE Messaging API Webhook
 * Receives events from LINE Platform and processes them.
 *
 * TODO: Implement signature verification and event handling
 */
lineRoute.post('/webhook', async (c) => {
  try {
    const body = await c.req.json()

    // TODO: Verify X-Line-Signature header
    // TODO: Process LINE events (message, follow, unfollow, etc.)

    console.log('[LINE Webhook] Received events:', JSON.stringify(body, null, 2))

    return c.json({ ok: true }, 200)
  } catch (error) {
    console.error('[LINE Webhook] Error:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})
