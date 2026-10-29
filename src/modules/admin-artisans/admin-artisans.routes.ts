import { OpenAPIHono } from '@hono/zod-openapi'
import { PaginationQuerySchema, paginated, UuidParamSchema } from '../../lib/pagination.ts'
import { notImplemented } from '../../lib/problem.ts'
import { jsonBody, ok, route } from '../../lib/route.ts'
import {
  AdminArtisanDetailSchema,
  AdminArtisansQuerySchema,
  AdminArtisanSummarySchema,
  DocumentParamsSchema,
  RejectBodySchema,
} from './admin-artisans.schemas.ts'

const tag = 'Admin'
const binary = { type: 'string', format: 'binary' } as const

const listRoute = route({
  method: 'get',
  path: '/api/admin/artisans',
  tag,
  summary: 'List artisans to validate',
  description: 'Paginated, filterable by validation status (ADP-47).',
  request: { query: PaginationQuerySchema.extend(AdminArtisansQuerySchema.shape) },
  responses: {
    200: ok('A page of artisans', paginated(AdminArtisanSummarySchema, 'AdminArtisanPage')),
  },
  errors: [400, 403, 501],
})

const detailRoute = route({
  method: 'get',
  path: '/api/admin/artisans/{id}',
  tag,
  summary: 'Get an artisan with their documents',
  request: { params: UuidParamSchema },
  responses: { 200: ok('Artisan detail', AdminArtisanDetailSchema) },
  errors: [403, 404, 501],
})

const downloadRoute = route({
  method: 'get',
  path: '/api/admin/artisans/{id}/documents/{documentId}',
  tag,
  summary: 'Download a supporting document',
  request: { params: DocumentParamsSchema },
  responses: {
    200: {
      description: 'The file',
      content: {
        'application/pdf': { schema: binary },
        'image/jpeg': { schema: binary },
        'image/png': { schema: binary },
      },
    },
  },
  errors: [403, 404, 501],
})

const approveRoute = route({
  method: 'post',
  path: '/api/admin/artisans/{id}/approve',
  tag,
  summary: 'Approve an artisan',
  description: 'Answers 409 if the artisan was already approved or rejected.',
  request: { params: UuidParamSchema },
  responses: { 200: ok('The approved artisan', AdminArtisanDetailSchema) },
  errors: [403, 404, 409, 501],
})

const rejectRoute = route({
  method: 'post',
  path: '/api/admin/artisans/{id}/reject',
  tag,
  summary: 'Reject an artisan',
  description: 'A reason is required and shown to the artisan. Answers 409 if already decided.',
  request: { params: UuidParamSchema, body: jsonBody(RejectBodySchema) },
  responses: { 200: ok('The rejected artisan', AdminArtisanDetailSchema) },
  errors: [400, 403, 404, 409, 501],
})

export const adminArtisansRoutes = new OpenAPIHono()
  .openapi(listRoute, notImplemented)
  .openapi(detailRoute, notImplemented)
  .openapi(downloadRoute, notImplemented)
  .openapi(approveRoute, notImplemented)
  .openapi(rejectRoute, notImplemented)
