import { APIError, betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { openAPI } from 'better-auth/plugins'
import { trustedOrigin } from './config.ts'
import { db } from './db/index.ts'
import * as schema from './db/schema.ts'
import { admin } from 'better-auth/plugins'
import { createAuthMiddleware } from 'better-auth/api'

const SIGNUP_ROLES = ['customer', 'worker']

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [trustedOrigin],
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  emailAndPassword: { enabled: true },
  plugins: [
    openAPI({ disableDefaultReference: true }),
    admin({
      defaultRole: 'customer',
      adminRoles: ['admin'],
    }),
  ],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      // Signup endpoint : only customer and worker roles are allowed to be send
      if (ctx.path === '/sign-up/email') {
        const role = ctx.body?.role
        if (role !== undefined && !SIGNUP_ROLES.includes(role)) {
          throw new APIError('BAD_REQUEST', { message: 'Invalid role' })
        }
      }

      // Profile update endpoint : role cannot be changed by the user
      if (ctx.path === '/update-user' && ctx.body && 'role' in ctx.body) {
        throw new APIError('FORBIDDEN', {
          message: 'Role cannot be changed here',
        })
      }
    }),
  },
})
