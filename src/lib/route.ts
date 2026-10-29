import { createRoute, type RouteConfig, type z } from '@hono/zod-openapi'
import { type ProblemStatus, problemResponses } from './problem.ts'

const json = <T extends z.ZodType>(schema: T) => ({ 'application/json': { schema } })

export const ok = <T extends z.ZodType>(description: string, schema: T) => ({
  description,
  content: json(schema),
})

export const jsonBody = <T extends z.ZodType>(schema: T) => ({
  required: true as const,
  content: json(schema),
})

type RouteOptions = Omit<RouteConfig, 'tags' | 'security' | 'responses'> & {
  tag: string
  // Success responses; `errors` adds the Problem responses, 401 is added for protected routes.
  responses: RouteConfig['responses']
  errors: readonly ProblemStatus[]
  public?: boolean
}

export function route<const O extends RouteOptions>({
  tag,
  responses,
  errors,
  public: isPublic,
  ...config
}: O) {
  const statuses: ProblemStatus[] = isPublic ? [...errors] : [401, ...errors]

  return createRoute({
    ...config,
    tags: [tag],
    ...(!isPublic && { security: [{ cookieAuth: [] }] }),
    responses: {
      ...responses,
      ...problemResponses(...statuses),
    },
  })
}
