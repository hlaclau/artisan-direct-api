import { OpenAPIHono } from '@hono/zod-openapi'
import { notImplemented } from '../../lib/problem.ts'
import { stubRoute } from '../../lib/stub-route.ts'

const tag = 'Diagnostic'

export const diagnosticRoutes = new OpenAPIHono()
  .openapi(
    stubRoute({
      method: 'get',
      path: '/api/diagnostic/questions',
      tag,
      summary: 'Get the diagnostic questions',
      access: 'public',
    }),
    notImplemented,
  )
  .openapi(
    stubRoute({
      method: 'post',
      path: '/api/diagnostic',
      tag,
      summary: 'Submit diagnostic answers and get the matching trade',
      access: 'public',
    }),
    notImplemented,
  )
