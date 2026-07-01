import type { Experience } from '@profiloz/shared'
import { MSG } from '@profiloz/shared'

export type ExperienceFieldKey =
  | 'company'
  | 'position'
  | 'location'
  | 'startDate'
  | 'endDate'

export function experienceFieldKey(index: number, field: ExperienceFieldKey) {
  return `exp-${index}-${field}`
}

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

export function getExperienceFieldErrors(
  experience: Experience,
): Partial<Record<ExperienceFieldKey, string>> {
  if (!hasExperienceContent(experience)) return {}

  const errors: Partial<Record<ExperienceFieldKey, string>> = {}
  if (!experience.company?.trim()) errors.company = MSG.validation.required
  if (!experience.position?.trim()) errors.position = MSG.validation.required
  if (!experience.location?.trim()) errors.location = MSG.validation.required
  if (!experience.startDate?.trim()) errors.startDate = MSG.validation.required
  if (!experience.endDate?.trim() && !experience.isCurrent) {
    errors.endDate = MSG.validation.required
  }
  return errors
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
