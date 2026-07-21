import type { TemplateSlug } from '@profiloz/shared'
import type { CoverLetterTemplateSlug } from '~/types/cover-letter'

export type TemplateAccentColors = {
  accent: string
  canvas: string
}

/** Palette élargie pour personnalisation dans l’éditeur */
export const EXTENDED_ACCENT_PALETTE = [
  '#0051d5',
  '#1d4ed8',
  '#1a3050',
  '#2c3e50',
  '#0F172A',
  '#059669',
  '#0d9488',
  '#009485',
  '#0891b2',
  '#7c3aed',
  '#4f46e5',
  '#6366f1',
  '#ea580c',
  '#c2410c',
  '#F43F5E',
  '#64748b',
] as const

export const CV_TEMPLATE_ACCENT_COLORS: Record<TemplateSlug, TemplateAccentColors> = {
  ETUDIANT: { accent: '#059669', canvas: '#ecfdf5' },
  PROFESSIONNEL: { accent: '#0051d5', canvas: '#eff4ff' },
  MODERNE: { accent: '#009485', canvas: '#f0fdfa' },
  DEVELOPPEUR: { accent: '#ea580c', canvas: '#fff7ed' },
  COMMERCIAL: { accent: '#1b2a47', canvas: '#f0f4f8' },
  MANAGER: { accent: '#1e293b', canvas: '#f8fafc' },
  INTERNATIONAL: { accent: '#0891b2', canvas: '#ecfeff' },
  MINIMALISTE: { accent: '#64748b', canvas: '#f1f5f9' },
  CREATIF: { accent: '#7c3aed', canvas: '#f5f3ff' },
  PREMIUM: { accent: '#4f46e5', canvas: '#eef2ff' },
  CADRE: { accent: '#1a3050', canvas: '#e8eef5' },
  EXECUTIF: { accent: '#2c3e50', canvas: '#eef1f4' },
  EPURE: { accent: '#0d9488', canvas: '#f0fdfa' },
}

export const LETTER_TEMPLATE_ACCENT_COLORS: Record<CoverLetterTemplateSlug, TemplateAccentColors> = {
  CLASSIQUE: { accent: '#0051d5', canvas: '#eff4ff' },
  MODERNE: { accent: '#009485', canvas: '#f0fdfa' },
  ACCENT: { accent: '#7c3aed', canvas: '#f5f3ff' },
  PROFESSIONNEL: { accent: '#1d4ed8', canvas: '#dbeafe' },
  CREATIF: { accent: '#ea580c', canvas: '#fff7ed' },
}

const CV_FALLBACK: TemplateAccentColors = { accent: '#0051d5', canvas: '#eff4ff' }
const LETTER_FALLBACK: TemplateAccentColors = { accent: '#0051d5', canvas: '#eff4ff' }

export function cvTemplateAccentColors(slug: TemplateSlug): TemplateAccentColors {
  return CV_TEMPLATE_ACCENT_COLORS[slug] ?? CV_FALLBACK
}

export function letterTemplateAccentColors(slug: CoverLetterTemplateSlug): TemplateAccentColors {
  return LETTER_TEMPLATE_ACCENT_COLORS[slug] ?? LETTER_FALLBACK
}

/** Alias landing (même source de vérité) */
export const cvLandingPreviewColors = cvTemplateAccentColors
export const letterLandingPreviewColors = letterTemplateAccentColors

export function resolveCvAccentColor(slug: TemplateSlug, configured?: string | null): string {
  return configured?.trim() || cvTemplateAccentColors(slug).accent
}

export function resolveLetterAccentColor(slug: CoverLetterTemplateSlug, configured?: string | null): string {
  return configured?.trim() || letterTemplateAccentColors(slug).accent
}

export function getCvAccentPalette(slug: TemplateSlug): string[] {
  const primary = cvTemplateAccentColors(slug).accent
  const rest = EXTENDED_ACCENT_PALETTE.filter((c) => c.toLowerCase() !== primary.toLowerCase())
  return [primary, ...rest]
}

export function getLetterAccentPalette(slug: CoverLetterTemplateSlug): string[] {
  const primary = letterTemplateAccentColors(slug).accent
  const rest = EXTENDED_ACCENT_PALETTE.filter((c) => c.toLowerCase() !== primary.toLowerCase())
  return [primary, ...rest]
}

export function landingPreviewStyle(
  slug: TemplateSlug | CoverLetterTemplateSlug,
  kind: 'cv' | 'letter',
): Record<string, string> {
  const colors =
    kind === 'cv'
      ? cvTemplateAccentColors(slug as TemplateSlug)
      : letterTemplateAccentColors(slug as CoverLetterTemplateSlug)

  return {
    '--preview-canvas': colors.canvas,
    '--preview-accent': colors.accent,
    '--color-secondary': colors.accent,
  }
}

export function letterPreviewWrapperStyle(
  slug: CoverLetterTemplateSlug,
  configured?: string | null,
): Record<string, string> {
  const colors = letterTemplateAccentColors(slug)
  const accent = resolveLetterAccentColor(slug, configured)
  return {
    '--preview-canvas': colors.canvas,
    '--color-secondary': accent,
  }
}

export function defaultCvTemplateConfig(slug: TemplateSlug) {
  const { accent } = cvTemplateAccentColors(slug)
  return { accentColor: accent }
}

export function defaultLetterAccentColor(slug: CoverLetterTemplateSlug): string {
  return letterTemplateAccentColors(slug).accent
}
