import { z } from '@hono/zod-openapi'
import type { Context } from 'hono'

export const ProblemSchema = z
  .object({
    type: z.string().openapi({ example: 'about:blank' }),
    title: z.string().openapi({ example: 'Validation error' }),
    status: z.number().int().openapi({ example: 400 }),
    detail: z.string().optional().openapi({ example: 'The request body is invalid' }),
    errors: z
      .array(
        z.object({
          field: z.string().openapi({ example: 'siret' }),
          message: z.string().openapi({ example: 'Must be 14 digits' }),
        }),
      )
      .optional(),
  })
  .openapi('Problem')

export type Problem = z.infer<typeof ProblemSchema>

const descriptions = {
  400: 'Validation error',
  401: 'Not signed in',
  403: 'Forbidden: wrong role, or resource owned by someone else',
  404: 'Not found',
  409: 'Conflict with the current state of the resource',
  413: 'Payload too large',
  415: 'Unsupported media type',
  429: 'Too many requests',
  500: 'Internal server error',
  501: 'Not implemented yet: the route is part of the contract but has no handler',
} as const

type ProblemStatus = keyof typeof descriptions

const problemContent = { 'application/problem+json': { schema: ProblemSchema } }

// Spread into a route's `responses` to declare its error cases, all in the Problem format.
export function problemResponses<const T extends ProblemStatus[]>(...statuses: T) {
  return Object.fromEntries(
    statuses.map((status) => [
      status,
      { description: descriptions[status], content: problemContent },
    ]),
  ) as { [K in T[number]]: { description: string; content: typeof problemContent } }
}

// Placeholder handler: the contract exists, the implementation does not.
export const notImplemented = (c: Context) => {
  const problem: Problem = {
    type: 'about:blank',
    title: 'Not Implemented',
    status: 501,
    detail: `${c.req.method} ${c.req.path} is documented but not implemented yet`,
  }
  return c.json(problem, 501, { 'Content-Type': 'application/problem+json' })
}
