import { MSG } from '@profiloz/shared'

export type CoverLetterFormValues = {
  senderName: string
  senderEmail: string
  companyName: string
  position: string
  content: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateCoverLetterFields(form: CoverLetterFormValues): {
  fieldErrors: Record<string, string>
  formError: string
} {
  const fieldErrors: Record<string, string> = {}

  if (!form.senderName.trim()) {
    fieldErrors.senderName = MSG.validation.name
  }
  if (form.senderEmail.trim() && !EMAIL_RE.test(form.senderEmail.trim())) {
    fieldErrors.senderEmail = MSG.validation.email
  }
  if (!form.companyName.trim()) {
    fieldErrors.companyName = MSG.validation.requiredAlt
  }
  if (!form.position.trim()) {
    fieldErrors.position = MSG.validation.requiredAlt
  }
  if (!form.content.trim()) {
    fieldErrors.content = MSG.validation.required
  }

  const formError = Object.keys(fieldErrors).length > 0 ? MSG.validation.invalidData : ''
  return { fieldErrors, formError }
}
