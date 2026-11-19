import { relations, sql } from 'drizzle-orm'
import {
  boolean,
  check,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core'

export const documentType = pgEnum('document_type', ['kbis'])
export const documentStatus = pgEnum('document_status', [
  'pending',
  'verified',
  'rejected',
  'expired',
])

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

export const workerProfile = pgTable(
  'worker_profile',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: 'cascade' }),
    companyName: text('company_name').notNull(),
    siret: varchar('siret', { length: 14 }).notNull().unique(),
    phone: text('phone').notNull(),
    description: text('description').notNull(),
    address: text('address').notNull(),
    postalCode: text('postal_code').notNull(),
    city: text('city').notNull(),
    country: text('country').notNull(),
    departureAddress: text('departure_address').notNull(),
    departurePostalCode: text('departure_postal_code').notNull(),
    departureCity: text('departure_city').notNull(),
    departureLatitude: numeric('departure_latitude', { precision: 10, scale: 7 }),
    departureLongitude: numeric('departure_longitude', { precision: 10, scale: 7 }),
    serviceRadiusKm: integer('service_radius_km').notNull(),
    validationStatus: text('validation_status').notNull().default('pending'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    check('worker_profile_siret_format', sql`${table.siret} ~ '^[0-9]{14}$'`),
    check('worker_profile_service_radius_nonnegative', sql`${table.serviceRadiusKm} >= 0`),
    check(
      'worker_profile_departure_latitude_range',
      sql`${table.departureLatitude} is null or ${table.departureLatitude} between -90 and 90`,
    ),
    check(
      'worker_profile_departure_longitude_range',
      sql`${table.departureLongitude} is null or ${table.departureLongitude} between -180 and 180`,
    ),
  ],
)

export const workerPhoto = pgTable(
  'worker_photos',
  {
    id: text('id').primaryKey(),
    workerId: text('worker_id')
      .notNull()
      .references(() => workerProfile.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    fileUrl: text('file_url').notNull(),
    position: integer('position').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('worker_photos_worker_id_idx').on(table.workerId),
    uniqueIndex('worker_photos_worker_position_idx').on(table.workerId, table.position),
    check('worker_photos_position_nonnegative', sql`${table.position} >= 0`),
  ],
)

export const workerDocument = pgTable(
  'worker_documents',
  {
    id: text('id').primaryKey(),
    workerId: text('worker_id')
      .notNull()
      .references(() => workerProfile.id, { onDelete: 'cascade' }),
    type: documentType('type').notNull(),
    name: text('name').notNull(),
    fileUrl: text('file_url').notNull(),
    mimeType: text('mime_type').notNull(),
    status: documentStatus('status').notNull().default('pending'),
    expiresAt: timestamp('expires_at').default(sql`now() + interval '3 months'`),
    verifiedAt: timestamp('verified_at'),
    rejectionReason: text('rejection_reason'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('worker_documents_worker_type_idx').on(table.workerId, table.type),
    index('worker_documents_expiration_idx').on(table.expiresAt),
  ],
)

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  workerProfiles: many(workerProfile),
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
  photos: many(workerPhoto),
  documents: many(workerDocument),
}))

export const workerPhotoRelations = relations(workerPhoto, ({ one }) => ({
  worker: one(workerProfile, {
    fields: [workerPhoto.workerId],
    references: [workerProfile.id],
  }),
}))

export const workerDocumentRelations = relations(workerDocument, ({ one }) => ({
  worker: one(workerProfile, {
    fields: [workerDocument.workerId],
    references: [workerProfile.id],
  }),
}))
