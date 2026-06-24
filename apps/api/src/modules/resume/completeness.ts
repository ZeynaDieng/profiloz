import type { ResumeSnapshot } from '@profiloz/shared'

export function calculateCompleteness(resume: ResumeSnapshot): number {
  let score = 0
  const { personalInfo, educations, experiences, skills, certifications, summary } = resume

  if (personalInfo.fullName && personalInfo.email) score += 25
  else if (personalInfo.fullName || personalInfo.email) score += 12

  if (educations.length > 0) score += 15
  if (experiences.length > 0) score += 25
  if (skills.length >= 3) score += 20
  else if (skills.length > 0) score += 10
  if (summary?.trim()) score += 10
  if (certifications.length > 0 || resume.interests.length > 0) score += 5

  return Math.min(100, Math.round(score))
}

export function getMissingSections(resume: ResumeSnapshot): string[] {
  const missing: string[] = []
  if (!resume.personalInfo.fullName || !resume.personalInfo.email) missing.push('informations')
  if (resume.educations.length === 0) missing.push('formation')
  if (resume.experiences.length === 0) missing.push('experience')
  if (resume.skills.length < 3) missing.push('competences')
  if (!resume.summary?.trim()) missing.push('summary')
  return missing
}
