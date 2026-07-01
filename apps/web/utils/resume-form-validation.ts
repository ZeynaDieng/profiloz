import type { Education, Experience } from '@profiloz/shared'
import { MSG } from '@profiloz/shared'

export type PersonalInfoForm = {
  fullName: string
  email: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validatePersonalInfoFields(form: PersonalInfoForm): {
  fieldErrors: Record<string, string>
  formError: string
} {
  const fieldErrors: Record<string, string> = {}

  if (!form.fullName.trim()) {
    fieldErrors.fullName = MSG.validation.name
  }
  if (!form.email.trim()) {
    fieldErrors.email = MSG.validation.requiredAlt
  } else if (!EMAIL_RE.test(form.email.trim())) {
    fieldErrors.email = MSG.validation.email
  }

  const formError = Object.keys(fieldErrors).length > 0 ? MSG.wizard.nameAndEmail : ''
  return { fieldErrors, formError }
}

export function validateParcoursFields(
  educations: Education[],
  experiences: Experience[],
): {
  fieldErrors: Record<string, string>
  formError: string
} {
  const fieldErrors: Record<string, string> = {}
  let formError = ''

  for (const [index, edu] of educations.entries()) {
    const errors = getEducationFieldErrors(edu)
    for (const [field, message] of Object.entries(errors)) {
      fieldErrors[educationFieldKey(index, field as EducationFieldKey)] = message
      if (!formError) formError = MSG.wizard.completeEducation
    }
  }

  for (const [index, exp] of experiences.entries()) {
    const errors = getExperienceFieldErrors(exp)
    for (const [field, message] of Object.entries(errors)) {
      fieldErrors[experienceFieldKey(index, field as ExperienceFieldKey)] = message
      if (!formError) formError = MSG.wizard.completeExperience
    }
  }

  return { fieldErrors, formError }
}

export function firstResumeEditorSectionWithErrors(fieldErrors: Record<string, string>): string | null {
  if (fieldErrors.fullName || fieldErrors.email) return 'personal'
  if (Object.keys(fieldErrors).some((key) => key.startsWith('edu-') || key.startsWith('exp-'))) {
    return 'parcours'
  }
  return null
}
