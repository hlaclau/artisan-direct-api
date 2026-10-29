import { OpenAPIHono } from '@hono/zod-openapi'
import { notImplemented } from '../../lib/problem.ts'
import { stubRoute } from '../../lib/stub-route.ts'

const tag = 'Notifications'

export const notificationsRoutes = new OpenAPIHono()
  .openapi(
    stubRoute({ method: 'get', path: '/api/notifications', tag, summary: 'List my notifications' }),
    notImplemented,
  )
  .openapi(
    stubRoute({
      method: 'get',
      path: '/api/notifications/preferences',
      tag,
      summary: 'Get my notification preferences',
    }),
    notImplemented,
  )
  .openapi(
    stubRoute({
      method: 'put',
      path: '/api/notifications/preferences',
      tag,
      summary: 'Replace my notification preferences',
    }),
    notImplemented,
  )
  .openapi(
    stubRoute({
      method: 'patch',
      path: '/api/notifications/{id}',
      tag,
      summary: 'Mark a notification as read',
    }),
    notImplemented,
  )
