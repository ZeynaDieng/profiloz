import { z } from 'zod'

export const frenchErrorMap: z.ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.too_small:
      if (issue.type === 'string' && issue.minimum === 1) {
        return { message: 'Ce champ est requis' }
      }
      if (issue.type === 'string') {
        return { message: `Minimum ${issue.minimum} caractères` }
      }
      break
    case z.ZodIssueCode.too_big:
      if (issue.type === 'string') {
        return { message: `Maximum ${issue.maximum} caractères` }
      }
      break
    case z.ZodIssueCode.invalid_string:
      if (issue.validation === 'email') {
        return { message: 'Format e-mail invalide' }
      }
      if (issue.validation === 'url') {
        return { message: 'URL invalide' }
      }
      if (issue.validation === 'uuid') {
        return { message: 'Identifiant invalide' }
      }
      break
    default:
      break
  }

  return { message: ctx.defaultError }
}

z.setErrorMap(frenchErrorMap)
