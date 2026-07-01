import { randomUUID } from 'crypto'
import type { ResumeSnapshot } from '@profiloz/shared'
import { TEMPLATE_SLUGS, sanitizePhotoReference } from '@profiloz/shared'
import { AppError } from '@/lib/errors'

const DEFAULT_TEMPLATE = 'PROFESSIONNEL' as ResumeSnapshot['templateSlug']
const VALID_TEMPLATES = new Set<string>(TEMPLATE_SLUGS)

/** Normalise un snapshot invité avant génération PDF (évite les 500 sur champs manquants). */
export function normalizeResumeSnapshotForPdf(input: unknown): ResumeSnapshot {
  if (!input || typeof input !== 'object') {
    throw new AppError(422, 'Validation Error', 'Snapshot CV invalide')
  }

  const raw = input as Partial<ResumeSnapshot>
  const personalInfo = raw.personalInfo && typeof raw.personalInfo === 'object' ? raw.personalInfo : {}
  const rawTemplate =
    typeof raw.templateSlug === 'string' && VALID_TEMPLATES.has(raw.templateSlug)
      ? raw.templateSlug
      : DEFAULT_TEMPLATE

  const snapshot: ResumeSnapshot = {
    id: typeof raw.id === 'string' && raw.id.trim() ? raw.id : randomUUID(),
    title: typeof raw.title === 'string' && raw.title.trim() ? raw.title : 'Mon CV',
    templateSlug: rawTemplate as ResumeSnapshot['templateSlug'],
    templateConfig: raw.templateConfig && typeof raw.templateConfig === 'object' ? raw.templateConfig : {},
    personalInfo: {
      ...personalInfo,
      photoUrl: sanitizePhotoReference(personalInfo.photoUrl),
    },
    summary: typeof raw.summary === 'string' ? raw.summary : undefined,
    experiences: Array.isArray(raw.experiences) ? raw.experiences : [],
    educations: Array.isArray(raw.educations) ? raw.educations : [],
    skills: Array.isArray(raw.skills) ? raw.skills : [],
    certifications: Array.isArray(raw.certifications) ? raw.certifications : [],
    interests: Array.isArray(raw.interests) ? raw.interests : [],
    languages: Array.isArray(raw.languages) ? raw.languages : [],
    metadata:
      raw.metadata && typeof raw.metadata === 'object'
        ? raw.metadata
        : {
            completeness: 0,
            lastModified: new Date().toISOString(),
            source: 'wizard',
          },
  }

  if (!snapshot.personalInfo.fullName?.trim()) {
    throw new AppError(422, 'Validation Error', 'Le nom complet est requis pour générer le PDF.')
  }

  return snapshot
}

export function toPdfGenerationError(error: unknown): AppError {
  if (error instanceof AppError) return error

  const message = error instanceof Error ? error.message : 'Erreur inconnue'
  if (/Impossible de générer le PDF|page d.impression|Timeout|ERR_|Navigation|Chrome introuvable|Chromium/i.test(message)) {
    return new AppError(
      503,
      'Service Unavailable',
      'Impossible de générer le PDF pour le moment. Réessayez dans quelques secondes ou contactez le support si le problème persiste.',
    )
  }

  return new AppError(500, 'Internal Server Error', 'Erreur lors de la génération du PDF.')
}
