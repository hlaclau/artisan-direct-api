import { z } from '@hono/zod-openapi'
import { ValidationStatusSchema } from '../account/account.schemas.ts'

export const TradeSchema = z
  .object({
    id: z.uuid(),
    slug: z.string().openapi({ example: 'plumber' }),
    name: z.string().openapi({ example: 'Plombier' }),
  })
  .openapi('Trade')

export const RatesSchema = z
  .object({
    // indicative prices in euros, shown to clients before a quote
    hourlyRate: z.number().min(0).nullable().openapi({ example: 55 }),
    travelFee: z.number().min(0).nullable().openapi({ example: 20 }),
  })
  .openapi('Rates')

export const ServiceAreaSchema = z
  .object({
    address: z.string().openapi({ example: '12 rue de la République, 69001 Lyon' }),
    latitude: z.number().min(-90).max(90).openapi({ example: 45.767 }),
    longitude: z.number().min(-180).max(180).openapi({ example: 4.836 }),
    radiusKm: z.number().int().min(1).max(500).openapi({ example: 30 }),
  })
  .openapi('ServiceArea')

export const DocumentTypeSchema = z.enum(['identity', 'insurance']).openapi('DocumentType')

export const DocumentSchema = z
  .object({
    id: z.uuid(),
    type: DocumentTypeSchema,
    fileName: z.string().openapi({ example: 'assurance-2026.pdf' }),
    mimeType: z.enum(['application/pdf', 'image/jpeg', 'image/png']),
    sizeBytes: z.number().int(),
    uploadedAt: z.iso.datetime(),
  })
  .openapi('ArtisanDocument')

export const PhotoSchema = z
  .object({
    id: z.uuid(),
    // shape depends on the storage choice (signed URL vs direct stream): open point
    url: z.url(),
    createdAt: z.iso.datetime(),
  })
  .openapi('ArtisanPhoto')

export const ArtisanProfileSchema = z
  .object({
    id: z.uuid(),
    userId: z.uuid(),
    validationStatus: ValidationStatusSchema,
    rejectionReason: z.string().nullable(),
    decidedAt: z.iso.datetime().nullable(),
    siret: z
      .string()
      .regex(/^\d{14}$/)
      .nullable()
      .openapi({ example: '12345678901234' }),
    address: z.string().nullable(),
    phone: z.string().nullable().openapi({ example: '+33612345678' }),
    description: z.string().nullable(),
    trades: z.array(TradeSchema),
    rates: RatesSchema,
    serviceArea: ServiceAreaSchema.nullable(),
  })
  .openapi('ArtisanProfile')

export const UpdateArtisanProfileBodySchema = z
  .object({
    siret: z
      .string()
      .regex(/^\d{14}$/, 'Must be 14 digits')
      .optional(),
    address: z.string().min(1).max(300).optional(),
    phone: z.string().min(6).max(20).optional(),
    description: z.string().max(2000).optional(),
  })
  .openapi('UpdateArtisanProfileBody')

export const TradesListSchema = z.object({ data: z.array(TradeSchema) }).openapi('TradesList')

export const SetTradesBodySchema = z
  .object({ tradeIds: z.array(z.uuid()).min(1) })
  .openapi('SetTradesBody')

export const DocumentsListSchema = z
  .object({ data: z.array(DocumentSchema) })
  .openapi('ArtisanDocumentsList')

export const PhotosListSchema = z
  .object({ data: z.array(PhotoSchema) })
  .openapi('ArtisanPhotosList')

export const UploadBodySchema = z
  .object({
    file: z.any().openapi({ type: 'string', format: 'binary', description: 'PDF, JPEG or PNG' }),
  })
  .openapi('UploadBody')

export const DocumentTypeParamSchema = z.object({
  type: DocumentTypeSchema.openapi({ param: { name: 'type', in: 'path' } }),
})

export const PhotoIdParamSchema = z.object({
  photoId: z.uuid().openapi({ param: { name: 'photoId', in: 'path' } }),
})
