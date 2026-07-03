import type { CoverLetterTemplateSlug } from '~/types/cover-letter'
import { createAminataDemoLetter } from '~/features/demo/aminata-persona'
import { letterTemplateAccentColors } from '~/utils/template-accent-colors'

export function buildCoverLetterDemoSnapshot(slug: CoverLetterTemplateSlug) {
  return {
    ...createAminataDemoLetter(slug),
    accentColor: letterTemplateAccentColors(slug).accent,
  }
}
