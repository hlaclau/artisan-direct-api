import { OpenAPIHono } from '@hono/zod-openapi'
import { notImplemented } from '../../lib/problem.ts'
import { jsonBody, ok, route } from '../../lib/route.ts'
import { ChooseRoleBodySchema, MeSchema, UpdateMeBodySchema } from './account.schemas.ts'

const tag = 'Account'

const getMeRoute = route({
  method: 'get',
  path: '/api/me',
  tag,
  summary: 'Get the signed-in user',
  description: 'User, role and, for an artisan, the validation status.',
  responses: { 200: ok('The signed-in user', MeSchema) },
  errors: [501],
})

const updateMeRoute = route({
  method: 'patch',
  path: '/api/me',
  tag,
  summary: 'Update the signed-in user',
  description: 'Partial update of first and last name. The role cannot be changed here.',
  request: { body: jsonBody(UpdateMeBodySchema) },
  responses: { 200: ok('The updated user', MeSchema) },
  errors: [400, 501],
})

const chooseRoleRoute = route({
  method: 'patch',
  path: '/api/me/role',
  tag,
  summary: 'Choose the account role (once)',
  description:
    'Only for a signed-in user without a role. `admin` can never be chosen. Answers 409 if a role is already set.',
  request: { body: jsonBody(ChooseRoleBodySchema) },
  responses: { 200: ok('The user with its new role', MeSchema) },
  errors: [400, 409, 501],
})

const deleteMeRoute = route({
  method: 'delete',
  path: '/api/me',
  tag,
  summary: 'Delete the signed-in account',
  description: 'The last admin account cannot be deleted (409).',
  responses: { 204: { description: 'Account deleted' } },
  errors: [409, 501],
})

export const accountRoutes = new OpenAPIHono()
  .openapi(getMeRoute, notImplemented)
  .openapi(updateMeRoute, notImplemented)
  .openapi(chooseRoleRoute, notImplemented)
  .openapi(deleteMeRoute, notImplemented)
