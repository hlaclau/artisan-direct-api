import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'

const HealthSchema = z
  .object({
    status: z.literal('ok').openapi({ example: 'ok' }),
  })
  .openapi('Health')

const getHealthRoute = createRoute({
  method: 'get',
  path: '/health',
  tags: ['health'],
  summary: 'Check that the API is up',
  responses: {
    200: {
      content: { 'application/json': { schema: HealthSchema } },
      description: 'The API is up',
    },
  },
})

export const healthRoutes = new OpenAPIHono().openapi(getHealthRoute, (c) =>
  c.json({ status: 'ok' as const }, 200),
)
