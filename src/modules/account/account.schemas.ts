import { z } from '@hono/zod-openapi'

export const RoleSchema = z.enum(['client', 'artisan', 'admin']).openapi('Role')

export const ValidationStatusSchema = z
  .enum(['pending', 'approved', 'rejected'])
  .openapi('ValidationStatus')

export const MeSchema = z
  .object({
    id: z.uuid(),
    email: z.email().openapi({ example: 'marie.dupont@example.com' }),
    firstName: z.string().openapi({ example: 'Marie' }),
    lastName: z.string().openapi({ example: 'Dupont' }),
    // null until the user has chosen client or artisan (ADP-71)
    role: RoleSchema.nullable(),
    // only set when role is artisan
    validationStatus: ValidationStatusSchema.nullable(),
    createdAt: z.iso.datetime(),
  })
  .openapi('Me')

export const UpdateMeBodySchema = z
  .object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
  })
  .openapi('UpdateMeBody')

export const ChooseRoleBodySchema = z
  .object({
    role: z.enum(['client', 'artisan']),
  })
  .openapi('ChooseRoleBody')
