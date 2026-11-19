import { relations } from 'drizzle-orm'
import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  boolean,
  index,
  integer,
  numeric,
  time,
  varchar,
} from 'drizzle-orm/pg-core'

/* -------------------------------------------------------------------------- */
/*                                 Auth tables                                */
/* -------------------------------------------------------------------------- */

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  role: text('role'),
  banned: boolean('banned').default(false),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires'),
})

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    impersonatedBy: text('impersonated_by'),
  },
  (table) => [index('session_userId_idx').on(table.userId)],
)

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('account_userId_idx').on(table.userId)],
)

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
)

/* -------------------------------------------------------------------------- */
/*                                    Enums                                   */
/* -------------------------------------------------------------------------- */

export const pricingType = pgEnum('pricing_type', [
  'fixed',
  'hourly',
  'daily',
  'per_unit',
  'starting_at',
  'quote',
])

export const documentType = pgEnum('document_type', [
  'kbis',
  'identity',
  'insurance',
  'professional_certification',
  'other',
])

export const documentStatus = pgEnum('document_status', ['pending', 'verified', 'rejected'])

export const offeringUnit = pgEnum('offering_unit', [
  'hour',
  'day',
  'job',
  'square_meter',
  'meter',
  'unit',
])

/* -------------------------------------------------------------------------- */
/*                                Worker tables                               */
/* -------------------------------------------------------------------------- */

export const workerProfile = pgTable('worker_profile', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => user.id),

  // Company information
  companyName: text('company_name').notNull(),
  siret: varchar('siret', { length: 14 }).notNull().unique(),
  phone: text('phone').notNull(),
  description: text('description'),

  // Company address
  address: text('address').notNull(),
  postalCode: text('postal_code').notNull(),
  city: text('city').notNull(),
  country: text('country').notNull().default('France'),

  // Working area
  departureAddress: text('departure_address').notNull(),
  departurePostalCode: text('departure_postal_code').notNull(),
  departureCity: text('departure_city').notNull(),
  departureLatitude: numeric('departure_latitude', { precision: 10, scale: 7 }),
  departureLongitude: numeric('departure_longitude', {
    precision: 10,
    scale: 7,
  }),
  serviceRadiusKm: integer('service_radius_km').notNull().default(20),

  validationStatus: text('validation_status').notNull().default('pending'),
  validationReason: text('validation_reason'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})

export const workerPhotos = pgTable(
  'worker_photos',
  {
    id: text('id').primaryKey(),
    workerId: text('worker_id')
      .notNull()
      .references(() => workerProfile.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    fileUrl: text('file_url').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('worker_photos_workerId_idx').on(table.workerId)],
)

// Recurring weekly availability
export const workerAvailabilities = pgTable(
  'worker_availabilities',
  {
    id: text('id').primaryKey(),
    workerId: text('worker_id')
      .notNull()
      .references(() => workerProfile.id, { onDelete: 'cascade' }),

    // 0 = Monday, 6 = Sunday
    dayOfWeek: integer('day_of_week').notNull(),

    startTime: time('start_time').notNull(),
    endTime: time('end_time').notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('worker_availabilities_workerId_dayOfWeek_idx').on(table.workerId, table.dayOfWeek),
  ],
)

// Legal and professional documents
export const workerDocuments = pgTable(
  'worker_documents',
  {
    id: text('id').primaryKey(),
    workerId: text('worker_id')
      .notNull()
      .references(() => workerProfile.id, { onDelete: 'cascade' }),

    type: documentType('type').notNull(),
    name: text('name').notNull(),

    // File stored externally (S3, Cloudflare R2, etc.)
    fileUrl: text('file_url').notNull(),
    mimeType: text('mime_type').notNull(),

    status: documentStatus('status').notNull().default('pending'),

    expiresAt: timestamp('expires_at'),
    verifiedAt: timestamp('verified_at'),
    rejectionReason: text('rejection_reason'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index('worker_documents_workerId_idx').on(table.workerId),
    index('worker_documents_workerId_type_idx').on(table.workerId, table.type),
  ],
)

// Services offered by the worker
export const workerServices = pgTable(
  'worker_services',
  {
    id: text('id').primaryKey(),
    workerId: text('worker_id')
      .notNull()
      .references(() => workerProfile.id, { onDelete: 'cascade' }),

    name: text('name').notNull(),
    description: text('description'),
    job: text('job'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('worker_services_workerId_idx').on(table.workerId)],
)

// Pricing for services
export const workerServicePrices = pgTable('worker_service_prices', {
  id: text('id').primaryKey(),
  serviceId: text('service_id')
    .notNull()
    .references(() => workerServices.id, { onDelete: 'cascade' }),

  pricingType: pricingType('pricing_type').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }),
  currency: varchar('currency', { length: 3 }).notNull().default('EUR'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})

/* -------------------------------------------------------------------------- */
/*                                  Relations                                 */
/* -------------------------------------------------------------------------- */

export const userRelations = relations(user, ({ one, many }) => ({
  sessions: many(session),
  accounts: many(account),
  workerProfile: one(workerProfile),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}))

export const workerProfileRelations = relations(workerProfile, ({ one, many }) => ({
  user: one(user, {
    fields: [workerProfile.userId],
    references: [user.id],
  }),
  photos: many(workerPhotos),
  availabilities: many(workerAvailabilities),
  documents: many(workerDocuments),
  services: many(workerServices),
}))

export const workerPhotosRelations = relations(workerPhotos, ({ one }) => ({
  worker: one(workerProfile, {
    fields: [workerPhotos.workerId],
    references: [workerProfile.id],
  }),
}))

export const workerAvailabilitiesRelations = relations(workerAvailabilities, ({ one }) => ({
  worker: one(workerProfile, {
    fields: [workerAvailabilities.workerId],
    references: [workerProfile.id],
  }),
}))

export const workerDocumentsRelations = relations(workerDocuments, ({ one }) => ({
  worker: one(workerProfile, {
    fields: [workerDocuments.workerId],
    references: [workerProfile.id],
  }),
}))

export const workerServicesRelations = relations(workerServices, ({ one, many }) => ({
  worker: one(workerProfile, {
    fields: [workerServices.workerId],
    references: [workerProfile.id],
  }),
  prices: many(workerServicePrices),
}))

export const workerServicePricesRelations = relations(workerServicePrices, ({ one }) => ({
  service: one(workerServices, {
    fields: [workerServicePrices.serviceId],
    references: [workerServices.id],
  }),
}))
