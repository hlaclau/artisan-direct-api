import { OpenAPIHono } from '@hono/zod-openapi'
import { notImplemented } from '../../lib/problem.ts'
import { stubRoute } from '../../lib/stub-route.ts'

const tag = 'Interventions'

export const interventionsRoutes = new OpenAPIHono()
  .openapi(
    stubRoute({
      method: 'post',
      path: '/api/interventions',
      tag,
      summary: 'Create an intervention request',
    }),
    notImplemented,
  )
  .openapi(
    stubRoute({
      method: 'get',
      path: '/api/interventions',
      tag,
      summary: 'List my intervention requests',
    }),
    notImplemented,
  )
  .openapi(
    stubRoute({
      method: 'get',
      path: '/api/interventions/{id}',
      tag,
      summary: 'Get an intervention request',
    }),
    notImplemented,
  )
  .openapi(
    stubRoute({
      method: 'patch',
      path: '/api/interventions/{id}',
      tag,
      summary: 'Update an intervention request',
    }),
    notImplemented,
  )
  .openapi(
    stubRoute({
      method: 'delete',
      path: '/api/interventions/{id}',
      tag,
      summary: 'Delete an intervention request',
    }),
    notImplemented,
  )
  .openapi(
    stubRoute({
      method: 'post',
      path: '/api/interventions/{id}/submissions',
      tag,
      summary: 'Send the request to artisans',
    }),
    notImplemented,
  )
  .openapi(
    stubRoute({
      method: 'get',
      path: '/api/interventions/{id}/status',
      tag,
      summary: 'Follow the status of an intervention',
    }),
    notImplemented,
  )
  .openapi(
    stubRoute({
      method: 'patch',
      path: '/api/interventions/{id}/status',
      tag,
      summary: 'Update the status of an intervention',
    }),
    notImplemented,
  )
