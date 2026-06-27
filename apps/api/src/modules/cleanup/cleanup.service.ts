import { prisma } from '@/lib/prisma'
import { storageProvider } from '@/lib/storage'

const PDF_RENDER_MAX_AGE_MS = 60 * 60 * 1000
const ORPHAN_SCAN_PREFIXES = ['uploads/', 'pdf/', 'avatars/'] as const
const AVATAR_STORAGE_PREFIX = 'avatars/'

function isLocalAvatarStorageKey(value: string): boolean {
  return value.startsWith(AVATAR_STORAGE_PREFIX) && !value.includes('..')
}

export type CleanupJobName = 'pdf' | 'guest' | 'orphan'

export type CleanupStats = {
  pdfJobs: { deletedJobs: number; deletedFiles: number; errors: number }
  guestSessions: {
    deletedSessions: number
    deletedDocuments: number
    deletedPdfJobs: number
    deletedAvatarFiles: number
    errors: number
  }
  orphanFiles: { deletedFiles: number; deletedRenderSnapshots: number; errors: number }
}

async function deleteStorageKey(key: string): Promise<boolean> {
  try {
    await storageProvider.delete(key)
    return true
  } catch {
    return false
  }
}

async function collectReferencedStorageKeys(): Promise<Set<string>> {
  const keys = new Set<string>()

  const [documents, pdfJobs, resumes] = await Promise.all([
    prisma.document.findMany({ select: { storageKey: true } }),
    prisma.pdfJob.findMany({ select: { storageKey: true } }),
    prisma.resume.findMany({ select: { photoUrl: true } }),
  ])

  for (const doc of documents) keys.add(doc.storageKey)
  for (const job of pdfJobs) {
    if (job.storageKey) keys.add(job.storageKey)
  }
  for (const resume of resumes) {
    const photoUrl = resume.photoUrl?.trim()
    if (photoUrl && isLocalAvatarStorageKey(photoUrl)) keys.add(photoUrl)
  }

  return keys
}

export async function cleanupPdfFiles(): Promise<CleanupStats['pdfJobs']> {
  const stats = { deletedJobs: 0, deletedFiles: 0, errors: 0 }
  const now = new Date()

  const expiredJobs = await prisma.pdfJob.findMany({
    where: {
      expiresAt: { lt: now },
    },
    select: { id: true, storageKey: true },
  })

  for (const job of expiredJobs) {
    try {
      if (job.storageKey) {
        const deleted = await deleteStorageKey(job.storageKey)
        if (deleted) stats.deletedFiles += 1
      }
      await prisma.pdfJob.delete({ where: { id: job.id } })
      stats.deletedJobs += 1
    } catch {
      stats.errors += 1
    }
  }

  return stats
}

async function deleteGuestAvatarFiles(guestSessionDbId: string): Promise<number> {
  return storageProvider.deleteByPrefix(`avatars/guest/${guestSessionDbId}`)
}

export async function cleanupGuestSessions(): Promise<CleanupStats['guestSessions']> {
  const stats = {
    deletedSessions: 0,
    deletedDocuments: 0,
    deletedPdfJobs: 0,
    deletedAvatarFiles: 0,
    errors: 0,
  }

  const expiredSessions = await prisma.guestSession.findMany({
    where: { expiresAt: { lt: new Date() } },
    include: {
      documents: { select: { id: true, storageKey: true } },
      pdfJobs: { select: { id: true, storageKey: true } },
    },
  })

  for (const session of expiredSessions) {
    try {
      await prisma.$transaction(async (tx) => {
        for (const document of session.documents) {
          await deleteStorageKey(document.storageKey)
          await tx.document.delete({ where: { id: document.id } })
          stats.deletedDocuments += 1
        }

        for (const job of session.pdfJobs) {
          if (job.storageKey) {
            await deleteStorageKey(job.storageKey)
          }
          await tx.pdfJob.delete({ where: { id: job.id } })
          stats.deletedPdfJobs += 1
        }

        await tx.guestSession.delete({ where: { id: session.id } })
      })

      stats.deletedAvatarFiles += await deleteGuestAvatarFiles(session.id)
      stats.deletedSessions += 1
    } catch {
      stats.errors += 1
    }
  }

  return stats
}

async function cleanupStaleRenderSnapshots(): Promise<number> {
  const files = await storageProvider.list('pdf-render')
  const cutoff = Date.now() - PDF_RENDER_MAX_AGE_MS
  let deleted = 0

  for (const key of files) {
    try {
      const fileStat = await storageProvider.stat(key)
      if (!fileStat || fileStat.modifiedAt.getTime() >= cutoff) continue
      if (await deleteStorageKey(key)) deleted += 1
    } catch {
      // ignore unreadable files
    }
  }

  return deleted
}

export async function cleanupOrphanFiles(): Promise<CleanupStats['orphanFiles']> {
  const stats = { deletedFiles: 0, deletedRenderSnapshots: 0, errors: 0 }
  const referencedKeys = await collectReferencedStorageKeys()

  stats.deletedRenderSnapshots = await cleanupStaleRenderSnapshots()

  const allFiles = (
    await Promise.all(ORPHAN_SCAN_PREFIXES.map((prefix) => storageProvider.list(prefix.replace(/\/$/, ''))))
  ).flat()

  for (const key of allFiles) {
    if (referencedKeys.has(key)) continue
    if (!ORPHAN_SCAN_PREFIXES.some((prefix) => key.startsWith(prefix))) continue

    try {
      if (await deleteStorageKey(key)) stats.deletedFiles += 1
    } catch {
      stats.errors += 1
    }
  }

  return stats
}

export async function runCleanupJobs(jobs: CleanupJobName[] = ['pdf', 'guest', 'orphan']): Promise<CleanupStats> {
  const stats: CleanupStats = {
    pdfJobs: { deletedJobs: 0, deletedFiles: 0, errors: 0 },
    guestSessions: {
      deletedSessions: 0,
      deletedDocuments: 0,
      deletedPdfJobs: 0,
      deletedAvatarFiles: 0,
      errors: 0,
    },
    orphanFiles: { deletedFiles: 0, deletedRenderSnapshots: 0, errors: 0 },
  }

  if (jobs.includes('pdf')) {
    stats.pdfJobs = await cleanupPdfFiles()
  }
  if (jobs.includes('guest')) {
    stats.guestSessions = await cleanupGuestSessions()
  }
  if (jobs.includes('orphan')) {
    stats.orphanFiles = await cleanupOrphanFiles()
  }

  return stats
}

export const cleanupService = {
  cleanupPdfFiles,
  cleanupGuestSessions,
  cleanupOrphanFiles,
  runCleanupJobs,
}
