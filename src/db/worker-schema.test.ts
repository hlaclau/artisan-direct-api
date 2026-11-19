import { eq } from 'drizzle-orm'
import { afterAll, describe, expect, it } from 'vitest'
import { db } from './index.ts'
import { user, workerDocument, workerPhoto, workerProfile } from './schema.ts'

const userId = crypto.randomUUID()
const email = `worker-schema-${crypto.randomUUID()}@example.com`
const workerId = crypto.randomUUID()

describe('worker database schema', () => {
  afterAll(async () => {
    await db.delete(user).where(eq(user.id, userId))
  })

  it('stores a worker profile, photos, and one document of each type', async () => {
    await db.insert(user).values({
      id: userId,
      name: 'Worker Schema Test',
      email,
    })

    await db.insert(workerProfile).values({
      id: workerId,
      userId,
      companyName: 'Test Workshop',
      siret: '12345678901234',
      phone: '+33123456789',
      description: 'Test profile',
      address: '1 rue du Test',
      postalCode: '75001',
      city: 'Paris',
      country: 'France',
      departureAddress: '1 rue du Test',
      departurePostalCode: '75001',
      departureCity: 'Paris',
      departureLatitude: '48.8566000',
      departureLongitude: '2.3522000',
      serviceRadiusKm: 20,
    })

    const [profile] = await db.select().from(workerProfile).where(eq(workerProfile.id, workerId))
    expect(profile.validationStatus).toBe('pending')

    const photoId = crypto.randomUUID()
    await db.insert(workerPhoto).values({
      id: photoId,
      workerId,
      name: 'realisation.png',
      fileUrl: 'uploads/test/photo_realisation/realisation.png',
      position: 0,
    })

    const documentId = crypto.randomUUID()
    await db.insert(workerDocument).values({
      id: documentId,
      workerId,
      type: 'kbis',
      name: 'kbis.pdf',
      fileUrl: 'uploads/test/kbis/kbis.pdf',
      mimeType: 'application/pdf',
    })

    const [document] = await db
      .select()
      .from(workerDocument)
      .where(eq(workerDocument.id, documentId))
    expect(document.status).toBe('pending')
    expect(document.expiresAt?.getTime()).toBeGreaterThan(Date.now() + 89 * 24 * 60 * 60 * 1000)
    expect(document.expiresAt?.getTime()).toBeLessThan(Date.now() + 93 * 24 * 60 * 60 * 1000)

    await expect(
      db.insert(workerDocument).values({
        id: crypto.randomUUID(),
        workerId,
        type: 'kbis',
        name: 'new-kbis.pdf',
        fileUrl: 'uploads/test/kbis/new-kbis.pdf',
        mimeType: 'application/pdf',
      }),
    ).rejects.toMatchObject({ cause: { code: '23505' } })

    await db.delete(user).where(eq(user.id, userId))
    const photosAfterCascade = await db
      .select()
      .from(workerPhoto)
      .where(eq(workerPhoto.id, photoId))
    const documentsAfterCascade = await db
      .select()
      .from(workerDocument)
      .where(eq(workerDocument.id, documentId))
    expect(photosAfterCascade).toHaveLength(0)
    expect(documentsAfterCascade).toHaveLength(0)
  })
})
