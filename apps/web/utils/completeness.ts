import type { ResumeSnapshot } from '@profiloz/shared'

export function calculateCompleteness(resume: ResumeSnapshot): number {
  let score = 0
  const weights = {
    personal: 25,
    education: 15,
    experience: 25,
    skills: 20,
    summary: 10,
    extras: 5,
  }

  const { personalInfo, educations, experiences, skills, certifications, summary } = resume

  if (personalInfo.fullName && personalInfo.email) score += weights.personal
  else if (personalInfo.fullName || personalInfo.email) score += weights.personal / 2

  if (educations.length > 0) score += weights.education
  if (experiences.length > 0) score += weights.experience
  if (skills.length >= 3) score += weights.skills
  else if (skills.length > 0) score += weights.skills / 2

  if (summary?.trim()) score += weights.summary
  if (certifications.length > 0 || resume.interests.length > 0) score += weights.extras

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
