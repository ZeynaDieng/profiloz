import { z } from 'zod'
import { MSG } from '@profiloz/shared'

export const frenchErrorMap: z.ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.too_small:
      if (issue.type === 'string' && issue.minimum === 1) {
        return { message: MSG.validation.required }
      }
      if (issue.type === 'string' && issue.minimum === 8) {
        return { message: MSG.validation.passwordMin }
      }
      if (issue.type === 'string') {
        return { message: MSG.validation.requiredAlt }
      }
      break
    case z.ZodIssueCode.too_big:
      if (issue.type === 'string') {
        return { message: MSG.validation.maxChars(Number(issue.maximum)) }
      }
      break
    case z.ZodIssueCode.invalid_string:
      if (issue.validation === 'email') {
        return { message: MSG.validation.email }
      }
      if (issue.validation === 'url') {
        return { message: MSG.validation.url }
      }
      if (issue.validation === 'uuid') {
        return { message: MSG.validation.invalidData }
      }
      break
    case z.ZodIssueCode.invalid_date:
      return { message: MSG.validation.date }
    default:
      break
  }

  return { message: MSG.validation.invalidData }
}

z.setErrorMap(frenchErrorMap)
