import { describe, expect, it } from 'vitest'
import { cleanupService } from '../modules/cleanup/cleanup.service'

describe('cleanupService', () => {
  it('expose les jobs documentés', () => {
    expect(typeof cleanupService.cleanupPdfFiles).toBe('function')
    expect(typeof cleanupService.cleanupGuestSessions).toBe('function')
    expect(typeof cleanupService.cleanupOrphanFiles).toBe('function')
    expect(typeof cleanupService.runCleanupJobs).toBe('function')
  })

  it('retourne une structure de stats complète', async () => {
    const stats = await cleanupService.runCleanupJobs(['pdf', 'guest', 'orphan'])

    expect(stats).toMatchObject({
      pdfJobs: { deletedJobs: expect.any(Number), deletedFiles: expect.any(Number), errors: expect.any(Number) },
      guestSessions: {
        deletedSessions: expect.any(Number),
        deletedDocuments: expect.any(Number),
        deletedPdfJobs: expect.any(Number),
        deletedAvatarFiles: expect.any(Number),
        errors: expect.any(Number),
      },
      orphanFiles: {
        deletedFiles: expect.any(Number),
        deletedRenderSnapshots: expect.any(Number),
        errors: expect.any(Number),
      },
    })
  })
})
