import { OpenAPIHono } from '@hono/zod-openapi'
import { notImplemented } from '../../lib/problem.ts'
import { stubRoute } from '../../lib/stub-route.ts'

const tag = 'Quotes'

export const quotesRoutes = new OpenAPIHono()
  .openapi(
    stubRoute({
      method: 'post',
      path: '/api/quotes',
      tag,
      summary: 'Create a quote (artisan)',
      access: 'artisan',
    }),
    notImplemented,
  )
  .openapi(
    stubRoute({ method: 'get', path: '/api/quotes', tag, summary: 'List my quotes' }),
    notImplemented,
  )
  .openapi(
    stubRoute({ method: 'get', path: '/api/quotes/{id}', tag, summary: 'Get a quote' }),
    notImplemented,
  )
  .openapi(
    stubRoute({
      method: 'patch',
      path: '/api/quotes/{id}',
      tag,
      summary: 'Update a quote (artisan)',
      access: 'artisan',
    }),
    notImplemented,
  )
  .openapi(
    stubRoute({ method: 'post', path: '/api/quotes/{id}/accept', tag, summary: 'Accept a quote' }),
    notImplemented,
  )
  .openapi(
    stubRoute({
      method: 'post',
      path: '/api/quotes/{id}/decline',
      tag,
      summary: 'Decline a quote',
    }),
    notImplemented,
  )
