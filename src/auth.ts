import { APIError, betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { openAPI } from 'better-auth/plugins'
import { trustedOrigin } from './config.ts'
import { db } from './db/index.ts'
import * as schema from './db/schema.ts'
import { admin } from 'better-auth/plugins'
import { createAuthMiddleware } from 'better-auth/api'

const SIGNUP_ROLES = ['customer', 'worker']
type SignupRole = (typeof SIGNUP_ROLES)[number]

const isSignupRole = (v: unknown): v is SignupRole =>
  typeof v === 'string' && (SIGNUP_ROLES as readonly string[]).includes(v)

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
        const role = ctx.body?.signupRole
        if (!isSignupRole(role)) {
          throw new APIError('BAD_REQUEST', {
            message: "signupRole is required and must be 'customer' or 'worker'",
          })
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

  databaseHooks: {
    user: {
      create: {
        before: async (user, ctx) => {
          if (ctx?.path !== '/sign-up/email') return { data: user }
          const role = isSignupRole(ctx.body?.signupRole) ? ctx.body.signupRole : 'customer'
          return { data: { ...user, role } }
        },
      },
    },
  },
})
