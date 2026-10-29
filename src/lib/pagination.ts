import { z } from '@hono/zod-openapi'

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).openapi({ example: 1 }),
  pageSize: z.coerce.number().int().min(1).max(100).default(20).openapi({ example: 20 }),
})

export const PageMetaSchema = z
  .object({
    page: z.number().int().openapi({ example: 1 }),
    pageSize: z.number().int().openapi({ example: 20 }),
    total: z.number().int().openapi({ example: 42 }),
  })
  .openapi('PageMeta')

export const paginated = <T extends z.ZodType>(item: T, name: string) =>
  z.object({ data: z.array(item), meta: PageMetaSchema }).openapi(name)

export const UuidParamSchema = z.object({
  id: z.uuid().openapi({
    param: { name: 'id', in: 'path' },
    example: '0b9f5c1e-6a52-4c1c-9a63-1f1a9a2b7d10',
  }),
})
