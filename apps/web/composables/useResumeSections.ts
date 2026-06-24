import type { MaybeRefOrGetter } from 'vue'
import type { ResumeSnapshot } from '@profiloz/shared'

export function useResumeSections(resume: MaybeRefOrGetter<ResumeSnapshot>) {
  const snapshot = computed(() => toValue(resume))
  const accent = computed(() => snapshot.value.templateConfig.accentColor ?? '#0051d5')
  const p = computed(() => snapshot.value.personalInfo)

  const contactItems = computed(() =>
    [p.value.email, p.value.phone, p.value.location, p.value.linkedinUrl, p.value.websiteUrl].filter(
      Boolean,
    ) as string[],
  )

  return {
    snapshot,
    accent,
    p,
    contactItems,
    hasSummary: computed(() => Boolean(snapshot.value.summary)),
    hasExperiences: computed(() => snapshot.value.experiences.length > 0),
    hasEducations: computed(() => snapshot.value.educations.length > 0),
    hasSkills: computed(() => snapshot.value.skills.length > 0),
    hasCertifications: computed(() => snapshot.value.certifications.length > 0),
    hasInterests: computed(() => snapshot.value.interests.length > 0),
    hasLanguages: computed(() => snapshot.value.languages.length > 0),
  }
}

export function formatDateRange(start?: string, end?: string, isCurrent?: boolean) {
  if (!start && !end) return ''
  const endLabel = isCurrent ? 'Présent' : end ?? ''
  return start ? `${start} – ${endLabel}` : endLabel
}
