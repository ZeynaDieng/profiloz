import type { ResumeSnapshot, TemplateSlug } from '@profiloz/shared'
import { AMINATA_DEMO_RESUME, createAminataDemoResume } from '~/features/demo/aminata-persona'
import { cvTemplateAccentColors } from '~/utils/template-accent-colors'

export const DEMO_RESUME: ResumeSnapshot = AMINATA_DEMO_RESUME

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
  if (userSnapshot?.personalInfo.fullName) {
    return {
      ...userSnapshot,
      templateSlug: slug,
      templateConfig: {
        ...userSnapshot.templateConfig,
        accentColor: accentColor ?? userSnapshot.templateConfig.accentColor ?? base.templateConfig.accentColor,
      },
      experiences: userSnapshot.experiences?.length ? userSnapshot.experiences : base.experiences,
      educations: userSnapshot.educations?.length ? userSnapshot.educations : base.educations,
      skills: userSnapshot.skills?.length ? userSnapshot.skills : base.skills,
      languages: userSnapshot.languages?.length ? userSnapshot.languages : base.languages,
      interests: userSnapshot.interests?.length ? userSnapshot.interests : base.interests,
      summary: userSnapshot.summary?.trim() ? userSnapshot.summary : base.summary,
    }
  }
  return base
}
