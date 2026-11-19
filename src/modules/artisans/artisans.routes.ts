import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import { auth } from '../../auth.ts'
import { db } from '../../db/index.ts'
import { workerProfile } from '../../db/schema.ts'
import { requireAuth } from '../../middlewares/require-auth.ts'
import { requireRole } from '../../middlewares/require-role.ts'

const createArtisanBodySchema = z
  .object({
    companyName: z.string().trim().min(1).max(200),
    siret: z.string().regex(/^\d{14}$/, 'SIRET must be 14 digits'),
    phone: z.string().trim().min(6).max(20),
    description: z.string().trim().max(2000).nullish(),
    address: z.string().trim().min(1).max(300),
    postalCode: z.string().trim().min(1).max(10),
    city: z.string().trim().min(1).max(100),
    country: z.string().trim().min(1).max(100).nullish(),
    departureAddress: z.string().trim().min(1).max(300),
    departurePostalCode: z.string().trim().min(1).max(10),
    departureCity: z.string().trim().min(1).max(100),
    departureLatitude: z.number().min(-90).max(90).nullish(),
    departureLongitude: z.number().min(-180).max(180).nullish(),
    serviceRadiusKm: z.number().int().min(1).max(100).nullish(),
  })
  .superRefine((body, ctx) => {
    const hasLatitude = body.departureLatitude != null
    const hasLongitude = body.departureLongitude != null
    if (hasLatitude === hasLongitude) return

    ctx.addIssue({
      code: 'custom',
      message: 'departureLatitude and departureLongitude must be set together',
      path: [hasLatitude ? 'departureLongitude' : 'departureLatitude'],
    })
  })

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
  departureAddress: z.string(),
  departurePostalCode: z.string(),
  departureCity: z.string(),
  departureLatitude: z.number().nullable(),
  departureLongitude: z.number().nullable(),
  serviceRadiusKm: z.number().int(),
  validationStatus: z.string(),
  validationReason: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

const errorSchema = z.object({ message: z.string() })

type WorkerProfileRow = typeof workerProfile.$inferSelect

const toCoordinate = (value: string | null) => (value === null ? null : Number(value))

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
  departureAddress: row.departureAddress,
  departurePostalCode: row.departurePostalCode,
  departureCity: row.departureCity,
  departureLatitude: toCoordinate(row.departureLatitude),
  departureLongitude: toCoordinate(row.departureLongitude),
  serviceRadiusKm: row.serviceRadiusKm,
  validationStatus: row.validationStatus,
  validationReason: row.validationReason,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
})

const blankToNull = (value: string | null | undefined) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

const toNumeric = (value: number | null | undefined) => (value == null ? null : value.toFixed(7))

const uniqueConstraint = (error: unknown): string | undefined => {
  const seen = new Set<unknown>()
  let current: unknown = error

  while (current && typeof current === 'object' && !seen.has(current)) {
    seen.add(current)
    if ('code' in current && current.code === '23505') {
      if ('constraint_name' in current && typeof current.constraint_name === 'string') {
        return current.constraint_name
      }
      if ('constraint' in current && typeof current.constraint === 'string') {
        return current.constraint
      }
    }
    current = 'cause' in current ? current.cause : undefined
  }

  return undefined
}

const createRouteDef = createRoute({
  method: 'post',
  path: '/',
  tags: ['Artisans'],
  summary: 'Create my artisan profile',
  description:
    'Creates the signed-in worker profile. Validation stays pending until an admin reviews it.',
  request: {
    body: {
      required: true,
      content: {
        'application/json': { schema: createArtisanBodySchema },
      },
    },
  },
  responses: {
    201: {
      description: 'Artisan profile created',
      content: { 'application/json': { schema: artisanSchema } },
    },
    409: {
      description: 'This worker already has a profile, or the SIRET is already used',
      content: { 'application/json': { schema: errorSchema } },
    },
  },
})

type Env = {
  Variables: {
    session: typeof auth.$Infer.Session | null
  }
}

export const artisansRouter = new OpenAPIHono<Env>()

artisansRouter.use('*', requireAuth, requireRole(['worker']))

artisansRouter.openapi(createRouteDef, async (c) => {
  const session = c.get('session')
  if (!session) throw new HTTPException(401)

  const body = c.req.valid('json')
  const userId = session.user.id

  const [existing] = await db
    .select({ id: workerProfile.id })
    .from(workerProfile)
    .where(eq(workerProfile.userId, userId))
    .limit(1)

  if (existing) {
    return c.json({ message: 'Artisan profile already exists' }, 409)
  }

  const [siretTaken] = await db
    .select({ id: workerProfile.id })
    .from(workerProfile)
    .where(eq(workerProfile.siret, body.siret))
    .limit(1)

  if (siretTaken) {
    return c.json({ message: 'SIRET already used' }, 409)
  }

  try {
    const [created] = await db
      .insert(workerProfile)
      .values({
        id: crypto.randomUUID(),
        userId,
        companyName: body.companyName,
        siret: body.siret,
        phone: body.phone,
        description: blankToNull(body.description),
        address: body.address,
        postalCode: body.postalCode,
        city: body.city,
        country: body.country ?? 'France',
        departureAddress: body.departureAddress,
        departurePostalCode: body.departurePostalCode,
        departureCity: body.departureCity,
        departureLatitude: toNumeric(body.departureLatitude),
        departureLongitude: toNumeric(body.departureLongitude),
        serviceRadiusKm: body.serviceRadiusKm ?? 20,
        validationStatus: 'pending',
        validationReason: null,
      })
      .returning()

    if (!created) throw new Error('Insert returned no row')

    return c.json(serialize(created), 201)
  } catch (error) {
    const constraint = uniqueConstraint(error)
    if (constraint === 'worker_profile_user_id_unique') {
      return c.json({ message: 'Artisan profile already exists' }, 409)
    }
    if (constraint === 'worker_profile_siret_unique') {
      return c.json({ message: 'SIRET already used' }, 409)
    }
    throw error
  }
})
