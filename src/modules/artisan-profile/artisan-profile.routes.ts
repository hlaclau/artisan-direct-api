import { createRoute, OpenAPIHono, type z } from '@hono/zod-openapi'
import { notImplemented, problemResponses } from '../../lib/problem.ts'
import {
  ArtisanProfileSchema,
  DocumentSchema,
  DocumentsListSchema,
  DocumentTypeParamSchema,
  PhotoIdParamSchema,
  PhotoSchema,
  PhotosListSchema,
  RatesSchema,
  ServiceAreaSchema,
  SetTradesBodySchema,
  TradesListSchema,
  UpdateArtisanProfileBodySchema,
  UploadBodySchema,
} from './artisan-profile.schemas.ts'

const tags = ['Artisan']
const security = [{ cookieAuth: [] }]
const json = <T extends z.ZodType>(schema: T) => ({ 'application/json': { schema } })
const upload = { 'multipart/form-data': { schema: UploadBodySchema } }

const listTradesRoute = createRoute({
  method: 'get',
  path: '/api/trades',
  tags,
  summary: 'List the trades',
  description: 'Reference list of trades an artisan can pick from. Public.',
  responses: {
    200: { description: 'All trades', content: json(TradesListSchema) },
    ...problemResponses(501),
  },
})

const getProfileRoute = createRoute({
  method: 'get',
  path: '/api/artisans/me',
  tags,
  security,
  summary: 'Get my artisan profile',
  description: 'Includes the validation status and, if rejected, the reason (ADP-118).',
  responses: {
    200: { description: 'My profile', content: json(ArtisanProfileSchema) },
    ...problemResponses(401, 403, 501),
  },
})

const updateProfileRoute = createRoute({
  method: 'patch',
  path: '/api/artisans/me',
  tags,
  security,
  summary: 'Update my artisan profile',
  description: 'Partial update: SIRET (14 digits), address, phone, description.',
  request: { body: { required: true, content: json(UpdateArtisanProfileBodySchema) } },
  responses: {
    200: { description: 'The updated profile', content: json(ArtisanProfileSchema) },
    ...problemResponses(400, 401, 403, 501),
  },
})

const setTradesRoute = createRoute({
  method: 'put',
  path: '/api/artisans/me/trades',
  tags,
  security,
  summary: 'Replace my trades',
  description: 'At least one trade is required.',
  request: { body: { required: true, content: json(SetTradesBodySchema) } },
  responses: {
    200: { description: 'My trades', content: json(TradesListSchema) },
    ...problemResponses(400, 401, 403, 404, 501),
  },
})

const setRatesRoute = createRoute({
  method: 'put',
  path: '/api/artisans/me/rates',
  tags,
  security,
  summary: 'Replace my indicative rates',
  request: { body: { required: true, content: json(RatesSchema) } },
  responses: {
    200: { description: 'My rates', content: json(RatesSchema) },
    ...problemResponses(400, 401, 403, 501),
  },
})

const getServiceAreaRoute = createRoute({
  method: 'get',
  path: '/api/artisans/me/service-area',
  tags,
  security,
  summary: 'Get my service area',
  responses: {
    200: { description: 'My service area', content: json(ServiceAreaSchema) },
    ...problemResponses(401, 403, 404, 501),
  },
})

const setServiceAreaRoute = createRoute({
  method: 'put',
  path: '/api/artisans/me/service-area',
  tags,
  security,
  summary: 'Replace my service area',
  description: 'Starting address and intervention radius in km.',
  request: { body: { required: true, content: json(ServiceAreaSchema) } },
  responses: {
    200: { description: 'My service area', content: json(ServiceAreaSchema) },
    ...problemResponses(400, 401, 403, 501),
  },
})

const listPhotosRoute = createRoute({
  method: 'get',
  path: '/api/artisans/me/photos',
  tags,
  security,
  summary: 'List my photos',
  responses: {
    200: { description: 'My photos', content: json(PhotosListSchema) },
    ...problemResponses(401, 403, 501),
  },
})

const addPhotoRoute = createRoute({
  method: 'post',
  path: '/api/artisans/me/photos',
  tags,
  security,
  summary: 'Add a photo',
  description: 'JPEG or PNG. Maximum count and size to be defined: 409 when the count is reached.',
  request: { body: { required: true, content: upload } },
  responses: {
    201: {
      description: 'The created photo',
      headers: { Location: { schema: { type: 'string' } } },
      content: json(PhotoSchema),
    },
    ...problemResponses(400, 401, 403, 409, 413, 415, 501),
  },
})

const deletePhotoRoute = createRoute({
  method: 'delete',
  path: '/api/artisans/me/photos/{photoId}',
  tags,
  security,
  summary: 'Delete a photo',
  request: { params: PhotoIdParamSchema },
  responses: {
    204: { description: 'Photo deleted' },
    ...problemResponses(401, 403, 404, 501),
  },
})

const listDocumentsRoute = createRoute({
  method: 'get',
  path: '/api/artisans/me/documents',
  tags,
  security,
  summary: 'List my supporting documents',
  description: 'Identity document and insurance certificate (metadata only).',
  responses: {
    200: { description: 'My documents', content: json(DocumentsListSchema) },
    ...problemResponses(401, 403, 501),
  },
})

const putDocumentRoute = createRoute({
  method: 'put',
  path: '/api/artisans/me/documents/{type}',
  tags,
  security,
  summary: 'Upload or replace a supporting document',
  description:
    'PDF, JPEG or PNG. Replaces the existing document of that type, e.g. a rejected one.',
  request: { params: DocumentTypeParamSchema, body: { required: true, content: upload } },
  responses: {
    200: { description: 'The stored document', content: json(DocumentSchema) },
    ...problemResponses(400, 401, 403, 413, 415, 501),
  },
})

export const artisanProfileRoutes = new OpenAPIHono()
  .openapi(listTradesRoute, notImplemented)
  .openapi(getProfileRoute, notImplemented)
  .openapi(updateProfileRoute, notImplemented)
  .openapi(setTradesRoute, notImplemented)
  .openapi(setRatesRoute, notImplemented)
  .openapi(getServiceAreaRoute, notImplemented)
  .openapi(setServiceAreaRoute, notImplemented)
  .openapi(listPhotosRoute, notImplemented)
  .openapi(addPhotoRoute, notImplemented)
  .openapi(deletePhotoRoute, notImplemented)
  .openapi(listDocumentsRoute, notImplemented)
  .openapi(putDocumentRoute, notImplemented)
