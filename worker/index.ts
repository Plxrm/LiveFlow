import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { healthRoute } from './routes/health'
import { lineRoute } from './routes/line'

const app = new Hono()

// Global middleware
app.use('*', cors())

// Routes
app.route('/', healthRoute)
app.route('/api/line', lineRoute)

export default app
