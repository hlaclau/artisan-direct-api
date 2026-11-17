import { eq, inArray } from 'drizzle-orm'
import { Hono } from 'hono'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '../app.ts'
import { db } from '../db/index.ts'
import { user } from '../db/schema.ts'
import { requireAuth } from './require-auth.ts'
import { requireRole, type Role } from './require-role.ts'

const password = 'testtesttest'
const emails = {
  customer: `mw-customer-${crypto.randomUUID()}@example.com`,
  worker: `mw-worker-${crypto.randomUUID()}@example.com`,
  admin: `mw-admin-${crypto.randomUUID()}@example.com`,
} satisfies Record<Role, string>

const post = (path: string, body: unknown) =>
  app.request(`/api/auth${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'http://localhost:3000',
    },
    body: JSON.stringify(body),
  })

// Signs up, forces the role in database, signs in, returns a cookie header value
const createSessionCookie = async (role: Role) => {
  const email = emails[role]

  await post('/sign-up/email', { email, password, name: role, signupRole: 'customer' })
  await db.update(user).set({ role }).where(eq(user.email, email))

  const res = await post('/sign-in/email', { email, password })
  expect(res.status).toBe(200)

  return res.headers
    .getSetCookie()
    .map((c) => c.split(';')[0])
    .join('; ')
}

// Minimal app that only exercises the middlewares
const testApp = new Hono()
testApp.get('/protected', requireAuth, (c) => c.json({ ok: true }))
testApp.get('/admin', requireAuth, requireRole(['admin']), (c) => c.json({ ok: true }))
testApp.get('/staff', requireAuth, requireRole(['worker', 'admin']), (c) => c.json({ ok: true }))
// requireRole without requireAuth in front: session is never set
testApp.get('/role-only', requireRole(['admin']), (c) => c.json({ ok: true }))

const cookies = {} as Record<Role, string>

beforeAll(async () => {
  cookies.customer = await createSessionCookie('customer')
  cookies.worker = await createSessionCookie('worker')
  cookies.admin = await createSessionCookie('admin')
})

afterAll(async () => {
  await db.delete(user).where(inArray(user.email, Object.values(emails)))
})

describe('requireAuth', () => {
  it('returns 401 without a session cookie', async () => {
    const res = await testApp.request('/protected')

    expect(res.status).toBe(401)
  })

  it('returns 401 with an invalid session cookie', async () => {
    const res = await testApp.request('/protected', {
      headers: { cookie: 'better-auth.session_token=garbage' },
    })

    expect(res.status).toBe(401)
  })

  it('returns 200 with a valid session cookie', async () => {
    const res = await testApp.request('/protected', {
      headers: { cookie: cookies.customer },
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })
})

describe('requireRole', () => {
  it('returns 401 when no session is set in the context', async () => {
    const res = await testApp.request('/role-only')

    expect(res.status).toBe(401)
  })

  it('returns 401 when unauthenticated on a role-protected route', async () => {
    const res = await testApp.request('/admin')

    expect(res.status).toBe(401)
  })

  it('returns 403 when the role is not allowed', async () => {
    const res = await testApp.request('/admin', {
      headers: { cookie: cookies.customer },
    })

    expect(res.status).toBe(403)
  })

  it('returns 403 for a worker on an admin-only route', async () => {
    const res = await testApp.request('/admin', {
      headers: { cookie: cookies.worker },
    })

    expect(res.status).toBe(403)
  })

  it('returns 200 when the role is allowed', async () => {
    const res = await testApp.request('/admin', {
      headers: { cookie: cookies.admin },
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })

  it('returns 200 when the role is one of several allowed roles', async () => {
    const [worker, admin] = await Promise.all([
      testApp.request('/staff', { headers: { cookie: cookies.worker } }),
      testApp.request('/staff', { headers: { cookie: cookies.admin } }),
    ])

    expect(worker.status).toBe(200)
    expect(admin.status).toBe(200)
  })

  it('returns 403 for a role outside the allowed list on a multi-role route', async () => {
    const res = await testApp.request('/staff', {
      headers: { cookie: cookies.customer },
    })

    expect(res.status).toBe(403)
  })
})
