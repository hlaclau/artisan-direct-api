import { OpenAPIHono } from '@hono/zod-openapi'
import { notImplemented } from '../../lib/problem.ts'
import { stubRoute } from '../../lib/stub-route.ts'

const tag = 'Search'

export const artisanSearchRoutes = new OpenAPIHono()
  .openapi(
    stubRoute({
      method: 'get',
      path: '/api/artisans',
      tag,
      summary: 'Search artisans (filters, sort, pagination, geolocation)',
      access: 'public',
    }),
    notImplemented,
  )
  .openapi(
    stubRoute({
      method: 'get',
      path: '/api/artisans/{id}',
      tag,
      summary: 'Get an artisan public profile',
      access: 'public',
    }),
    notImplemented,
  )
