import { z } from '@hono/zod-openapi'
import { ValidationStatusSchema } from '../account/account.schemas.ts'
import { ArtisanProfileSchema, DocumentSchema } from '../artisan-profile/artisan-profile.schemas.ts'

export const AdminArtisansQuerySchema = z.object({
  status: ValidationStatusSchema.optional().openapi({ example: 'pending' }),
})

export const AdminArtisanSummarySchema = z
  .object({
    id: z.uuid(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.email(),
    validationStatus: ValidationStatusSchema,
    submittedAt: z.iso.datetime(),
  })
  .openapi('AdminArtisanSummary')

export const AdminArtisanDetailSchema = ArtisanProfileSchema.extend({
  firstName: z.string(),
  lastName: z.string(),
  email: z.email(),
  documents: z.array(DocumentSchema),
}).openapi('AdminArtisanDetail')

export const RejectBodySchema = z
  .object({
    reason: z.string().min(1).max(1000).openapi({ example: 'Insurance certificate expired' }),
  })
  .openapi('RejectBody')

export const DocumentParamsSchema = z.object({
  id: z.uuid().openapi({ param: { name: 'id', in: 'path' } }),
  documentId: z.uuid().openapi({ param: { name: 'documentId', in: 'path' } }),
})
