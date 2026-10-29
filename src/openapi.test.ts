import { describe, expect, it } from 'vitest'
import { app } from './app.ts'

type Operation = { tags?: string[]; security?: unknown[]; responses: Record<string, unknown> }
type Doc = {
  tags: { name: string }[]
  'x-tagGroups': { name: string; tags: string[] }[]
  paths: Record<string, Record<string, Operation>>
  components: { schemas: Record<string, unknown>; securitySchemes: Record<string, unknown> }
}

const getDoc = async () => {
  const res = await app.request('/openapi.json')
  expect(res.status).toBe(200)
  return (await res.json()) as Doc
}

const publicRoutes = [
  'GET /health',
  'GET /api/trades',
  'GET /api/artisans',
  'GET /api/artisans/{id}',
  'GET /api/diagnostic/questions',
  'POST /api/diagnostic',
  'GET /api/reviews',
  'GET /api/reviews/{id}',
]

const detailedRoutes = [
  'GET /api/me',
  'PATCH /api/me',
  'PATCH /api/me/role',
  'DELETE /api/me',
  'GET /api/artisans/me',
  'PATCH /api/artisans/me',
  'PUT /api/artisans/me/trades',
  'PUT /api/artisans/me/rates',
  'GET /api/artisans/me/service-area',
  'PUT /api/artisans/me/service-area',
  'GET /api/artisans/me/photos',
  'POST /api/artisans/me/photos',
  'DELETE /api/artisans/me/photos/{photoId}',
  'GET /api/artisans/me/documents',
  'PUT /api/artisans/me/documents/{type}',
  'GET /api/admin/artisans',
  'GET /api/admin/artisans/{id}',
  'GET /api/admin/artisans/{id}/documents/{documentId}',
  'POST /api/admin/artisans/{id}/approve',
  'POST /api/admin/artisans/{id}/reject',
]

const skeletonRoutes = [
  'POST /api/interventions',
  'GET /api/interventions',
  'GET /api/interventions/{id}',
  'PATCH /api/interventions/{id}',
  'DELETE /api/interventions/{id}',
  'POST /api/interventions/{id}/submissions',
  'GET /api/interventions/{id}/status',
  'PATCH /api/interventions/{id}/status',
  'POST /api/quotes',
  'GET /api/quotes',
  'GET /api/quotes/{id}',
  'PATCH /api/quotes/{id}',
  'POST /api/quotes/{id}/accept',
  'POST /api/quotes/{id}/decline',
  'GET /api/artisans/me/availability',
  'PUT /api/artisans/me/availability',
  'POST /api/appointments',
  'GET /api/appointments',
  'GET /api/appointments/{id}',
  'PATCH /api/appointments/{id}',
  'POST /api/payments',
  'GET /api/payments',
  'GET /api/payments/{id}',
  'POST /api/reviews',
  'GET /api/notifications',
  'GET /api/notifications/preferences',
  'PUT /api/notifications/preferences',
  'PATCH /api/notifications/{id}',
]

const inventory = [...publicRoutes, ...detailedRoutes, ...skeletonRoutes]
const split = (route: string) => {
  const [method, path] = route.split(' ') as [string, string]
  return { method: method.toLowerCase(), path }
}

describe('openapi document', () => {
  it('documents both the app routes and the auth routes', async () => {
    const doc = await getDoc()

    expect(doc.paths).toHaveProperty('/health')
    expect(doc.paths).toHaveProperty('/api/auth/sign-up/email')
    expect(doc.paths).toHaveProperty('/api/auth/sign-in/email')
    expect(doc.paths).toHaveProperty('/api/auth/sign-in/social')
    expect(doc.paths).toHaveProperty('/api/auth/get-session')
  })

  it.each(inventory)('declares %s', async (route) => {
    const { method, path } = split(route)
    const doc = await getDoc()

    expect(doc.paths[path]?.[method]).toBeDefined()
  })

  it('declares the cookie security scheme and the Problem schema', async () => {
    const doc = await getDoc()

    expect(doc.components.securitySchemes).toHaveProperty('cookieAuth')
    expect(doc.components.schemas).toHaveProperty('Problem')
  })

  it('declares 401 and the cookie on every protected route', async () => {
    const doc = await getDoc()
    const protectedRoutes = inventory.filter((r) => !publicRoutes.includes(r))

    for (const route of protectedRoutes) {
      const { method, path } = split(route)
      const op = doc.paths[path]?.[method]
      expect({ route, security: op?.security }).toEqual({ route, security: [{ cookieAuth: [] }] })
      expect({ route, has401: op?.responses && '401' in op.responses }).toEqual({
        route,
        has401: true,
      })
    }
  })

  it('declares 403 on role-restricted routes', async () => {
    const doc = await getDoc()
    const restricted = [
      ...detailedRoutes.filter((r) => r.includes('/artisans/me') || r.includes('/admin/')),
      'POST /api/quotes',
      'PATCH /api/quotes/{id}',
      'GET /api/artisans/me/availability',
      'PUT /api/artisans/me/availability',
    ]

    for (const route of restricted) {
      const { method, path } = split(route)
      const responses = doc.paths[path]?.[method]?.responses ?? {}
      expect({ route, has403: '403' in responses }).toEqual({ route, has403: true })
    }
  })

  it('lists admin artisans with pagination and a status filter', async () => {
    const doc = await getDoc()
    const op = doc.paths['/api/admin/artisans']?.get as unknown as {
      parameters: { name: string }[]
    }

    expect(op.parameters.map((p) => p.name)).toEqual(
      expect.arrayContaining(['page', 'pageSize', 'status']),
    )
  })
})

describe('implemented vs contract-only grouping', () => {
  it('lists routes with a handler apart from routes still answering 501', async () => {
    const doc = await getDoc()
    const [implemented, contractOnly] = doc['x-tagGroups']

    expect(implemented?.tags).toEqual(expect.arrayContaining(['Auth', 'health']))
    expect(implemented?.tags).not.toContain('Account')
    expect(contractOnly?.tags).toEqual(
      expect.arrayContaining(['Account (contract)', 'Admin (contract)', 'Quotes (contract)']),
    )
    expect(contractOnly?.tags).not.toContain('Auth (contract)')
  })

  it('tags every contract-only operation with the suffixed tag', async () => {
    const doc = await getDoc()

    expect(doc.paths['/api/me']?.get?.tags).toEqual(['Account (contract)'])
    expect(doc.paths['/health']?.get?.tags).toEqual(['health'])
    expect(doc.paths['/api/auth/get-session']?.get?.tags).toEqual(['Auth'])
  })
})

describe('placeholder handlers', () => {
  it('answer 501 in the Problem format', async () => {
    const res = await app.request('/api/me')

    expect(res.status).toBe(501)
    expect(res.headers.get('content-type')).toContain('application/problem+json')
    expect(await res.json()).toMatchObject({ title: 'Not Implemented', status: 501 })
  })

  it('serve /api/artisans/me from the profile routes, not /api/artisans/{id}', async () => {
    const res = await app.request('/api/artisans/me')

    expect(res.status).toBe(501)
    expect(await res.text()).toContain('/api/artisans/me')
  })
})
