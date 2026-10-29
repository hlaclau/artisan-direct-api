import { OpenAPIHono } from '@hono/zod-openapi'
import { notImplemented } from '../../lib/problem.ts'
import { stubRoute } from '../../lib/stub-route.ts'

const tag = 'Payments'

export const paymentsRoutes = new OpenAPIHono()
  .openapi(
    stubRoute({ method: 'post', path: '/api/payments', tag, summary: 'Start a payment' }),
    notImplemented,
  )
  .openapi(
    stubRoute({ method: 'get', path: '/api/payments', tag, summary: 'List my payments' }),
    notImplemented,
  )
  .openapi(
    stubRoute({ method: 'get', path: '/api/payments/{id}', tag, summary: 'Get a payment' }),
    notImplemented,
  )
