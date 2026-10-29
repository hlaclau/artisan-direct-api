import { createRoute } from '@hono/zod-openapi'
import { UuidParamSchema } from './pagination.ts'
import { problemResponses } from './problem.ts'

type Access = 'public' | 'user' | 'artisan' | 'admin'

type StubOptions = {
  method: 'get' | 'post' | 'put' | 'patch' | 'delete'
  path: string
  tag: string
  summary: string
  access?: Access
}

export function stubRoute({ method, path, tag, summary, access = 'user' }: StubOptions) {
  return createRoute({
    method,
    path,
    tags: [tag],
    summary,
    ...(path.includes('{id}') && { request: { params: UuidParamSchema } }),
    ...(access !== 'public' && { security: [{ cookieAuth: [] }] }),
    responses: {
      ...(access !== 'public' && problemResponses(401)),
      ...(access === 'artisan' || access === 'admin' ? problemResponses(403) : {}),
      ...problemResponses(501),
    },
  })
}
