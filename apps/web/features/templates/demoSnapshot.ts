import type { ResumeSnapshot, TemplateSlug } from '@profiloz/shared'
import { resolveShowPhoto } from '@profiloz/shared'
import { AMINATA_DEMO_RESUME, createAminataDemoResume } from '~/features/demo/aminata-persona'
import { cvTemplateAccentColors } from '~/utils/template-accent-colors'

export const DEMO_RESUME: ResumeSnapshot = AMINATA_DEMO_RESUME

function pickText(user?: string | null, fallback?: string) {
  const value = user?.trim()
  return value ? user! : (fallback ?? '')
}

function hasListContent(items: unknown[] | undefined | null) {
  if (!items?.length) return false
  return items.some((item) => {
    if (!item || typeof item !== 'object') return Boolean(item)
    return Object.values(item as Record<string, unknown>).some((value) => {
      if (typeof value === 'string') return value.trim().length > 0
      if (typeof value === 'boolean') return value
      if (Array.isArray(value)) return value.length > 0
      return value != null && value !== ''
    })
  })
}

/**
 * Aperçu = données utilisateur + repli démo Aminata sur les champs vides.
 * Le formulaire reste vide (placeholders) ; l’aperçu ne se vide jamais.
 */
export function buildPreviewSnapshot(
  slug: ResumeSnapshot['templateSlug'],
  accentColor?: string,
  userSnapshot?: ResumeSnapshot | null,
): ResumeSnapshot {
  const defaultAccent = cvTemplateAccentColors(slug).accent

  if (!userSnapshot) {
    const base = createAminataDemoResume(slug, accentColor ?? defaultAccent)
    if (slug === 'CADRE') {
      base.templateConfig = { ...base.templateConfig, accentColor: accentColor ?? '#1a3050' }
    } else if (slug === 'EXECUTIF') {
      base.templateConfig = { ...base.templateConfig, accentColor: accentColor ?? '#2c3e50' }
    } else if (accentColor) {
      base.templateConfig = { ...base.templateConfig, accentColor }
    }
    return base
  }

  return {
    ...userSnapshot,
    templateSlug: slug as TemplateSlug,
    templateConfig: {
      ...userSnapshot.templateConfig,
      showPhoto: resolveShowPhoto(userSnapshot),
      accentColor: accentColor ?? userSnapshot.templateConfig?.accentColor ?? defaultAccent,
    },
    personalInfo: {
      fullName: userSnapshot.personalInfo?.fullName ?? '',
      email: userSnapshot.personalInfo?.email ?? '',
      phone: userSnapshot.personalInfo?.phone ?? '',
      location: userSnapshot.personalInfo?.location ?? '',
      jobTitle: userSnapshot.personalInfo?.jobTitle ?? '',
      linkedinUrl: userSnapshot.personalInfo?.linkedinUrl ?? '',
      websiteUrl: userSnapshot.personalInfo?.websiteUrl ?? '',
      photoUrl: userSnapshot.personalInfo?.photoUrl,
    },
    summary: userSnapshot.summary ?? '',
    experiences: userSnapshot.experiences ?? [],
    educations: userSnapshot.educations ?? [],
    skills: userSnapshot.skills ?? [],
    languages: userSnapshot.languages ?? [],
    interests: userSnapshot.interests ?? [],
    certifications: userSnapshot.certifications ?? [],
  }
}
