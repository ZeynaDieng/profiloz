import type { CoverLetterSnapshot, CoverLetterTemplateSlug } from '~/types/cover-letter'
import { createAminataDemoLetter } from '~/features/demo/aminata-persona'
import { letterTemplateAccentColors } from '~/utils/template-accent-colors'
import { DEFAULT_LETTER_CONTENT } from '~/features/cover-letter-templates/registry'

function pickText(user?: string | null, fallback?: string) {
  const value = user?.trim()
  return value ? user! : (fallback ?? '')
}

/**
 * Aperçu lettre = saisie utilisateur + repli démo Aminata sur les champs vides.
 */
export function buildCoverLetterPreviewSnapshot(
  slug: CoverLetterTemplateSlug,
  user?: Partial<CoverLetterSnapshot> | null,
  accentColor?: string,
): CoverLetterSnapshot {
  const base = createAminataDemoLetter(slug)
  const accent = accentColor ?? letterTemplateAccentColors(slug).accent

  if (!user) {
    return { ...base, accentColor: accent }
  }

  const userContent = user.content?.trim()
  const isGenericDefault = userContent === DEFAULT_LETTER_CONTENT.trim()

  return {
    ...base,
    ...user,
    templateSlug: slug,
    accentColor: accent,
    senderName: pickText(user.senderName, base.senderName),
    senderEmail: pickText(user.senderEmail, base.senderEmail),
    senderPhone: pickText(user.senderPhone, base.senderPhone),
    senderLocation: pickText(user.senderLocation, base.senderLocation),
    companyName: pickText(user.companyName, base.companyName),
    companyAddress: pickText(user.companyAddress, base.companyAddress),
    position: pickText(user.position, base.position),
    recruiterName: pickText(user.recruiterName, base.recruiterName),
    content: !userContent || isGenericDefault ? (base.content ?? '') : user.content!,
    closingText: pickText(user.closingText, base.closingText),
  }
}

export function buildCoverLetterDemoSnapshot(slug: CoverLetterTemplateSlug) {
  return buildCoverLetterPreviewSnapshot(slug)
}
