import { OpenAPIHono } from '@hono/zod-openapi'
import { Scalar } from '@scalar/hono-api-reference'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { auth } from './auth.ts'
import { healthRoutes } from './modules/health/health.routes.ts'

export const app = new OpenAPIHono()

app.use(logger())
app.use(
  cors({
    origin: (origin) => origin,
    credentials: true,
  }),
)

app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw))

app.route('/', healthRoutes)

app.doc('/openapi.json', {
  openapi: '3.1.0',
  info: { title: 'ArtisansDirect API', version: '0.0.0' },
})

app.get(
  '/docs',
  Scalar({
    url: '/openapi.json',
    pageTitle: 'ArtisansDirect API',
    theme: 'deepSpace',
    defaultHttpClient: { targetKey: 'js', clientKey: 'fetch' },
    hideClientButton: true,
    telemetry: false,
  }),
)
