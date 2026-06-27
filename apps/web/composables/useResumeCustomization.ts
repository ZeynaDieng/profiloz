import type { ResumeSnapshot } from '@profiloz/shared'

export interface CustomizationOptions {
  showPhoto: boolean
  showSummary: boolean
  showContact: boolean
  showSkills: boolean
  showLanguages: boolean
  showInterests: boolean
  accentColor: string
  fontFamily: string
  layoutVariant: 'default' | 'compact' | 'expanded'
}

export interface SectionVisibility {
  experiences: boolean
  educations: boolean
  skills: boolean
  languages: boolean
  interests: boolean
  summary: boolean
  contact: boolean
}

export interface ColorTheme {
  name: string
  primary: string
  secondary: string
  accent: string
  background: string
  text: string
  muted: string
}

export const PREDEFINED_THEMES: Record<string, ColorTheme> = {
  navy: {
    name: 'Marine',
    primary: '#1e3a5f',
    secondary: '#2c5282',
    accent: '#3182ce',
    background: '#f8fafc',
    text: '#1e293b',
    muted: '#64748b',
  },
  charcoal: {
    name: 'Anthracite',
    primary: '#1a202c',
    secondary: '#2d3748',
    accent: '#4a5568',
    background: '#f7fafc',
    text: '#1a202c',
    muted: '#718096',
  },
  forest: {
    name: 'Forêt',
    primary: '#276749',
    secondary: '#2f855a',
    accent: '#38a169',
    background: '#f0fff4',
    text: '#1a202c',
    muted: '#4a5568',
  },
  burgundy: {
    name: 'Bordeaux',
    primary: '#742a2a',
    secondary: '#9b2c2c',
    accent: '#c53030',
    background: '#fff5f5',
    text: '#1a202c',
    muted: '#4a5568',
  },
  slate: {
    name: 'Ardoise',
    primary: '#475569',
    secondary: '#64748b',
    accent: '#6366f1',
    background: '#f8fafc',
    text: '#1e293b',
    muted: '#64748b',
  },
}

export const FONT_FAMILIES = {
  playfair: {
    name: 'Playfair Display',
    heading: 'Playfair Display, Georgia, serif',
    body: 'Inter, Helvetica, Arial, sans-serif',
  },
  lora: {
    name: 'Lora',
    heading: 'Lora, Georgia, serif',
    body: 'Inter, Helvetica, Arial, sans-serif',
  },
  montserrat: {
    name: 'Montserrat',
    heading: 'Montserrat, Helvetica, Arial, sans-serif',
    body: 'Open Sans, Helvetica, Arial, sans-serif',
  },
  roboto: {
    name: 'Roboto',
    heading: 'Roboto, Helvetica, Arial, sans-serif',
    body: 'Roboto, Helvetica, Arial, sans-serif',
  },
}

export function useResumeCustomization() {
  /**
   * Options de personnalisation par défaut
   */
  const defaultOptions: CustomizationOptions = {
    showPhoto: true,
    showSummary: true,
    showContact: true,
    showSkills: true,
    showLanguages: true,
    showInterests: true,
    accentColor: '#1e3a5f',
    fontFamily: 'playfair',
    layoutVariant: 'default',
  }

  /**
   * Détermine la visibilité des sections basée sur le contenu
   */
  function getSectionVisibility(resume: ResumeSnapshot): SectionVisibility {
    return {
      experiences: (resume.experiences?.length || 0) > 0,
      educations: (resume.educations?.length || 0) > 0,
      skills: (resume.skills?.length || 0) > 0,
      languages: (resume.languages?.length || 0) > 0,
      interests: (resume.interests?.length || 0) > 0,
      summary: !!resume.summary,
      contact: !!(
        resume.personalInfo?.phone ||
        resume.personalInfo?.email ||
        resume.personalInfo?.location ||
        resume.personalInfo?.linkedinUrl
      ),
    }
  }

  /**
   * Applique les options de personnalisation au template
   */
  function applyCustomization(
    resume: ResumeSnapshot,
    options: Partial<CustomizationOptions>
  ): CustomizationOptions {
    const visibility = getSectionVisibility(resume)
    
    return {
      ...defaultOptions,
      ...options,
      // Override visibility based on content
      showPhoto: options.showPhoto !== undefined ? options.showPhoto : !!resume.personalInfo?.photoUrl,
      showSummary: options.showSummary !== undefined ? options.showSummary : visibility.summary,
      showContact: options.showContact !== undefined ? options.showContact : visibility.contact,
      showSkills: options.showSkills !== undefined ? options.showSkills : visibility.skills,
      showLanguages: options.showLanguages !== undefined ? options.showLanguages : visibility.languages,
      showInterests: options.showInterests !== undefined ? options.showInterests : visibility.interests,
    }
  }

  /**
   * Génère les variables CSS pour un thème
   */
  function generateThemeVariables(theme: ColorTheme): Record<string, string> {
    return {
      '--color-primary': theme.primary,
      '--color-secondary': theme.secondary,
      '--color-accent': theme.accent,
      '--color-background': theme.background,
      '--color-text': theme.text,
      '--color-muted': theme.muted,
    }
  }

  /**
   * Génère les variables CSS pour une famille de polices
   */
  function generateFontVariables(fontFamily: keyof typeof FONT_FAMILIES): Record<string, string> {
    const font = FONT_FAMILIES[fontFamily]
    return {
      '--font-heading': font.heading,
      '--font-body': font.body,
    }
  }

  /**
   * Combine les variables CSS
   */
  function generateCSSVariables(
    theme: ColorTheme,
    fontFamily: keyof typeof FONT_FAMILIES
  ): Record<string, string> {
    return {
      ...generateThemeVariables(theme),
      ...generateFontVariables(fontFamily),
    }
  }

  /**
   * Recommande un thème basé sur le secteur d'activité
   */
  function recommendThemeByIndustry(industry?: string): string {
    if (!industry) return 'navy'

    const industryLower = industry.toLowerCase()

    if (/finance|banque|assurance|consulting/i.test(industryLower)) {
      return 'navy'
    }
    if (/tech|informatique|software|startup/i.test(industryLower)) {
      return 'slate'
    }
    if (/environnement|nature|agriculture/i.test(industryLower)) {
      return 'forest'
    }
    if (/créatif|design|art|mode/i.test(industryLower)) {
      return 'burgundy'
    }

    return 'navy'
  }

  /**
   * Recommande une police basée sur le style
   */
  function recommendFontByStyle(style: 'classic' | 'modern' | 'minimal'): string {
    switch (style) {
      case 'classic':
        return 'playfair'
      case 'modern':
        return 'montserrat'
      case 'minimal':
        return 'roboto'
      default:
        return 'playfair'
    }
  }

  /**
   * Valide les options de personnalisation
   */
  function validateCustomization(options: Partial<CustomizationOptions>): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (options.accentColor && !/^#[0-9A-Fa-f]{6}$/.test(options.accentColor)) {
      errors.push('La couleur accent doit être au format hexadécimal (#RRGGBB)')
    }

    if (options.fontFamily && !FONT_FAMILIES[options.fontFamily as keyof typeof FONT_FAMILIES]) {
      errors.push('La famille de police n\'est pas reconnue')
    }

    if (options.layoutVariant && !['default', 'compact', 'expanded'].includes(options.layoutVariant)) {
      errors.push('La variante de layout doit être default, compact ou expanded')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Exporte les options de personnalisation
   */
  function exportCustomization(options: CustomizationOptions): string {
    return JSON.stringify(options, null, 2)
  }

  /**
   * Importe les options de personnalisation
   */
  function importCustomization(json: string): CustomizationOptions | null {
    try {
      const parsed = JSON.parse(json)
      const validation = validateCustomization(parsed)
      
      if (!validation.valid) {
        console.error('Invalid customization options:', validation.errors)
        return null
      }

      return { ...defaultOptions, ...parsed }
    } catch (error) {
      console.error('Failed to parse customization options:', error)
      return null
    }
  }

  /**
   * Réinitialise aux options par défaut
   */
  function resetCustomization(): CustomizationOptions {
    return { ...defaultOptions }
  }

  return {
    defaultOptions,
    PREDEFINED_THEMES,
    FONT_FAMILIES,
    getSectionVisibility,
    applyCustomization,
    generateThemeVariables,
    generateFontVariables,
    generateCSSVariables,
    recommendThemeByIndustry,
    recommendFontByStyle,
    validateCustomization,
    exportCustomization,
    importCustomization,
    resetCustomization,
  }
}
