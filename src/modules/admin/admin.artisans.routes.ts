import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'

// Adjust these imports to your project layout
import { db } from '../../db'
import { workerProfile } from '../../db/schema'
import { requireAuth } from '../../middlewares/require-auth'
import { requireRole } from '../../middlewares/require-role'

const validationStatusSchema = z.enum(['pending', 'approved', 'rejected'])

const artisanSchema = z.object({
  id: z.string(),
  userId: z.string(),
  companyName: z.string(),
  siret: z.string(),
  phone: z.string(),
  description: z.string().nullable(),
  address: z.string(),
  postalCode: z.string(),
  city: z.string(),
  country: z.string(),
  serviceRadiusKm: z.number().int(),
  validationStatus: z.string(),
  validationReason: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

const errorSchema = z.object({ message: z.string() })

const idParamSchema = z.object({
  id: z.string().openapi({ param: { name: 'id', in: 'path' } }),
})

type WorkerProfileRow = typeof workerProfile.$inferSelect

const serialize = (row: WorkerProfileRow): z.infer<typeof artisanSchema> => ({
  id: row.id,
  userId: row.userId,
  companyName: row.companyName,
  siret: row.siret,
  phone: row.phone,
  description: row.description,
  address: row.address,
  postalCode: row.postalCode,
  city: row.city,
  country: row.country,
  serviceRadiusKm: row.serviceRadiusKm,
  validationStatus: row.validationStatus,
  validationReason: row.validationReason,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
})

const listRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Admin / Artisans'],
  summary: 'List artisans by validation status (default: pending)',
  request: {
    query: z.object({
      status: validationStatusSchema.default('pending'),
    }),
  },
  responses: {
    200: {
      description: 'Artisans matching the status',
      content: { 'application/json': { schema: z.array(artisanSchema) } },
    },
  },
})

const approveRoute = createRoute({
  method: 'post',
  path: '/{id}/approve',
  tags: ['Admin / Artisans'],
  summary: 'Approve an artisan',
  request: { params: idParamSchema },
  responses: {
    200: {
      description: 'Artisan approved',
      content: { 'application/json': { schema: artisanSchema } },
    },
    404: {
      description: 'Artisan not found',
      content: { 'application/json': { schema: errorSchema } },
    },
  },
})

const rejectRoute = createRoute({
  method: 'post',
  path: '/{id}/reject',
  tags: ['Admin / Artisans'],
  summary: 'Reject an artisan (reason required)',
  request: {
    params: idParamSchema,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: z.object({
            reason: z.string().trim().min(1, 'Reason is required').max(1000),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Artisan rejected',
      content: { 'application/json': { schema: artisanSchema } },
    },
    404: {
      description: 'Artisan not found',
      content: { 'application/json': { schema: errorSchema } },
    },
  },
})

export const adminArtisansRouter = new OpenAPIHono()

adminArtisansRouter.use('*', requireAuth, requireRole(['admin']))

adminArtisansRouter.openapi(listRoute, async (c) => {
  const { status } = c.req.valid('query')

  const rows = await db
    .select()
    .from(workerProfile)
    .where(eq(workerProfile.validationStatus, status))
    .orderBy(workerProfile.createdAt)

  return c.json(rows.map(serialize), 200)
})

adminArtisansRouter.openapi(approveRoute, async (c) => {
  const { id } = c.req.valid('param')

  const [updated] = await db
    .update(workerProfile)
    .set({ validationStatus: 'approved', validationReason: null })
    .where(eq(workerProfile.id, id))
    .returning()

  if (!updated) {
    return c.json({ message: 'Artisan not found' }, 404)
  }

  return c.json(serialize(updated), 200)
})

adminArtisansRouter.openapi(rejectRoute, async (c) => {
  const { id } = c.req.valid('param')
  const { reason } = c.req.valid('json')

  const [updated] = await db
    .update(workerProfile)
    .set({ validationStatus: 'rejected', validationReason: reason })
    .where(eq(workerProfile.id, id))
    .returning()

  if (!updated) {
    return c.json({ message: 'Artisan not found' }, 404)
  }

  return c.json(serialize(updated), 200)
})
