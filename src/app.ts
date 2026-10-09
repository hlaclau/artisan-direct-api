import { OpenAPIHono } from '@hono/zod-openapi'
import { Scalar } from '@scalar/hono-api-reference'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { auth } from './auth.ts'
import { trustedOrigin } from './config.ts'
import { healthRoutes } from './modules/health/health.routes.ts'

export const app = new OpenAPIHono()

app.use(logger())
app.use(
  cors({
    origin: trustedOrigin,
    credentials: true,
  }),
)

app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw))

app.route('/', healthRoutes)

const authBasePath = '/api/auth'
let authSchema: ReturnType<typeof auth.api.generateOpenAPISchema> | undefined

// Merges Better Auth's generated schema (paths are relative to its base path) into our document.
app.get('/openapi.json', async (c) => {
  const doc = app.getOpenAPI31Document({
    openapi: '3.1.0',
    info: { title: 'ArtisansDirect API', version: '0.0.0' },
  })
  authSchema ??= auth.api.generateOpenAPISchema()
  const { paths, components } = await authSchema

  const authPaths = Object.fromEntries(
    Object.entries(paths ?? {}).map(([path, item]) => [
      `${authBasePath}${path}`,
      Object.fromEntries(
        Object.entries(item as Record<string, object>).map(([method, op]) => [
          method,
          { ...op, tags: ['Auth'] },
        ]),
      ),
    ]),
  )

  return c.json({
    ...doc,
    paths: { ...doc.paths, ...authPaths },
    components: {
      ...doc.components,
      schemas: { ...doc.components?.schemas, ...components?.schemas },
      securitySchemes: { ...doc.components?.securitySchemes, ...components?.securitySchemes },
    },
  })
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
