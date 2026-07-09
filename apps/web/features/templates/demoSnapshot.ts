import type { ResumeSnapshot, TemplateSlug } from '@profiloz/shared'
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
  const base = createAminataDemoResume(slug, accentColor ?? defaultAccent)
  if (slug === 'CADRE') {
    base.templateConfig = { ...base.templateConfig, accentColor: accentColor ?? '#1a3050' }
  } else if (slug === 'EXECUTIF') {
    base.templateConfig = { ...base.templateConfig, accentColor: accentColor ?? '#2c3e50' }
  } else if (accentColor) {
    base.templateConfig = { ...base.templateConfig, accentColor }
  }

  if (!userSnapshot) return base

  const userPi = userSnapshot.personalInfo ?? {}
  const basePi = base.personalInfo

  return {
    ...base,
    ...userSnapshot,
    templateSlug: slug as TemplateSlug,
    templateConfig: {
      ...base.templateConfig,
      ...userSnapshot.templateConfig,
      accentColor:
        accentColor
        ?? userSnapshot.templateConfig?.accentColor
        ?? base.templateConfig.accentColor,
    },
    personalInfo: {
      ...basePi,
      ...userPi,
      fullName: pickText(userPi.fullName, basePi.fullName),
      email: pickText(userPi.email, basePi.email),
      phone: pickText(userPi.phone, basePi.phone),
      location: pickText(userPi.location, basePi.location),
      jobTitle: pickText(userPi.jobTitle, basePi.jobTitle),
      linkedinUrl: pickText(userPi.linkedinUrl, basePi.linkedinUrl),
      websiteUrl: pickText(userPi.websiteUrl, basePi.websiteUrl),
      photoUrl: userPi.photoUrl || basePi.photoUrl,
    },
    summary: pickText(userSnapshot.summary, base.summary),
    experiences: hasListContent(userSnapshot.experiences) ? userSnapshot.experiences : base.experiences,
    educations: hasListContent(userSnapshot.educations) ? userSnapshot.educations : base.educations,
    skills: hasListContent(userSnapshot.skills) ? userSnapshot.skills : base.skills,
    languages: hasListContent(userSnapshot.languages) ? userSnapshot.languages : base.languages,
    interests: hasListContent(userSnapshot.interests) ? userSnapshot.interests : base.interests,
    certifications: hasListContent(userSnapshot.certifications)
      ? userSnapshot.certifications
      : base.certifications,
  }
}
