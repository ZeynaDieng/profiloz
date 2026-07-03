import type { TemplateSlug } from '@profiloz/shared'
import type { CoverLetterTemplateSlug } from '~/types/cover-letter'

export type { TemplateAccentColors as LandingPreviewColors } from './template-accent-colors'
export {
  cvLandingPreviewColors,
  cvTemplateAccentColors,
  getCvAccentPalette,
  getLetterAccentPalette,
  landingPreviewStyle,
  letterLandingPreviewColors,
  letterTemplateAccentColors,
  resolveCvAccentColor,
  resolveLetterAccentColor,
} from './template-accent-colors'

export type LandingAccent = 'blue' | 'green' | 'purple' | 'orange' | 'teal'

export const LANDING_ACCENT_CLASSES: Record<
  LandingAccent,
  {
    icon: string
    iconBg: string
    number: string
    border: string
    ring: string
    badge: string
    badgeText: string
  }
> = {
  blue: {
    icon: 'text-secondary',
    iconBg: 'bg-secondary/10',
    number: 'bg-secondary text-on-secondary',
    border: 'border-secondary/25',
    ring: 'ring-secondary/20',
    badge: 'bg-secondary',
    badgeText: 'text-on-secondary',
  },
  green: {
    icon: 'text-accent-green',
    iconBg: 'bg-accent-green/10',
    number: 'bg-accent-green text-white',
    border: 'border-accent-green/25',
    ring: 'ring-accent-green/20',
    badge: 'bg-accent-green',
    badgeText: 'text-white',
  },
  purple: {
    icon: 'text-accent-purple',
    iconBg: 'bg-accent-purple/10',
    number: 'bg-accent-purple text-white',
    border: 'border-accent-purple/25',
    ring: 'ring-accent-purple/20',
    badge: 'bg-accent-purple',
    badgeText: 'text-white',
  },
  orange: {
    icon: 'text-accent-orange',
    iconBg: 'bg-accent-orange/10',
    number: 'bg-accent-orange text-white',
    border: 'border-accent-orange/25',
    ring: 'ring-accent-orange/20',
    badge: 'bg-accent-orange',
    badgeText: 'text-white',
  },
  teal: {
    icon: 'text-accent-teal',
    iconBg: 'bg-accent-teal/10',
    number: 'bg-accent-teal text-white',
    border: 'border-accent-teal/25',
    ring: 'ring-accent-teal/20',
    badge: 'bg-accent-teal',
    badgeText: 'text-white',
  },
}

/** Couleur d'accent landing par modèle CV (rythme visuel, pas identité globale). */
export const TEMPLATE_LANDING_ACCENTS: Partial<Record<TemplateSlug, LandingAccent>> = {
  ETUDIANT: 'blue',
  PROFESSIONNEL: 'blue',
  MODERNE: 'green',
  DEVELOPPEUR: 'orange',
  CREATIF: 'purple',
  COMMERCIAL: 'blue',
  MANAGER: 'blue',
  INTERNATIONAL: 'teal',
  MINIMALISTE: 'teal',
  PREMIUM: 'purple',
  CADRE: 'blue',
  EXECUTIF: 'blue',
  EPURE: 'teal',
}

export function templateLandingAccent(slug: TemplateSlug): LandingAccent {
  return TEMPLATE_LANDING_ACCENTS[slug] ?? 'blue'
}

export function accentClasses(accent: LandingAccent) {
  return LANDING_ACCENT_CLASSES[accent]
}
