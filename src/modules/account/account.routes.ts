import { createRoute, OpenAPIHono, type z } from '@hono/zod-openapi'
import { notImplemented, problemResponses } from '../../lib/problem.ts'
import { ChooseRoleBodySchema, MeSchema, UpdateMeBodySchema } from './account.schemas.ts'

const tags = ['Account']
const security = [{ cookieAuth: [] }]
const json = <T extends z.ZodType>(schema: T) => ({ 'application/json': { schema } })

const getMeRoute = createRoute({
  method: 'get',
  path: '/api/me',
  tags,
  security,
  summary: 'Get the signed-in user',
  description: 'User, role and, for an artisan, the validation status.',
  responses: {
    200: { description: 'The signed-in user', content: json(MeSchema) },
    ...problemResponses(401, 501),
  },
})

const updateMeRoute = createRoute({
  method: 'patch',
  path: '/api/me',
  tags,
  security,
  summary: 'Update the signed-in user',
  description: 'Partial update of first and last name. The role cannot be changed here.',
  request: { body: { required: true, content: json(UpdateMeBodySchema) } },
  responses: {
    200: { description: 'The updated user', content: json(MeSchema) },
    ...problemResponses(400, 401, 501),
  },
})

const chooseRoleRoute = createRoute({
  method: 'patch',
  path: '/api/me/role',
  tags,
  security,
  summary: 'Choose the account role (once)',
  description:
    'Only for a signed-in user without a role. `admin` can never be chosen. Answers 409 if a role is already set.',
  request: { body: { required: true, content: json(ChooseRoleBodySchema) } },
  responses: {
    200: { description: 'The user with its new role', content: json(MeSchema) },
    ...problemResponses(400, 401, 409, 501),
  },
})

const deleteMeRoute = createRoute({
  method: 'delete',
  path: '/api/me',
  tags,
  security,
  summary: 'Delete the signed-in account',
  description: 'The last admin account cannot be deleted (409).',
  responses: {
    204: { description: 'Account deleted' },
    ...problemResponses(401, 409, 501),
  },
})

export const accountRoutes = new OpenAPIHono()
  .openapi(getMeRoute, notImplemented)
  .openapi(updateMeRoute, notImplemented)
  .openapi(chooseRoleRoute, notImplemented)
  .openapi(deleteMeRoute, notImplemented)
