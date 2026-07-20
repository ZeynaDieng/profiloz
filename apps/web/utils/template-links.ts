import type { TemplateSlug } from '@profiloz/shared'
import type { CoverLetterTemplateSlug } from '~/types/cover-letter'

/** Point d'entrée invité : choisir création manuelle ou import, sans données fictives. */
export function cvTemplateStartLink(slug: TemplateSlug | string) {
  return `/creer?template=${slug}`
}

/** Création manuelle avec modèle présélectionné (brouillon vide dans l'éditeur). */
export function cvCreateLink(slug: TemplateSlug | string) {
  return `/creer/editeur?template=${slug}`
}

/** Import OCR puis édition avec le modèle choisi. */
export function cvImportLink(slug: TemplateSlug | string) {
  return `/creer/importer/cv?template=${slug}`
}

/** Galerie de modèles (aperçu uniquement). */
export function cvTemplateGalleryLink(slug?: TemplateSlug | string) {
  return slug ? `/creer/modele?select=${slug}` : '/creer/modele'
}

export function letterTemplateStartLink(slug: CoverLetterTemplateSlug | string) {
  return `/creer/lettre?template=${slug}`
}

export function letterCreateLink(slug: CoverLetterTemplateSlug | string) {
  return `/creer/lettre/modele?select=${slug}&fresh=1`
}

export function letterImportLink(slug: CoverLetterTemplateSlug | string) {
  return `/creer/importer/lettre?template=${slug}`
}
