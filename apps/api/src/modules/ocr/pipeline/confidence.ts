import type {
  Education,
  Experience,
  ExtractionConfidence,
  PersonalInfo,
  ResumeSnapshot,
} from '@profiloz/shared'

const EMAIL_RE = /^[\w.+-]+@[\w-]+\.[\w.-]+$/i
const PHONE_RE = /^\+?[\d\s().-]{8,24}$/

function clamp(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(2))))
}

/** Confiance par champ de coordonnées (regex stricte = quasi-certitude). */
export function scorePersonalInfo(info: PersonalInfo): NonNullable<ExtractionConfidence['personalInfo']> {
  const scores: NonNullable<ExtractionConfidence['personalInfo']> = {}
  if (info.email) scores.email = EMAIL_RE.test(info.email.trim()) ? 1 : 0.6
  if (info.phone) scores.phone = PHONE_RE.test(info.phone.trim()) ? 0.97 : 0.65
  if (info.linkedinUrl) scores.linkedinUrl = 0.95
  if (info.websiteUrl) scores.websiteUrl = 0.9
  if (info.fullName) {
    const words = info.fullName.trim().split(/\s+/).length
    scores.fullName = words >= 2 && words <= 5 ? 0.9 : 0.7
  }
  if (info.jobTitle) scores.jobTitle = 0.72
  if (info.location) scores.location = 0.7
  return scores
}

/** Confiance d'une expérience selon la complétude de ses champs structurants. */
export function scoreExperience(exp: Experience): number {
  let score = 0.5
  if (exp.position?.trim()) score += 0.2
  if (exp.company?.trim()) score += 0.2
  if (exp.startDate || exp.endDate || exp.isCurrent) score += 0.1
  if (exp.description?.trim()) score += 0.05
  // Une entrée sans entreprise est plus douteuse (risque de confusion section).
  if (!exp.company?.trim()) score -= 0.1
  return clamp(score)
}

/** Confiance d'une formation selon la complétude de ses champs structurants. */
export function scoreEducation(edu: Education): number {
  let score = 0.5
  if (edu.degree?.trim()) score += 0.2
  if (edu.institution?.trim()) score += 0.2
  if (edu.startDate || edu.endDate) score += 0.1
  if (!edu.institution?.trim()) score -= 0.1
  return clamp(score)
}

/**
 * Agrège tous les scores en un objet `ExtractionConfidence` + un score global
 * (moyenne pondérée des informations présentes).
 */
export function buildConfidence(data: Partial<ResumeSnapshot>): ExtractionConfidence {
  const personalInfo = data.personalInfo ? scorePersonalInfo(data.personalInfo) : {}
  const experiences = (data.experiences ?? []).map(scoreExperience)
  const educations = (data.educations ?? []).map(scoreEducation)
  const skills = (data.skills ?? []).map(() => 0.8)
  const languages = (data.languages ?? []).map(() => 0.9)
  const certifications = (data.certifications ?? []).map(() => 0.8)
  const interests = (data.interests ?? []).map(() => 0.85)
  const summary = data.summary?.trim() ? 0.8 : undefined

  const all = [
    ...Object.values(personalInfo),
    ...experiences,
    ...educations,
    ...skills,
    ...languages,
    ...certifications,
    ...interests,
    ...(summary !== undefined ? [summary] : []),
  ]
  const overall = all.length ? clamp(all.reduce((sum, value) => sum + value, 0) / all.length) : 0

  return {
    personalInfo,
    summary,
    experiences,
    educations,
    skills,
    languages,
    certifications,
    interests,
    overall,
  }
}
