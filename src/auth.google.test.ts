import { and, eq } from 'drizzle-orm'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { app } from './app.ts'
import { db } from './db/index.ts'
import { account, user } from './db/schema.ts'

const email = `google-test-${crypto.randomUUID()}@example.com`
const googleId = crypto.randomUUID()

// Google's provider only decodes the id_token (no signature check), so an unsigned JWT is enough.
const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url')
const idToken = `${b64({ alg: 'none' })}.${b64({
  sub: googleId,
  email,
  email_verified: true,
  name: 'Google Tester',
  picture: 'https://example.com/avatar.png',
})}.sig`

const cookiesFrom = (res: Response) =>
  res.headers
    .getSetCookie()
    .map((c) => c.split(';')[0])
    .join('; ')

// Fakes Google's token endpoint; every other fetch goes through untouched.
const mockGoogleToken = (response: Response) => {
  const realFetch = globalThis.fetch
  vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
    const url = input instanceof Request ? input.url : String(input)
    return url.startsWith('https://oauth2.googleapis.com/token')
      ? Promise.resolve(response)
      : realFetch(input, init)
  })
}

// Starts the flow like a browser would and returns what Google would send back on redirect.
const startGoogleSignIn = async () => {
  const res = await app.request('/api/auth/sign-in/social', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost:3000' },
    body: JSON.stringify({ provider: 'google', callbackURL: 'http://localhost:3000/docs' }),
  })
  const { url } = (await res.json()) as { url: string }
  const authUrl = new URL(url)

  return { authUrl, cookie: cookiesFrom(res), state: authUrl.searchParams.get('state')! }
}

describe('google sign-in', () => {
  beforeEach(() => {
    mockGoogleToken(
      Response.json({ access_token: 'fake-access-token', id_token: idToken, token_type: 'Bearer' }),
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  afterAll(async () => {
    await db.delete(user).where(eq(user.email, email))
  })

  it('redirects to Google with our client id and callback', async () => {
    const { authUrl } = await startGoogleSignIn()

    expect(authUrl.origin).toBe('https://accounts.google.com')
    expect(authUrl.searchParams.get('client_id')).toBe('test-google-client-id')
    expect(authUrl.searchParams.get('redirect_uri')).toBe(
      'http://localhost:3000/api/auth/callback/google',
    )
  })

  it('creates the user and a session from the Google callback', async () => {
    const { cookie, state } = await startGoogleSignIn()

    const callback = await app.request(`/api/auth/callback/google?code=fake-code&state=${state}`, {
      headers: { cookie },
    })

    expect(callback.status).toBe(302)
    expect(callback.headers.get('location')).toBe('http://localhost:3000/docs')

    const session = await app.request('/api/auth/get-session', {
      headers: { cookie: cookiesFrom(callback) },
    })
    const body = (await session.json()) as { user: { email: string; emailVerified: boolean } }

    expect(body.user.email).toBe(email)
    expect(body.user.emailVerified).toBe(true)

    const [linked] = await db
      .select()
      .from(account)
      .where(and(eq(account.providerId, 'google'), eq(account.accountId, googleId)))
    expect(linked).toBeDefined()
  })

  it('reuses the same user on a second Google sign-in', async () => {
    const { cookie, state } = await startGoogleSignIn()
    await app.request(`/api/auth/callback/google?code=fake-code&state=${state}`, {
      headers: { cookie },
    })

    expect(await db.select().from(user).where(eq(user.email, email))).toHaveLength(1)
  })

  it('does not sign in when Google rejects the code', async () => {
    vi.restoreAllMocks()
    mockGoogleToken(Response.json({ error: 'invalid_grant' }, { status: 400 }))
    const { cookie, state } = await startGoogleSignIn()

    const callback = await app.request(`/api/auth/callback/google?code=bad&state=${state}`, {
      headers: { cookie },
    })

    expect(callback.headers.get('location')).toContain('error=')
    expect(cookiesFrom(callback)).not.toContain('session_token')
  })

  it('rejects a callback with an unknown state', async () => {
    const callback = await app.request('/api/auth/callback/google?code=x&state=forged')

    expect(callback.headers.get('location')).toContain('error=')
  })
})
