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

function parseDateString(dateStr?: string | null, preferLastYear = false): Date {
  if (!dateStr) return new Date(0)
  const clean = dateStr.trim().toLowerCase()
  if (!clean) return new Date(0)

  // Mots-clés signifiant "poste actuel" → date future pour tri en tête
  const currentKeywords = ['présent', 'present', 'actuel', 'actuelle', 'current', 'maintenant', 'now', 'à ce jour', 'a ce jour', 'en cours', 'ongoing']
  if (currentKeywords.some((kw) => clean.includes(kw)) || clean.includes("aujourd'hui") || clean.includes("aujourd")) {
    return new Date(Date.now() + 86400000) // demain → tri en premier
  }

  // 1. Format YYYY
  if (/^\d{4}$/.test(clean)) {
    return new Date(parseInt(clean, 10), 0, 1)
  }

  // 2. Format YYYY-MM ou YYYY/MM
  if (/^\d{4}[-/]\d{2}/.test(clean)) {
    return new Date(clean.replace(/\//g, '-'))
  }

  // 3. Format MM/YYYY
  const slashMatch = clean.match(/^(\d{1,2})\/(\d{4})$/)
  if (slashMatch) {
    const month = parseInt(slashMatch[1], 10) - 1
    const year = parseInt(slashMatch[2], 10)
    return new Date(year, month, 1)
  }

  // 4. Extraction de toutes les années (4 chiffres ou 2 chiffres)
  const yearMatches = [...clean.matchAll(/\b(\d{4}|\d{2})\b/g)]
  if (yearMatches.length > 0) {
    // Si preferLastYear (ex: pour endDate) et qu'il y a plusieurs années dans la chaîne (ex: "2019-2022"), on prend la dernière
    const selectedMatch = preferLastYear && yearMatches.length > 1 ? yearMatches[yearMatches.length - 1] : yearMatches[0]
    let year = parseInt(selectedMatch[1], 10)
    if (year < 100) year += 2000

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

function getItemEndDate(item: { startDate?: string; endDate?: string; isCurrent?: boolean }): Date {
  if (item.isCurrent) {
    return new Date(Date.now() + 86400000) // poste actuel -> trier tout en haut
  }
  if (item.endDate?.trim()) {
    const parsed = parseDateString(item.endDate, true)
    if (parsed.getTime() > 0) return parsed
  }
  // Si pas de endDate valide, utiliser la startDate comme date de fin de repli
  if (item.startDate?.trim()) {
    return parseDateString(item.startDate, false)
  }
  return new Date(0)
}

function getItemStartDate(item: { startDate?: string; endDate?: string; isCurrent?: boolean }): Date {
  if (item.startDate?.trim()) {
    return parseDateString(item.startDate, false)
  }
  return new Date(0)
}

function compareDates(
  a: { startDate?: string; endDate?: string; isCurrent?: boolean },
  b: { startDate?: string; endDate?: string; isCurrent?: boolean }
): number {
  const aEnd = getItemEndDate(a)
  const bEnd = getItemEndDate(b)

  if (aEnd.getTime() !== bEnd.getTime()) {
    return bEnd.getTime() - aEnd.getTime() // Plus récent en premier
  }

  const aStart = getItemStartDate(a)
  const bStart = getItemStartDate(b)

  return bStart.getTime() - aStart.getTime() // Plus récent en premier
}

export function useResumeSections(resume: MaybeRefOrGetter<ResumeSnapshot>) {
  const snapshot = computed(() => {
    const raw = toValue(resume)
    const isCustomOrder = (raw.templateConfig as any)?.customOrder ?? false

    const experiences = isCustomOrder
      ? [...raw.experiences]
      : [...raw.experiences].sort(compareDates)

    const educations = isCustomOrder
      ? [...raw.educations]
      : [...raw.educations].sort(compareDates)

    const languages = (raw.languages ?? [])
      .map((item: any) => {
        if (!item) return null
        if (typeof item === 'string') {
          const name = item.trim()
          return name ? { name, level: undefined } : null
        }
        const name = String(item.name || item.language || item.label || item.value || '').trim()
        if (!name) return null
        const rawLevel = item.level ? String(item.level).trim() : ''
        return {
          ...item,
          name,
          level: rawLevel ? formatLanguageLevel(rawLevel) : undefined,
        }
      })
      .filter((x): x is { id?: string; name: string; level?: string } => x !== null)

    const interests = (raw.interests ?? [])
      .map((item: any) => {
        if (!item) return null
        if (typeof item === 'string') {
          const name = item.trim()
          return name ? { name } : null
        }
        const name = String(item.name || item.label || item.title || item.interest || item.value || '').trim()
        if (!name) return null
        return {
          ...item,
          name,
        }
      })
      .filter((x): x is { id?: string; name: string } => x !== null)

    return {
      ...raw,
      experiences,
      educations,
      languages,
      interests,
    }
  })
  const accent = computed(() =>
    resolveCvAccentColor(snapshot.value.templateSlug, snapshot.value.templateConfig.accentColor),
  )
  const config = useRuntimeConfig()

  const apiBaseUrl = computed(() => {
    const internal = config.public.apiInternalBaseUrl?.trim()
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

const SKILL_LEVEL_LABELS: Record<string, string> = {
  BEGINNER: 'Débutant',
  INTERMEDIATE: 'Intermédiaire',
  ADVANCED: 'Avancé',
  EXPERT: 'Expert',
  DEBUTANT: 'Débutant',
  INTERMEDIAIRE: 'Intermédiaire',
  AVANCE: 'Avancé',
}

export function formatSkillLevel(level?: string | null): string {
  if (!level) return ''
  const trimmed = level.trim()
  if (!trimmed) return ''
  const upper = trimmed.toUpperCase()
  return SKILL_LEVEL_LABELS[upper] || trimmed
}

const LANG_LEVEL_LABELS: Record<string, string> = {
  NATIVE: 'Maternelle',
  PROFESSIONAL: 'Courant',
  CONVERSATIONAL: 'Intermédiaire',
  BASIC: 'Notions',
  native: 'Maternelle',
  professional: 'Courant',
  conversational: 'Intermédiaire',
  basic: 'Notions',
  BEGINNER: 'Notions',
  INTERMEDIATE: 'Intermédiaire',
  ADVANCED: 'Courant',
  EXPERT: 'Maternelle',
}

export function formatLanguageLevel(level?: string | null): string {
  if (!level) return ''
  const trimmed = level.trim()
  if (!trimmed) return ''
  const upper = trimmed.toUpperCase()
  return LANG_LEVEL_LABELS[upper] || trimmed
}
