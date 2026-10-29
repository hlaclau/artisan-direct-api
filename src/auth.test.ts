import { eq } from 'drizzle-orm'
import { afterAll, describe, expect, it } from 'vitest'
import { app } from './app.ts'
import { db } from './db/index.ts'
import { user } from './db/schema.ts'

const email = `auth-test-${crypto.randomUUID()}@example.com`
const beforeHookSignUpEmail = `auth-before-hook-test-${crypto.randomUUID()}@example.com`
const beforeHookUpdateUserEmail = `auth-before-hook-test-${crypto.randomUUID()}@example.com`
const password = 'correct-horse-battery'

const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  app.request(`/api/auth${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'http://localhost:3000',
      ...headers,
    },
    body: JSON.stringify(body),
  })

describe('auth', () => {
  afterAll(async () => {
    await db.delete(user).where(eq(user.email, email))
  })

  it('signs up a user with email and password', async () => {
    const res = await post('/sign-up/email', {
      email,
      password,
      name: 'Test',
      signupRole: 'customer',
    })
    const body = (await res.json()) as { user: { email: string } }

    expect(res.status).toBe(200)
    expect(body.user.email).toBe(email)
  })

  it('rejects a duplicate email', async () => {
    const res = await post('/sign-up/email', { email, password, name: 'Test' })

    expect(res.status).toBeGreaterThanOrEqual(400)
  })

  it('rejects a wrong password', async () => {
    const res = await post('/sign-in/email', { email, password: 'wrong-password' })

    expect(res.status).toBe(401)
  })

  it('signs in and resolves the session from the cookie', async () => {
    const signIn = await post('/sign-in/email', { email, password })
    const cookie = signIn.headers
      .getSetCookie()
      .map((c) => c.split(';')[0])
      .join('; ')

    expect(signIn.status).toBe(200)
    expect(cookie).not.toBe('')

    const res = await app.request('/api/auth/get-session', { headers: { cookie } })
    const body = (await res.json()) as { user: { email: string } }

    expect(res.status).toBe(200)
    expect(body.user.email).toBe(email)
  })

  it('returns no session without a cookie', async () => {
    const res = await app.request('/api/auth/get-session')

    expect(await res.json()).toBeNull()
  })

  it('returns 400 when the role is not in SIGNUP_ROLES', async () => {
    const res = await post('/sign-up/email', {
      email: beforeHookSignUpEmail,
      password,
      name: 'Test',
      signupRole: 'admin',
    })

    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({
      message: "signupRole is required and must be 'customer' or 'worker'",
    })

    const rows = await db.select().from(user).where(eq(user.email, email))
    expect(rows).toHaveLength(1) // because a user already exists
  })

  it('accepts a role listed in SIGNUP_ROLES', async () => {
    const res = await post('/sign-up/email', {
      email: beforeHookSignUpEmail,
      password,
      name: 'Test',
      signupRole: 'customer',
    })

    expect(res.status).toBe(200)
  })
})

describe('/update-user', () => {
  it('returns 403 when the body contains a role', async () => {
    const signUp = await post('/sign-up/email', {
      email: beforeHookUpdateUserEmail,
      password,
      name: 'Test',
    })
    const cookie = signUp.headers
      .getSetCookie()
      .map((c) => c.split(';')[0])
      .join('; ')

    const res = await post('/update-user', { role: 'admin' }, { cookie })

    expect(res.status).toBe(403)
    expect(await res.json()).toMatchObject({ message: 'Role cannot be changed here' })
  })
})
