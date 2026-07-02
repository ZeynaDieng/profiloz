export const APP_NAME = "Profilo'Z"

export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
] as const

export const GUEST_SESSION_TTL_DAYS = 7
export const PDF_TTL_HOURS = 24
export const DEFAULT_LOCALE = 'fr-FR'

export const WIZARD_STEPS = [
  'informations',
  'formation',
  'experience',
  'competences',
  'certifications',
  'interets',
] as const

export const TEMPLATE_SLUGS = [
  'ETUDIANT',
  'PROFESSIONNEL',
  'MODERNE',
  'DEVELOPPEUR',
  'COMMERCIAL',
  'MANAGER',
  'INTERNATIONAL',
  'MINIMALISTE',
  'CREATIF',
  'PREMIUM',
  'CADRE',
  'EXECUTIF',
  'EPURE',
] as const
