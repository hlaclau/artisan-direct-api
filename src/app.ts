import { OpenAPIHono } from '@hono/zod-openapi'
import { Scalar } from '@scalar/hono-api-reference'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { auth } from './auth.ts'
import { trustedOrigin } from './config.ts'
import { groupByImplementation } from './lib/contract-groups.ts'
import { accountRoutes } from './modules/account/account.routes.ts'
import { adminArtisansRoutes } from './modules/admin-artisans/admin-artisans.routes.ts'
import { artisanProfileRoutes } from './modules/artisan-profile/artisan-profile.routes.ts'
import { artisanSearchRoutes } from './modules/artisan-search/artisan-search.routes.ts'
import { diagnosticRoutes } from './modules/diagnostic/diagnostic.routes.ts'
import { healthRoutes } from './modules/health/health.routes.ts'
import { interventionsRoutes } from './modules/interventions/interventions.routes.ts'
import { notificationsRoutes } from './modules/notifications/notifications.routes.ts'
import { paymentsRoutes } from './modules/payments/payments.routes.ts'
import { planningRoutes } from './modules/planning/planning.routes.ts'
import { quotesRoutes } from './modules/quotes/quotes.routes.ts'
import { reviewsRoutes } from './modules/reviews/reviews.routes.ts'

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
app.route('/', accountRoutes)
// Registered before the search routes: `/api/artisans/me` must win over `/api/artisans/{id}`.
app.route('/', artisanProfileRoutes)
app.route('/', planningRoutes)
app.route('/', artisanSearchRoutes)
app.route('/', adminArtisansRoutes)
app.route('/', diagnosticRoutes)
app.route('/', interventionsRoutes)
app.route('/', quotesRoutes)
app.route('/', paymentsRoutes)
app.route('/', reviewsRoutes)
app.route('/', notificationsRoutes)

app.openAPIRegistry.registerComponent('securitySchemes', 'cookieAuth', {
  type: 'apiKey',
  in: 'cookie',
  name: 'better-auth.session_token',
})

const tags = [
  { name: 'Auth', description: 'Sign-up, sign-in and session (Better Auth)' },
  { name: 'Account', description: 'The signed-in user: profile, role, deletion' },
  { name: 'Artisan', description: 'The artisan profile and its supporting documents' },
  { name: 'Admin', description: 'Admin only: artisan validation' },
  { name: 'Search', description: 'Public artisan search and profiles' },
  { name: 'Diagnostic' },
  { name: 'Interventions' },
  { name: 'Quotes' },
  { name: 'Planning' },
  { name: 'Payments' },
  { name: 'Reviews' },
  { name: 'Notifications' },
  { name: 'health' },
]

const authBasePath = '/api/auth'
let authSchema: ReturnType<typeof auth.api.generateOpenAPISchema> | undefined

// Merges Better Auth's generated schema (paths are relative to its base path) into our document.
app.get('/openapi.json', async (c) => {
  const doc = app.getOpenAPI31Document({
    openapi: '3.1.0',
    info: {
      title: 'ArtisansDirect API',
      version: '0.0.0',
      description: [
        'Reference contract between the ArtisansDirect back and front.',
        '',
        '- Auth: session cookie set by Better Auth (`credentials: include`), no Authorization header.',
        '- Errors: `application/problem+json` (RFC 9457), see the `Problem` schema.',
        '- Lists: `?page&pageSize` and `{ data, meta: { page, pageSize, total } }`.',
        '- Routes answering 501 are part of the contract but not implemented yet: they are listed under "Contract only".',
      ].join('\n'),
    },
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

  const grouped = groupByImplementation({ ...doc.paths, ...authPaths }, tags)

  return c.json({
    ...doc,
    ...grouped,
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
