export const COVER_LETTER_TEMPLATE_SLUGS = [
  'CLASSIQUE',
  'MODERNE',
  'ACCENT',
  'PROFESSIONNEL',
  'CREATIF',
] as const

export type CoverLetterTemplateSlug = (typeof COVER_LETTER_TEMPLATE_SLUGS)[number]

export interface CoverLetterTemplateDefinition {
  slug: CoverLetterTemplateSlug
  name: string
  category: string
  description: string
}

export interface CoverLetterSnapshot {
  templateSlug: CoverLetterTemplateSlug
  title?: string
  senderName?: string
  senderEmail?: string
  senderPhone?: string
  senderLocation?: string
  companyName?: string
  companyAddress?: string
  position?: string
  recruiterName?: string
  content: string
  closingText?: string
  accentColor?: string
}

export const DEFAULT_CLOSING_TEXT =
  "Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées."

const LEGACY_TEMPLATE_MAP: Record<string, CoverLetterTemplateSlug> = {
  classic: 'CLASSIQUE',
  classique: 'CLASSIQUE',
  moderne: 'MODERNE',
  modern: 'MODERNE',
  personnalise: 'ACCENT',
  personalized: 'ACCENT',
  accent: 'ACCENT',
  professionnel: 'PROFESSIONNEL',
  professional: 'PROFESSIONNEL',
  creatif: 'CREATIF',
  creative: 'CREATIF',
}

export function normalizeCoverLetterTemplateSlug(value?: string | null): CoverLetterTemplateSlug {
  if (!value) return 'CLASSIQUE'
  const upper = value.toUpperCase()
  if ((COVER_LETTER_TEMPLATE_SLUGS as readonly string[]).includes(upper)) {
    return upper as CoverLetterTemplateSlug
  }
  return LEGACY_TEMPLATE_MAP[value.toLowerCase()] ?? 'CLASSIQUE'
}

export function toCoverLetterSnapshot(data: {
  templateId?: string | null
  title?: string | null
  senderName?: string | null
  senderEmail?: string | null
  senderPhone?: string | null
  senderLocation?: string | null
  companyName?: string | null
  companyAddress?: string | null
  position?: string | null
  recruiterName?: string | null
  content: string
  closingText?: string | null
  accentColor?: string | null
}): CoverLetterSnapshot {
  return {
    templateSlug: normalizeCoverLetterTemplateSlug(data.templateId),
    title: data.title ?? undefined,
    senderName: data.senderName ?? undefined,
    senderEmail: data.senderEmail ?? undefined,
    senderPhone: data.senderPhone ?? undefined,
    senderLocation: data.senderLocation ?? undefined,
    companyName: data.companyName ?? undefined,
    companyAddress: data.companyAddress ?? undefined,
    position: data.position ?? undefined,
    recruiterName: data.recruiterName ?? undefined,
    content: data.content,
    closingText: data.closingText ?? undefined,
    accentColor: data.accentColor ?? undefined,
  }
}
