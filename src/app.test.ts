import { describe, expect, it } from 'vitest'
import { app } from './app.ts'

describe('app', () => {
  it('responds on /health', async () => {
    const res = await app.request('/health')

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'ok' })
  })

  it('serves the OpenAPI document', async () => {
    const res = await app.request('/openapi.json')
    const doc = (await res.json()) as { paths: Record<string, unknown> }

    expect(res.status).toBe(200)
    expect(doc.paths).toHaveProperty('/health')
  })

  it('serves the Scalar API reference', async () => {
    const res = await app.request('/docs')

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/html')
  })
})
