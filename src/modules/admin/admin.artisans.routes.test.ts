import { eq, inArray } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '../../app.ts'
import { db } from '../../db/index.ts'
import { user, workerProfile } from '../../db/schema.ts'
import type { Role } from '../../middlewares/require-role.ts'

const password = 'correct-horse-battery'
const tag = crypto.randomUUID()

const emails = {
  customer: `admin-artisans-customer-${tag}@example.com`,
  worker: `admin-artisans-worker-${tag}@example.com`,
  admin: `admin-artisans-admin-${tag}@example.com`,
  pendingOlder: `admin-artisans-pending-older-${tag}@example.com`,
  pendingNewer: `admin-artisans-pending-newer-${tag}@example.com`,
  approved: `admin-artisans-approved-${tag}@example.com`,
}

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
    .map((c) => c.split(';')[0])
    .join('; ')

const createSessionCookie = async (role: Role) => {
  const email = emails[role]

  await postAuth('/sign-up/email', { email, password, name: role, signupRole: 'customer' })
  await db.update(user).set({ role }).where(eq(user.email, email))

  const res = await postAuth('/sign-in/email', { email, password })
  expect(res.status).toBe(200)

  return cookieHeader(res)
}

const siret = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(14)), (byte) => String(byte % 10)).join('')

const insertOwner = async (email: string) => {
  const id = crypto.randomUUID()
  await db.insert(user).values({ id, name: email, email })
  return id
}

const insertProfile = async (input: {
  userId: string
  companyName: string
  validationStatus: 'pending' | 'approved' | 'rejected'
  validationReason?: string | null
  createdAt: Date
}) => {
  const id = crypto.randomUUID()
  await db.insert(workerProfile).values({
    id,
    userId: input.userId,
    companyName: input.companyName,
    siret: siret(),
    phone: '0600000000',
    description: null,
    address: '1 rue de la Paix',
    postalCode: '75001',
    city: 'Paris',
    country: 'France',
    departureAddress: '1 rue de la Paix',
    departurePostalCode: '75001',
    departureCity: 'Paris',
    serviceRadiusKm: 20,
    validationStatus: input.validationStatus,
    validationReason: input.validationReason ?? null,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  })
  return id
}

const adminRequest = (path: string, cookie?: string, body?: unknown) =>
  app.request(path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      origin: 'http://localhost:3000',
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      ...(cookie ? { cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

type Artisan = {
  id: string
  userId: string
  companyName: string
  validationStatus: string
  validationReason: string | null
  createdAt: string
}

const cookies = {} as Record<Role, string>
const profiles = {
  pendingOlder: { id: '', userId: '', createdAt: new Date('2024-01-01T00:00:00.000Z') },
  pendingNewer: { id: '', userId: '', createdAt: new Date('2024-06-01T00:00:00.000Z') },
  approved: { id: '', userId: '', createdAt: new Date('2024-03-01T00:00:00.000Z') },
}

beforeAll(async () => {
  cookies.customer = await createSessionCookie('customer')
  cookies.worker = await createSessionCookie('worker')
  cookies.admin = await createSessionCookie('admin')

  profiles.pendingOlder.userId = await insertOwner(emails.pendingOlder)
  profiles.pendingNewer.userId = await insertOwner(emails.pendingNewer)
  profiles.approved.userId = await insertOwner(emails.approved)

  profiles.pendingOlder.id = await insertProfile({
    userId: profiles.pendingOlder.userId,
    companyName: 'Older Co',
    validationStatus: 'pending',
    validationReason: 'waiting',
    createdAt: profiles.pendingOlder.createdAt,
  })
  profiles.pendingNewer.id = await insertProfile({
    userId: profiles.pendingNewer.userId,
    companyName: 'Newer Co',
    validationStatus: 'pending',
    createdAt: profiles.pendingNewer.createdAt,
  })
  profiles.approved.id = await insertProfile({
    userId: profiles.approved.userId,
    companyName: 'Approved Co',
    validationStatus: 'approved',
    createdAt: profiles.approved.createdAt,
  })
})

afterAll(async () => {
  const owners = await db
    .select({ id: user.id })
    .from(user)
    .where(inArray(user.email, Object.values(emails)))
  const ids = owners.map((owner) => owner.id)

  if (ids.length > 0) {
    await db.delete(workerProfile).where(inArray(workerProfile.userId, ids))
    await db.delete(user).where(inArray(user.id, ids))
  }
})

const ours = (rows: Artisan[]) => {
  const ids = new Set([profiles.pendingOlder.id, profiles.pendingNewer.id, profiles.approved.id])
  return rows.filter((row) => ids.has(row.id))
}

describe('GET /api/admin/artisans', () => {
  it('returns 401 without a session cookie', async () => {
    const res = await adminRequest('/api/admin/artisans')

    expect(res.status).toBe(401)
  })

  it('returns 403 when the role is not admin', async () => {
    const [customer, worker] = await Promise.all([
      adminRequest('/api/admin/artisans', cookies.customer),
      adminRequest('/api/admin/artisans', cookies.worker),
    ])

    expect(customer.status).toBe(403)
    expect(worker.status).toBe(403)
  })

  it('lists pending artisans by default, oldest first', async () => {
    const res = await adminRequest('/api/admin/artisans', cookies.admin)
    const body = ours((await res.json()) as Artisan[])

    expect(res.status).toBe(200)
    expect(body.map((row) => row.id)).toEqual([profiles.pendingOlder.id, profiles.pendingNewer.id])
    expect(body[0]).toMatchObject({
      userId: profiles.pendingOlder.userId,
      companyName: 'Older Co',
      validationStatus: 'pending',
      validationReason: 'waiting',
      createdAt: profiles.pendingOlder.createdAt.toISOString(),
    })
  })

  it('filters by validation status', async () => {
    const res = await adminRequest('/api/admin/artisans?status=approved', cookies.admin)
    const body = ours((await res.json()) as Artisan[])

    expect(res.status).toBe(200)
    expect(body.map((row) => row.companyName)).toEqual(['Approved Co'])
  })

  it('returns 400 when the status is not a validation status', async () => {
    const res = await adminRequest('/api/admin/artisans?status=banned', cookies.admin)

    expect(res.status).toBe(400)
  })
})

describe('POST /api/admin/artisans/:id/approve', () => {
  it('returns 401 without a session cookie', async () => {
    const res = await adminRequest(
      `/api/admin/artisans/${profiles.pendingOlder.id}/approve`,
      undefined,
      {},
    )

    expect(res.status).toBe(401)
  })

  it('returns 403 when the role is not admin', async () => {
    const res = await adminRequest(
      `/api/admin/artisans/${profiles.pendingOlder.id}/approve`,
      cookies.customer,
      {},
    )

    expect(res.status).toBe(403)
  })

  it('returns 404 when the artisan does not exist', async () => {
    const res = await adminRequest(
      `/api/admin/artisans/${crypto.randomUUID()}/approve`,
      cookies.admin,
      {},
    )
    const body = (await res.json()) as { message: string }

    expect(res.status).toBe(404)
    expect(body).toEqual({ message: 'Artisan not found' })
  })

  it('approves the artisan and clears the validation reason', async () => {
    const res = await adminRequest(
      `/api/admin/artisans/${profiles.pendingOlder.id}/approve`,
      cookies.admin,
      {},
    )
    const body = (await res.json()) as Artisan

    expect(res.status).toBe(200)
    expect(body).toMatchObject({
      id: profiles.pendingOlder.id,
      validationStatus: 'approved',
      validationReason: null,
    })

    const [row] = await db
      .select()
      .from(workerProfile)
      .where(eq(workerProfile.id, profiles.pendingOlder.id))
    expect(row?.validationStatus).toBe('approved')
    expect(row?.validationReason).toBeNull()
  })
})

describe('POST /api/admin/artisans/:id/reject', () => {
  it('returns 401 without a session cookie', async () => {
    const res = await adminRequest(
      `/api/admin/artisans/${profiles.pendingNewer.id}/reject`,
      undefined,
      { reason: 'Incomplete file' },
    )

    expect(res.status).toBe(401)
  })

  it('returns 403 when the role is not admin', async () => {
    const res = await adminRequest(
      `/api/admin/artisans/${profiles.pendingNewer.id}/reject`,
      cookies.worker,
      { reason: 'Incomplete file' },
    )

    expect(res.status).toBe(403)
  })

  it('returns 400 when the reason is missing', async () => {
    const res = await adminRequest(
      `/api/admin/artisans/${profiles.pendingNewer.id}/reject`,
      cookies.admin,
      {},
    )

    expect(res.status).toBe(400)
  })

  it('returns 400 when the reason is blank', async () => {
    const res = await adminRequest(
      `/api/admin/artisans/${profiles.pendingNewer.id}/reject`,
      cookies.admin,
      { reason: '   ' },
    )

    expect(res.status).toBe(400)
  })

  it('returns 404 when the artisan does not exist', async () => {
    const res = await adminRequest(
      `/api/admin/artisans/${crypto.randomUUID()}/reject`,
      cookies.admin,
      { reason: 'Incomplete file' },
    )

    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ message: 'Artisan not found' })
  })

  it('rejects the artisan and stores the reason', async () => {
    const res = await adminRequest(
      `/api/admin/artisans/${profiles.pendingNewer.id}/reject`,
      cookies.admin,
      { reason: 'Missing insurance' },
    )
    const body = (await res.json()) as Artisan

    expect(res.status).toBe(200)
    expect(body).toMatchObject({
      id: profiles.pendingNewer.id,
      validationStatus: 'rejected',
      validationReason: 'Missing insurance',
    })

    const [row] = await db
      .select()
      .from(workerProfile)
      .where(eq(workerProfile.id, profiles.pendingNewer.id))
    expect(row?.validationStatus).toBe('rejected')
    expect(row?.validationReason).toBe('Missing insurance')
  })
})
