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

describe('planned contract', () => {
  it('serves an OpenAPI document where every operation is tagged and documents a 500', async () => {
    const res = await app.request('/openapi-planned.json')
    expect(res.status).toBe(200)
    const doc = (await res.json()) as {
      openapi: string
      paths: Record<string, Record<string, { tags?: string[]; responses: Record<string, unknown> }>>
    }
    expect(doc.openapi).toBe('3.1.0')

    const methods = ['get', 'post', 'put', 'patch', 'delete']
    const operations = Object.entries(doc.paths).flatMap(([path, item]) =>
      methods.filter((m) => item[m]).map((m) => ({ id: `${m} ${path}`, op: item[m]! })),
    )
    expect(operations.length).toBeGreaterThan(0)
    const untagged = operations.filter(({ op }) => !op.tags?.length).map(({ id }) => id)
    const withoutServerError = operations
      .filter(({ op }) => !('500' in op.responses))
      .map(({ id }) => id)
    expect(untagged).toEqual([])
    expect(withoutServerError).toEqual([])
  })
})
