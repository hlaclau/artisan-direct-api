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

// Who can call each route: public, any signed-in user, or a role (adds a 403).
const inventory = `
public   GET    /health
public   GET    /api/trades
public   GET    /api/artisans
public   GET    /api/artisans/{id}
public   GET    /api/diagnostic/questions
public   POST   /api/diagnostic
public   GET    /api/reviews
public   GET    /api/reviews/{id}
user     GET    /api/me
user     PATCH  /api/me
user     PATCH  /api/me/role
user     DELETE /api/me
artisan  GET    /api/artisans/me
artisan  PATCH  /api/artisans/me
artisan  PUT    /api/artisans/me/trades
artisan  PUT    /api/artisans/me/rates
artisan  GET    /api/artisans/me/service-area
artisan  PUT    /api/artisans/me/service-area
artisan  GET    /api/artisans/me/photos
artisan  POST   /api/artisans/me/photos
artisan  DELETE /api/artisans/me/photos/{photoId}
artisan  GET    /api/artisans/me/documents
artisan  PUT    /api/artisans/me/documents/{type}
artisan  GET    /api/artisans/me/availability
artisan  PUT    /api/artisans/me/availability
admin    GET    /api/admin/artisans
admin    GET    /api/admin/artisans/{id}
admin    GET    /api/admin/artisans/{id}/documents/{documentId}
admin    POST   /api/admin/artisans/{id}/approve
admin    POST   /api/admin/artisans/{id}/reject
user     POST   /api/interventions
user     GET    /api/interventions
user     GET    /api/interventions/{id}
user     PATCH  /api/interventions/{id}
user     DELETE /api/interventions/{id}
user     POST   /api/interventions/{id}/submissions
user     GET    /api/interventions/{id}/status
user     PATCH  /api/interventions/{id}/status
artisan  POST   /api/quotes
user     GET    /api/quotes
user     GET    /api/quotes/{id}
artisan  PATCH  /api/quotes/{id}
user     POST   /api/quotes/{id}/accept
user     POST   /api/quotes/{id}/decline
user     POST   /api/appointments
user     GET    /api/appointments
user     GET    /api/appointments/{id}
user     PATCH  /api/appointments/{id}
user     POST   /api/payments
user     GET    /api/payments
user     GET    /api/payments/{id}
user     POST   /api/reviews
user     GET    /api/notifications
user     GET    /api/notifications/preferences
user     PUT    /api/notifications/preferences
user     PATCH  /api/notifications/{id}
`
  .trim()
  .split('\n')
  .map((line) => {
    const [access, method, path] = line.trim().split(/\s+/) as [string, string, string]
    return { access, method: method.toLowerCase(), path }
  })

describe('openapi document', () => {
  it('documents both the app routes and the auth routes', async () => {
    const doc = await getDoc()

    for (const path of [
      '/api/auth/sign-up/email',
      '/api/auth/sign-in/email',
      '/api/auth/sign-in/social',
      '/api/auth/get-session',
    ]) {
      expect(doc.paths).toHaveProperty(path)
    }
  })

  it('declares every route of the inventory with its access rules', async () => {
    const doc = await getDoc()

    for (const { access, method, path } of inventory) {
      const op = doc.paths[path]?.[method]
      const responses = Object.keys(op?.responses ?? {})
      const expected = {
        security: access === 'public' ? undefined : [{ cookieAuth: [] }],
        has401: access !== 'public',
        has403: access === 'artisan' || access === 'admin',
      }

      expect({
        route: `${method} ${path}`,
        security: op?.security,
        has401: responses.includes('401'),
        has403: responses.includes('403'),
      }).toEqual({ route: `${method} ${path}`, ...expected })
    }
  })

  it('declares the cookie security scheme and the Problem schema', async () => {
    const doc = await getDoc()

    expect(doc.components.securitySchemes).toHaveProperty('cookieAuth')
    expect(doc.components.schemas).toHaveProperty('Problem')
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
