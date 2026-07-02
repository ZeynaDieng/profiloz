import type { Education, Experience, Language, PersonalInfo, ResumeSnapshot, Skill } from '@profiloz/shared'
import { extractSkillsFromText, mergeSkillLists } from '../dictionaries/skills'
import { isExperienceDateLabel, isValidExperienceRoleTitle } from '../ocr.parser'

const EMAIL_RE = /^[\w.+-]+@[\w-]+\.[\w.-]+$/i
const PHONE_RE = /^\+?[\d\s().-]{8,24}$/

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

function scorePersonalField(field: keyof PersonalInfo, value: string): number {
  const trimmed = value.trim()
  if (!trimmed) return 0
  if (field === 'email') return EMAIL_RE.test(trimmed) ? 1 : 0.5
  if (field === 'phone') return PHONE_RE.test(trimmed) ? 0.95 : 0.55
  if (field === 'fullName') {
    const words = trimmed.split(/\s+/).length
    return words >= 2 && words <= 5 ? 0.9 : 0.6
  }
  if (field === 'linkedinUrl' || field === 'websiteUrl') return trimmed.includes('.') ? 0.9 : 0.5
  return Math.min(1, trimmed.length / 30)
}

/** Conserve la valeur la plus fiable entre deux candidats. */
function pickBestPersonalField(
  field: keyof PersonalInfo,
  current: string | undefined,
  candidate: string | undefined,
): string | undefined {
  if (!candidate?.trim()) return current
  if (!current?.trim()) return candidate.trim()
  return scorePersonalField(field, candidate) > scorePersonalField(field, current)
    ? candidate.trim()
    : current
}

function scoreExperience(exp: Experience): number {
  let score = 0
  if (exp.position?.trim()) score += 0.35
  if (exp.company?.trim()) score += 0.35
  if (exp.startDate || exp.endDate || exp.isCurrent) score += 0.15
  if (exp.description?.trim()) score += 0.1
  if (exp.location?.trim()) score += 0.05
  return score
}

function experiencesMatch(a: Experience, b: Experience): boolean {
  const posA = normalizeKey(a.position ?? '')
  const posB = normalizeKey(b.position ?? '')
  const companyA = normalizeKey(a.company ?? '')
  const companyB = normalizeKey(b.company ?? '')
  if (!posA && !companyA) return false
  if (posA && posB && posA === posB && (!companyA || !companyB || companyA === companyB)) return true
  if (companyA && companyB && companyA === companyB && (!posA || !posB || posA === posB)) return true
  return false
}

function mergeExperienceKeepBest(target: Experience, source: Experience): Experience {
  const targetScore = scoreExperience(target)
  const sourceScore = scoreExperience(source)
  const best = sourceScore > targetScore ? source : target
  const other = best === source ? target : source

  return {
    position: best.position?.trim() || other.position,
    company: best.company?.trim() || other.company,
    location: target.location || source.location || other.location,
    country: target.country || source.country || other.country,
    startDate: target.startDate || source.startDate || other.startDate,
    endDate: target.endDate || source.endDate || other.endDate,
    isCurrent: target.isCurrent || source.isCurrent,
    description: [target.description, source.description].filter(Boolean).join('\n') || undefined,
    skillsUsed: target.skillsUsed?.length ? target.skillsUsed : source.skillsUsed,
  }
}

function dedupeExperiences(items: Experience[]): Experience[] {
  const result: Experience[] = []
  for (const item of items) {
    if (!item.position?.trim() && !item.company?.trim()) continue
    const index = result.findIndex((existing) => experiencesMatch(existing, item))
    if (index >= 0) {
      result[index] = mergeExperienceKeepBest(result[index]!, item)
      continue
    }
    result.push(item)
  }
  return result
}

function dedupeEducations(items: Education[]): Education[] {
  const seen = new Set<string>()
  const result: Education[] = []
  for (const item of items) {
    const key = `${normalizeKey(item.institution ?? '')}|${normalizeKey(item.degree ?? '')}`
    if (!key.replace('|', '') || seen.has(key)) continue
    seen.add(key)
    if (item.degree?.trim() || item.institution?.trim()) result.push(item)
  }
  return result
}

function dedupeLanguages(items: Language[]): Language[] {
  const seen = new Map<string, Language>()
  for (const lang of items) {
    const key = normalizeKey(lang.name)
    if (!key) continue
    const existing = seen.get(key)
    if (!existing) {
      seen.set(key, lang)
      continue
    }
    if (lang.level && !existing.level) existing.level = lang.level
  }
  return [...seen.values()]
}

function dedupeByName<T extends { name: string }>(items: T[]): T[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = normalizeKey(item.name)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * Fusion intelligente post-extraction :
 * - enrichit les compétences via dictionnaire (même dans les phrases) ;
 * - déduplique sans écraser la donnée la plus fiable ;
 * - complète les coordonnées depuis le texte brut sans remplacer une valeur déjà bonne.
 */
export function smartMerge(
  data: Partial<ResumeSnapshot>,
  rawText: string,
  options?: { skipDictionarySkills?: boolean },
): Partial<ResumeSnapshot> {
  const personalInfo: PersonalInfo = { ...(data.personalInfo ?? {}) }

  const emailMatch = rawText.match(/[\p{L}\p{N}.+-]+@[\p{L}\p{N}-]+\.[\p{L}\p{N}.-]+/iu)?.[0]
  const phoneMatch = rawText.match(/(?:\+?\d{1,4}[\s.-]?)?(?:\(?\d{1,4}\)?[\s.-]?)?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{2,4}(?:[\s.-]?\d{2,4})?/)?.[0]?.trim()
  const linkedinMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s,]+/i)?.[0]

  personalInfo.email = pickBestPersonalField('email', personalInfo.email, emailMatch)
  personalInfo.phone = pickBestPersonalField('phone', personalInfo.phone, phoneMatch)
  if (linkedinMatch) {
    personalInfo.linkedinUrl = pickBestPersonalField(
      'linkedinUrl',
      personalInfo.linkedinUrl,
      /^https?:\/\//i.test(linkedinMatch) ? linkedinMatch : `https://${linkedinMatch}`,
    )
  }

  const dictSkills =
    options?.skipDictionarySkills || (data.skills ?? []).length >= 2
      ? []
      : extractSkillsFromText(rawText)
  const skills = mergeSkillLists(data.skills ?? [], dictSkills)

  const parsedTitle = personalInfo.jobTitle?.trim()
  const shouldReplaceJobTitle =
    !parsedTitle ||
    isExperienceDateLabel(parsedTitle) ||
    /\b(microsoft|excel|word|powerpoint|office|google)\b/i.test(parsedTitle) ||
    !isValidExperienceRoleTitle(parsedTitle)

  if (shouldReplaceJobTitle) {
    const current = (data.experiences ?? []).find(
      (e) => e.isCurrent && isValidExperienceRoleTitle(e.position ?? ''),
    )
    const first = (data.experiences ?? []).find((e) => isValidExperienceRoleTitle(e.position ?? ''))
    personalInfo.jobTitle =
      current?.position ??
      first?.position ??
      (isExperienceDateLabel(parsedTitle ?? '') ? undefined : parsedTitle)
  }

  return {
    ...data,
    personalInfo,
    experiences: dedupeExperiences(data.experiences ?? []),
    educations: dedupeEducations(data.educations ?? []),
    skills,
    languages: dedupeLanguages(data.languages ?? []),
    certifications: dedupeByName(data.certifications ?? []),
    interests: dedupeByName(data.interests ?? []),
  }
}
