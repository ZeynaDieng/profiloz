import type { Experience } from '@profiloz/shared'

export function isExperienceComplete(experience: Experience): boolean {
  const hasEnd = Boolean(experience.endDate?.trim()) || Boolean(experience.isCurrent)
  return (
    Boolean(experience.company?.trim()) &&
    Boolean(experience.position?.trim()) &&
    Boolean(experience.location?.trim()) &&
    Boolean(experience.startDate?.trim()) &&
    hasEnd
  )
}

export function filterCompleteExperiences(experiences: Experience[]): Experience[] {
  return experiences.filter(isExperienceComplete)
}

export function hasExperienceContent(experience: Experience): boolean {
  return Boolean(
    experience.company?.trim() ||
      experience.position?.trim() ||
      experience.location?.trim() ||
      experience.startDate?.trim() ||
      experience.endDate?.trim() ||
      experience.description?.trim(),
  )
}

export function filterExperiencesWithContent(experiences: Experience[]): Experience[] {
  return experiences.filter(hasExperienceContent)
}
