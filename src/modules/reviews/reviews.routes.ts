import { OpenAPIHono } from '@hono/zod-openapi'
import { notImplemented } from '../../lib/problem.ts'
import { stubRoute } from '../../lib/stub-route.ts'

const tag = 'Reviews'

export const reviewsRoutes = new OpenAPIHono()
  .openapi(
    stubRoute({ method: 'post', path: '/api/reviews', tag, summary: 'Leave a review' }),
    notImplemented,
  )
  .openapi(
    stubRoute({
      method: 'get',
      path: '/api/reviews',
      tag,
      summary: 'List reviews (filter by artisan)',
      access: 'public',
    }),
    notImplemented,
  )
  .openapi(
    stubRoute({
      method: 'get',
      path: '/api/reviews/{id}',
      tag,
      summary: 'Get a review',
      access: 'public',
    }),
    notImplemented,
  )
