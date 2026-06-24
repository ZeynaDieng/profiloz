import type { ResumeSnapshot } from '@profiloz/shared'
import { migrateResumeSchema, saveResumeSnapshotSchema } from '@profiloz/validators'
import { randomUUID } from 'crypto'
import { AppError } from '@/lib/errors'
import { guestSessionRepository } from '@/modules/guest/guest.repository'
import { calculateCompleteness, getMissingSections } from './completeness'
import { resumeEntityToSnapshot, resumeRepository } from './resume.repository'

function inputToSnapshot(input: ReturnType<typeof saveResumeSnapshotSchema.parse>): ResumeSnapshot {
  const snapshot: ResumeSnapshot = {
    id: randomUUID(),
    title: input.title,
    templateSlug: input.templateSlug,
    templateConfig: input.templateConfig ?? {},
    personalInfo: input.personalInfo ?? {},
    summary: input.summary,
    experiences: input.experiences ?? [],
    educations: input.educations ?? [],
    skills: input.skills ?? [],
    certifications: input.certifications ?? [],
    interests: input.interests ?? [],
    languages: input.languages ?? [],
    metadata: {
      completeness: 0,
      lastModified: new Date().toISOString(),
      source: 'manual',
    },
  }
  snapshot.metadata.completeness = calculateCompleteness(snapshot)
  return snapshot
}

export class ResumeService {
  async migrate(userId: string, body: unknown) {
    const input = migrateResumeSchema.parse(body)
    const guest = await guestSessionRepository.findBySessionId(input.guestSessionId)
    if (!guest) throw new AppError(404, 'Not Found', 'Session invité introuvable')

    const snapshot = input.resumeSnapshot as unknown as ResumeSnapshot
    snapshot.metadata = {
      ...snapshot.metadata,
      completeness: calculateCompleteness(snapshot),
      lastModified: new Date().toISOString(),
    }

    const resume = await resumeRepository.createFromSnapshot(snapshot, userId)

    return { migratedResumeId: resume.id, resume }
  }

  list(userId: string) {
    return resumeRepository.listByUser(userId)
  }

  async get(id: string, userId: string) {
    const resume = await resumeRepository.findById(id, userId)
    if (!resume) throw new AppError(404, 'Not Found', 'CV introuvable')
    return resumeEntityToSnapshot(resume)
  }

  async create(userId: string, body: unknown) {
    const input = saveResumeSnapshotSchema.parse(body)
    const snapshot = inputToSnapshot(input)
    const resume = await resumeRepository.createFromSnapshot(snapshot, userId)
    return resumeEntityToSnapshot(resume)
  }

  async update(id: string, userId: string, body: unknown) {
    const input = saveResumeSnapshotSchema.parse(body)
    const snapshot = inputToSnapshot(input)
    snapshot.id = id
    const resume = await resumeRepository.updateFromSnapshot(id, userId, snapshot)
    if (!resume) throw new AppError(404, 'Not Found', 'CV introuvable')
    return resumeEntityToSnapshot(resume)
  }

  async archive(id: string, userId: string) {
    const result = await resumeRepository.archive(id, userId)
    if (result.count === 0) throw new AppError(404, 'Not Found', 'CV introuvable')
  }

  async duplicate(id: string, userId: string) {
    const resume = await resumeRepository.duplicate(id, userId)
    if (!resume) throw new AppError(404, 'Not Found', 'CV introuvable')
    return resumeEntityToSnapshot(resume)
  }

  async getCompleteness(id: string, userId: string) {
    const snapshot = await this.get(id, userId)
    return {
      score: calculateCompleteness(snapshot),
      missingSections: getMissingSections(snapshot),
    }
  }
}

export const resumeService = new ResumeService()
