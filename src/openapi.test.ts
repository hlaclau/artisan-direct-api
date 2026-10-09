import { describe, expect, it } from 'vitest'
import { app } from './app.ts'

describe('openapi document', () => {
  it('documents both the app routes and the auth routes', async () => {
    const res = await app.request('/openapi.json')
    const doc = (await res.json()) as { paths: Record<string, unknown> }

    expect(res.status).toBe(200)
    expect(doc.paths).toHaveProperty('/health')
    expect(doc.paths).toHaveProperty('/api/auth/sign-up/email')
    expect(doc.paths).toHaveProperty('/api/auth/sign-in/email')
    expect(doc.paths).toHaveProperty('/api/auth/sign-in/social')
    expect(doc.paths).toHaveProperty('/api/auth/get-session')
  })
})
