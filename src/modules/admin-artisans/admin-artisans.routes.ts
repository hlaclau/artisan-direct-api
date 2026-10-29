import { createRoute, OpenAPIHono, type z } from '@hono/zod-openapi'
import { PaginationQuerySchema, paginated, UuidParamSchema } from '../../lib/pagination.ts'
import { notImplemented, problemResponses } from '../../lib/problem.ts'
import {
  AdminArtisanDetailSchema,
  AdminArtisansQuerySchema,
  AdminArtisanSummarySchema,
  DocumentParamsSchema,
  RejectBodySchema,
} from './admin-artisans.schemas.ts'

const tags = ['Admin']
const security = [{ cookieAuth: [] }]
const json = <T extends z.ZodType>(schema: T) => ({ 'application/json': { schema } })

const listRoute = createRoute({
  method: 'get',
  path: '/api/admin/artisans',
  tags,
  security,
  summary: 'List artisans to validate',
  description: 'Paginated, filterable by validation status (ADP-47).',
  request: { query: PaginationQuerySchema.extend(AdminArtisansQuerySchema.shape) },
  responses: {
    200: {
      description: 'A page of artisans',
      content: json(paginated(AdminArtisanSummarySchema, 'AdminArtisanPage')),
    },
    ...problemResponses(400, 401, 403, 501),
  },
})

const detailRoute = createRoute({
  method: 'get',
  path: '/api/admin/artisans/{id}',
  tags,
  security,
  summary: 'Get an artisan with their documents',
  request: { params: UuidParamSchema },
  responses: {
    200: { description: 'Artisan detail', content: json(AdminArtisanDetailSchema) },
    ...problemResponses(401, 403, 404, 501),
  },
})

const downloadRoute = createRoute({
  method: 'get',
  path: '/api/admin/artisans/{id}/documents/{documentId}',
  tags,
  security,
  summary: 'Download a supporting document',
  request: { params: DocumentParamsSchema },
  responses: {
    200: {
      description: 'The file',
      content: {
        'application/pdf': { schema: { type: 'string', format: 'binary' } },
        'image/jpeg': { schema: { type: 'string', format: 'binary' } },
        'image/png': { schema: { type: 'string', format: 'binary' } },
      },
    },
    ...problemResponses(401, 403, 404, 501),
  },
})

const approveRoute = createRoute({
  method: 'post',
  path: '/api/admin/artisans/{id}/approve',
  tags,
  security,
  summary: 'Approve an artisan',
  description: 'Answers 409 if the artisan was already approved or rejected.',
  request: { params: UuidParamSchema },
  responses: {
    200: { description: 'The approved artisan', content: json(AdminArtisanDetailSchema) },
    ...problemResponses(401, 403, 404, 409, 501),
  },
})

const rejectRoute = createRoute({
  method: 'post',
  path: '/api/admin/artisans/{id}/reject',
  tags,
  security,
  summary: 'Reject an artisan',
  description: 'A reason is required and shown to the artisan. Answers 409 if already decided.',
  request: { params: UuidParamSchema, body: { required: true, content: json(RejectBodySchema) } },
  responses: {
    200: { description: 'The rejected artisan', content: json(AdminArtisanDetailSchema) },
    ...problemResponses(400, 401, 403, 404, 409, 501),
  },
})

export const adminArtisansRoutes = new OpenAPIHono()
  .openapi(listRoute, notImplemented)
  .openapi(detailRoute, notImplemented)
  .openapi(downloadRoute, notImplemented)
  .openapi(approveRoute, notImplemented)
  .openapi(rejectRoute, notImplemented)
