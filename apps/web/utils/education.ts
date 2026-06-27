import type { Education } from '@profiloz/shared'

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

export function filterCompleteEducations(educations: Education[]): Education[] {
  return educations.filter(isEducationComplete)
}

export function formatEducationPeriod(start?: string, end?: string): string {
  const startLabel = start?.trim() ?? ''
  const endLabel = end?.trim() ?? ''
  if (startLabel && endLabel) return `${startLabel} – ${endLabel}`
  return startLabel || endLabel
}
