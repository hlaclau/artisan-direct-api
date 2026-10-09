import { OpenAPIHono } from '@hono/zod-openapi'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { healthRoutes } from './modules/health/health.routes.ts'

export const app = new OpenAPIHono()

app.use(logger())
app.use(cors())

app.route('/', healthRoutes)

app.doc('/openapi.json', {
  openapi: '3.1.0',
  info: { title: 'ArtisansDirect API', version: '0.0.0' },
})
