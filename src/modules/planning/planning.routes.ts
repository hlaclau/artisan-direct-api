import { OpenAPIHono } from '@hono/zod-openapi'
import { notImplemented } from '../../lib/problem.ts'
import { stubRoute } from '../../lib/stub-route.ts'

const tag = 'Planning'

export const planningRoutes = new OpenAPIHono()
  .openapi(
    stubRoute({
      method: 'get',
      path: '/api/artisans/me/availability',
      tag,
      summary: 'Get my availability',
      access: 'artisan',
    }),
    notImplemented,
  )
  .openapi(
    stubRoute({
      method: 'put',
      path: '/api/artisans/me/availability',
      tag,
      summary: 'Replace my availability',
      access: 'artisan',
    }),
    notImplemented,
  )
  .openapi(
    stubRoute({ method: 'post', path: '/api/appointments', tag, summary: 'Book an appointment' }),
    notImplemented,
  )
  .openapi(
    stubRoute({ method: 'get', path: '/api/appointments', tag, summary: 'List my appointments' }),
    notImplemented,
  )
  .openapi(
    stubRoute({
      method: 'get',
      path: '/api/appointments/{id}',
      tag,
      summary: 'Get an appointment',
    }),
    notImplemented,
  )
  .openapi(
    stubRoute({
      method: 'patch',
      path: '/api/appointments/{id}',
      tag,
      summary: 'Reschedule or cancel an appointment',
    }),
    notImplemented,
  )
