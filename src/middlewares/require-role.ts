import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'

export type Role = 'customer' | 'worker' | 'admin'

export const requireRole = (allowedRoles: Role[]) => {
  return createMiddleware(async (c, next) => {
    const session = c.get('session')

    if (!session) {
      throw new HTTPException(401) // Unauthorized
    }

    if (!session.user || !allowedRoles.includes(session.user.role)) {
      throw new HTTPException(403) // Forbidden
    }

    await next()
  })
}
