import type { Education } from '@profiloz/shared'
import { MSG } from '@profiloz/shared'

export type EducationFieldKey = 'institution' | 'degree' | 'field' | 'startDate' | 'endDate'

export function educationFieldKey(index: number, field: EducationFieldKey) {
  return `edu-${index}-${field}`
}

export function hasEducationContent(education: Education): boolean {
  return Boolean(
    education.institution?.trim() ||
      education.degree?.trim() ||
      education.field?.trim() ||
      education.startDate?.trim() ||
      education.endDate?.trim(),
  )
}

export function isEducationComplete(education: Education): boolean {
  return (
    Boolean(education.institution?.trim()) &&
    Boolean(education.degree?.trim()) &&
    Boolean(education.field?.trim()) &&
    Boolean(education.startDate?.trim()) &&
    Boolean(education.endDate?.trim())
  )
}

export function getEducationFieldErrors(
  education: Education,
): Partial<Record<EducationFieldKey, string>> {
  if (!hasEducationContent(education)) return {}

  const errors: Partial<Record<EducationFieldKey, string>> = {}
  if (!education.institution?.trim()) errors.institution = MSG.validation.required
  if (!education.degree?.trim()) errors.degree = MSG.validation.required
  if (!education.field?.trim()) errors.field = MSG.validation.required
  if (!education.startDate?.trim()) errors.startDate = MSG.validation.required
  if (!education.endDate?.trim()) errors.endDate = MSG.validation.required
  return errors
}

export function filterCompleteEducations(educations: Education[]): Education[] {
  return educations.filter(isEducationComplete)
}

export function formatEducationPeriod(start?: string, end?: string): string {
  const startLabel = start?.trim() ?? ''
  const endLabel = end?.trim() ?? ''
  if (startLabel && endLabel) return `${startLabel} – ${endLabel}`
  return startLabel || endLabel
}
