import { OpenAPIHono } from '@hono/zod-openapi'
import { notImplemented } from '../../lib/problem.ts'
import { jsonBody, ok, route } from '../../lib/route.ts'
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

const tag = 'Artisan'
const upload = {
  required: true as const,
  content: { 'multipart/form-data': { schema: UploadBodySchema } },
}

const listTradesRoute = route({
  method: 'get',
  path: '/api/trades',
  tag,
  public: true,
  summary: 'List the trades',
  description: 'Reference list of trades an artisan can pick from. Public.',
  responses: { 200: ok('All trades', TradesListSchema) },
  errors: [501],
})

const getProfileRoute = route({
  method: 'get',
  path: '/api/artisans/me',
  tag,
  summary: 'Get my artisan profile',
  description: 'Includes the validation status and, if rejected, the reason (ADP-118).',
  responses: { 200: ok('My profile', ArtisanProfileSchema) },
  errors: [403, 501],
})

const updateProfileRoute = route({
  method: 'patch',
  path: '/api/artisans/me',
  tag,
  summary: 'Update my artisan profile',
  description: 'Partial update: SIRET (14 digits), address, phone, description.',
  request: { body: jsonBody(UpdateArtisanProfileBodySchema) },
  responses: { 200: ok('The updated profile', ArtisanProfileSchema) },
  errors: [400, 403, 501],
})

const setTradesRoute = route({
  method: 'put',
  path: '/api/artisans/me/trades',
  tag,
  summary: 'Replace my trades',
  description: 'At least one trade is required.',
  request: { body: jsonBody(SetTradesBodySchema) },
  responses: { 200: ok('My trades', TradesListSchema) },
  errors: [400, 403, 404, 501],
})

const setRatesRoute = route({
  method: 'put',
  path: '/api/artisans/me/rates',
  tag,
  summary: 'Replace my indicative rates',
  request: { body: jsonBody(RatesSchema) },
  responses: { 200: ok('My rates', RatesSchema) },
  errors: [400, 403, 501],
})

const getServiceAreaRoute = route({
  method: 'get',
  path: '/api/artisans/me/service-area',
  tag,
  summary: 'Get my service area',
  responses: { 200: ok('My service area', ServiceAreaSchema) },
  errors: [403, 404, 501],
})

const setServiceAreaRoute = route({
  method: 'put',
  path: '/api/artisans/me/service-area',
  tag,
  summary: 'Replace my service area',
  description: 'Starting address and intervention radius in km.',
  request: { body: jsonBody(ServiceAreaSchema) },
  responses: { 200: ok('My service area', ServiceAreaSchema) },
  errors: [400, 403, 501],
})

const listPhotosRoute = route({
  method: 'get',
  path: '/api/artisans/me/photos',
  tag,
  summary: 'List my photos',
  responses: { 200: ok('My photos', PhotosListSchema) },
  errors: [403, 501],
})

const addPhotoRoute = route({
  method: 'post',
  path: '/api/artisans/me/photos',
  tag,
  summary: 'Add a photo',
  description: 'JPEG or PNG. Maximum count and size to be defined: 409 when the count is reached.',
  request: { body: upload },
  responses: {
    201: {
      ...ok('The created photo', PhotoSchema),
      headers: { Location: { schema: { type: 'string' } } },
    },
  },
  errors: [400, 403, 409, 413, 415, 501],
})

const deletePhotoRoute = route({
  method: 'delete',
  path: '/api/artisans/me/photos/{photoId}',
  tag,
  summary: 'Delete a photo',
  request: { params: PhotoIdParamSchema },
  responses: { 204: { description: 'Photo deleted' } },
  errors: [403, 404, 501],
})

const listDocumentsRoute = route({
  method: 'get',
  path: '/api/artisans/me/documents',
  tag,
  summary: 'List my supporting documents',
  description: 'Identity document and insurance certificate (metadata only).',
  responses: { 200: ok('My documents', DocumentsListSchema) },
  errors: [403, 501],
})

const putDocumentRoute = route({
  method: 'put',
  path: '/api/artisans/me/documents/{type}',
  tag,
  summary: 'Upload or replace a supporting document',
  description:
    'PDF, JPEG or PNG. Replaces the existing document of that type, e.g. a rejected one.',
  request: { params: DocumentTypeParamSchema, body: upload },
  responses: { 200: ok('The stored document', DocumentSchema) },
  errors: [400, 403, 413, 415, 501],
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
