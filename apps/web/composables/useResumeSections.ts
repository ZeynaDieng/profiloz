import type { MaybeRefOrGetter } from 'vue'
import type { ResumeSnapshot } from '@profiloz/shared'
import { resolveShowPhoto } from '@profiloz/shared'
import { resolveCvAccentColor } from '~/utils/template-accent-colors'

const FRENCH_MONTHS: Record<string, number> = {
  janvier: 0, jan: 0,
  fevrier: 1, février: 1, fev: 1, fév: 1,
  mars: 2, mar: 2,
  avril: 3, avr: 3,
  mai: 4,
  juin: 5, jui: 5,
  juillet: 6, juil: 6,
  aout: 7, août: 7, aou: 7,
  septembre: 8, sept: 8, sep: 8,
  octobre: 9, oct: 9,
  novembre: 10, nov: 10,
  decembre: 11, décembre: 11, dec: 11, déc: 11
}

function parseDateString(dateStr?: string | null): Date {
  if (!dateStr) return new Date(0)
  const clean = dateStr.trim().toLowerCase()
  if (!clean) return new Date(0)

  // 1. Format YYYY
  if (/^\d{4}$/.test(clean)) {
    return new Date(parseInt(clean, 10), 0, 1)
  }

  // 2. Format YYYY-MM
  if (/^\d{4}-\d{2}/.test(clean)) {
    return new Date(clean)
  }

  // 3. Format MM/YYYY
  const slashMatch = clean.match(/^(\d{1,2})\/(\d{4})$/)
  if (slashMatch) {
    const month = parseInt(slashMatch[1], 10) - 1
    const year = parseInt(slashMatch[2], 10)
    return new Date(year, month, 1)
  }

  // 4. Format avec mois textuels en français, ex: "Juin 2024" ou "Oct. 2022" ou "Janvier 23"
  const yearMatch = clean.match(/\b(\d{4}|\d{2})\b/)
  if (yearMatch) {
    let year = parseInt(yearMatch[1], 10)
    if (year < 100) year += 2000 // Gestion des années sur 2 chiffres (ex: 24 -> 2024)
    
    // Chercher le mois
    let month = 0
    for (const [key, value] of Object.entries(FRENCH_MONTHS)) {
      if (clean.includes(key)) {
        month = value
        break
      }
    }
    return new Date(year, month, 1)
  }

  const parsed = new Date(clean)
  if (!isNaN(parsed.getTime())) return parsed

  return new Date(0)
}

function compareDates(
  a: { startDate?: string; endDate?: string; isCurrent?: boolean },
  b: { startDate?: string; endDate?: string; isCurrent?: boolean }
): number {
  if (a.isCurrent && !b.isCurrent) return -1
  if (!a.isCurrent && b.isCurrent) return 1

  const aEnd = parseDateString(a.endDate)
  const bEnd = parseDateString(b.endDate)
  if (aEnd.getTime() !== bEnd.getTime()) {
    return bEnd.getTime() - aEnd.getTime()
  }

  const aStart = parseDateString(a.startDate)
  const bStart = parseDateString(b.startDate)
  return bStart.getTime() - aStart.getTime()
}

export function useResumeSections(resume: MaybeRefOrGetter<ResumeSnapshot>) {
  const snapshot = computed(() => {
    const raw = toValue(resume)
    const experiences = [...raw.experiences]
    const educations = [...raw.educations]
    return {
      ...raw,
      experiences,
      educations,
    }
  })
  const accent = computed(() =>
    resolveCvAccentColor(snapshot.value.templateSlug, snapshot.value.templateConfig.accentColor),
  )
  const config = useRuntimeConfig()

  const apiBaseUrl = computed(() => {
    const internal = (config.public as any).apiInternalBaseUrl?.trim() || (config as any).apiInternalBaseUrl?.trim()
    if (import.meta.server && internal) return internal.replace(/\/$/, '')
    return config.public.apiBaseUrl.replace(/\/$/, '')
  })

  const p = computed(() => {
    const info = snapshot.value.personalInfo
    return {
      ...info,
      photoUrl: resolvePhotoUrl(info.photoUrl, apiBaseUrl.value),
    }
  })

  const initials = computed(() =>
    (p.value.fullName || 'V')
      .split(' ')
      .filter(Boolean)
      .map((word) => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase(),
  )

  const contactItems = computed(() =>
    [p.value.email, p.value.phone, p.value.location, p.value.linkedinUrl, p.value.websiteUrl].filter(
      Boolean,
    ) as string[],
  )

  return {
    snapshot,
    accent,
    p,
    initials,
    contactItems,
    showPhotoBlock: computed(() => resolveShowPhoto(snapshot.value)),
    hasPhoto: computed(() => Boolean(p.value.photoUrl)),
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
