import { eq, inArray } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '../../app.ts'
import { db } from '../../db/index.ts'
import { user, workerProfile } from '../../db/schema.ts'
import type { Role } from '../../middlewares/require-role.ts'

const password = 'correct-horse-battery'
const emails: string[] = []

const postAuth = (path: string, body: unknown) =>
  app.request(`/api/auth${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'http://localhost:3000',
    },
    body: JSON.stringify(body),
  })

const cookieHeader = (res: Response) =>
  res.headers
    .getSetCookie()
    .map((cookie) => cookie.split(';')[0])
    .join('; ')

const createSessionCookie = async (role: Role) => {
  const email = `artisan-create-${role}-${crypto.randomUUID()}@example.com`
  emails.push(email)

  await postAuth('/sign-up/email', {
    email,
    password,
    name: role,
    signupRole: role === 'admin' ? 'customer' : role,
  })
  if (role === 'admin') {
    await db.update(user).set({ role }).where(eq(user.email, email))
  }

  const res = await postAuth('/sign-in/email', { email, password })
  expect(res.status).toBe(200)

  const [row] = await db.select({ id: user.id }).from(user).where(eq(user.email, email))
  return { cookie: cookieHeader(res), userId: row!.id }
}

const siret = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(14)), (byte) => String(byte % 10)).join('')

const payload = (overrides: Record<string, unknown> = {}) => ({
  companyName: 'Dupont Plomberie',
  siret: siret(),
  phone: '0612345678',
  description: 'Plombier depuis 15 ans',
  address: '12 rue de la République',
  postalCode: '69001',
  city: 'Lyon',
  country: 'France',
  departureAddress: '12 rue de la République',
  departurePostalCode: '69001',
  departureCity: 'Lyon',
  departureLatitude: 45.767,
  departureLongitude: 4.836,
  serviceRadiusKm: 30,
  ...overrides,
})

const postArtisan = (cookie: string | undefined, body: unknown) =>
  app.request('/api/artisans', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'http://localhost:3000',
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  })

type Artisan = {
  id: string
  userId: string
  companyName: string
  siret: string
  phone: string
  description: string | null
  address: string
  postalCode: string
  city: string
  country: string
  departureAddress: string
  departurePostalCode: string
  departureCity: string
  departureLatitude: number | null
  departureLongitude: number | null
  serviceRadiusKm: number
  validationStatus: string
  validationReason: string | null
}

const sessions = {} as Record<'customer' | 'worker' | 'admin', { cookie: string; userId: string }>

beforeAll(async () => {
  sessions.customer = await createSessionCookie('customer')
  sessions.worker = await createSessionCookie('worker')
  sessions.admin = await createSessionCookie('admin')
})

afterAll(async () => {
  if (emails.length === 0) return

  const owners = await db.select({ id: user.id }).from(user).where(inArray(user.email, emails))
  const ids = owners.map((owner) => owner.id)

  if (ids.length === 0) return

  await db.delete(workerProfile).where(inArray(workerProfile.userId, ids))
  await db.delete(user).where(inArray(user.id, ids))
})

describe('POST /api/artisans', () => {
  it('returns 401 without a session cookie', async () => {
    const res = await postArtisan(undefined, payload())

    expect(res.status).toBe(401)
  })

  it('returns 403 when the role is not worker', async () => {
    const [customer, admin] = await Promise.all([
      postArtisan(sessions.customer.cookie, payload()),
      postArtisan(sessions.admin.cookie, payload()),
    ])

    expect(customer.status).toBe(403)
    expect(admin.status).toBe(403)
  })

  it('returns 400 when the SIRET is not 14 digits', async () => {
    const res = await postArtisan(sessions.worker.cookie, payload({ siret: '123' }))

    expect(res.status).toBe(400)
  })

  it('returns 400 when a required field is missing', async () => {
    const body = payload()
    const res = await postArtisan(sessions.worker.cookie, {
      siret: body.siret,
      phone: body.phone,
      address: body.address,
      postalCode: body.postalCode,
      city: body.city,
      departureAddress: body.departureAddress,
      departurePostalCode: body.departurePostalCode,
      departureCity: body.departureCity,
    })

    expect(res.status).toBe(400)
  })

  it('returns 400 when only one coordinate is set', async () => {
    const res = await postArtisan(sessions.worker.cookie, payload({ departureLongitude: null }))

    expect(res.status).toBe(400)
  })

  it('creates a pending profile for the signed-in worker', async () => {
    const worker = await createSessionCookie('worker')
    const body = payload({ validationStatus: 'approved' })
    const res = await postArtisan(worker.cookie, body)
    const created = (await res.json()) as Artisan

    expect(res.status).toBe(201)
    expect(created).toMatchObject({
      userId: worker.userId,
      companyName: body.companyName,
      siret: body.siret,
      phone: body.phone,
      description: body.description,
      address: body.address,
      postalCode: body.postalCode,
      city: body.city,
      country: 'France',
      departureAddress: body.departureAddress,
      departurePostalCode: body.departurePostalCode,
      departureCity: body.departureCity,
      departureLatitude: 45.767,
      departureLongitude: 4.836,
      serviceRadiusKm: 30,
      validationStatus: 'pending',
      validationReason: null,
    })

    const [row] = await db.select().from(workerProfile).where(eq(workerProfile.id, created.id))
    expect(row?.userId).toBe(worker.userId)
    expect(row?.validationStatus).toBe('pending')
    expect(row?.siret).toBe(body.siret)
  })

  it('applies defaults when optional fields are omitted', async () => {
    const worker = await createSessionCookie('worker')
    const body = payload()
    const res = await postArtisan(worker.cookie, {
      companyName: body.companyName,
      siret: body.siret,
      phone: body.phone,
      address: body.address,
      postalCode: body.postalCode,
      city: body.city,
      departureAddress: body.departureAddress,
      departurePostalCode: body.departurePostalCode,
      departureCity: body.departureCity,
    })
    const created = (await res.json()) as Artisan

    expect(res.status).toBe(201)
    expect(created).toMatchObject({
      description: null,
      country: 'France',
      departureLatitude: null,
      departureLongitude: null,
      serviceRadiusKm: 20,
      validationStatus: 'pending',
    })
  })

  it('returns 409 when the worker already has a profile', async () => {
    const worker = await createSessionCookie('worker')
    const first = await postArtisan(worker.cookie, payload())
    expect(first.status).toBe(201)

    const res = await postArtisan(worker.cookie, payload())

    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({ message: 'Artisan profile already exists' })
  })

  it('returns 409 when the SIRET is already used', async () => {
    const first = await createSessionCookie('worker')
    const second = await createSessionCookie('worker')
    const sharedSiret = siret()

    const created = await postArtisan(first.cookie, payload({ siret: sharedSiret }))
    expect(created.status).toBe(201)

    const res = await postArtisan(second.cookie, payload({ siret: sharedSiret }))

    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({ message: 'SIRET already used' })
  })
})
