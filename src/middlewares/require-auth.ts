import { createMiddleware } from 'hono/factory'
import { auth } from '../auth'
import { HTTPException } from 'hono/http-exception'

type Env = {
  Variables: {
    session: typeof auth.$Infer.Session | null
  }
}

export const requireAuth = createMiddleware<Env>(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  })

  if (!session) {
    throw new HTTPException(401) // Unauthorized
  }

  c.set('session', session)

  await next()
})
