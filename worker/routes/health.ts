import { Hono } from 'hono'

export const healthRoute = new Hono()

/**
 * Health check endpoint
 * Used by monitoring tools and load balancers to verify the API worker is running.
 */
healthRoute.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
  })
})
