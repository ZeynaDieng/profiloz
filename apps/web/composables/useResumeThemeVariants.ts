import type { ColorTheme } from './useResumeCustomization'

export interface ThemeVariant {
  id: string
  name: string
  description: string
  theme: ColorTheme
  isDark: boolean
}

export interface TemplateVariants {
  templateId: string
  templateName: string
  variants: ThemeVariant[]
}

export function useResumeThemeVariants() {
  /**
   * Variantes de thème pour un template
   */
  const THEME_VARIANTS: Record<string, ThemeVariant[]> = {
    executif: [
      {
        id: 'executif-light',
        name: 'Claire',
        description: 'Version claire et lumineuse',
        theme: {
          name: 'Exécutif Claire',
          primary: '#1e3a5f',
          secondary: '#2c5282',
          accent: '#3182ce',
          background: '#ffffff',
          text: '#1e293b',
          muted: '#64748b',
        },
        isDark: false,
      },
      {
        id: 'executif-dark',
        name: 'Marine',
        description: 'Version marine professionnelle',
        theme: {
          name: 'Exécutif Marine',
          primary: '#1a2332',
          secondary: '#2d3748',
          accent: '#6366f1',
          background: '#0f172a',
          text: '#f1f5f9',
          muted: '#94a3b8',
        },
        isDark: true,
      },
      {
        id: 'executif-charcoal',
        name: 'Anthracite',
        description: 'Version anthracite élégante',
        theme: {
          name: 'Exécutif Anthracite',
          primary: '#1a202c',
          secondary: '#2d3748',
          accent: '#4a5568',
          background: '#1a202c',
          text: '#f7fafc',
          muted: '#a0aec0',
        },
        isDark: true,
      },
    ],
    cadre: [
      {
        id: 'cadre-light',
        name: 'Claire',
        description: 'Version claire et professionnelle',
        theme: {
          name: 'Cadre Claire',
          primary: '#1e3a5f',
          secondary: '#2c5282',
          accent: '#3182ce',
          background: '#f8fafc',
          text: '#1e293b',
          muted: '#64748b',
        },
        isDark: false,
      },
      {
        id: 'cadre-dark',
        name: 'Marine',
        description: 'Version marine sophistiquée',
        theme: {
          name: 'Cadre Marine',
          primary: '#1e3a5f',
          secondary: '#2c5282',
          accent: '#3182ce',
          background: '#0f172a',
          text: '#f1f5f9',
          muted: '#94a3b8',
        },
        isDark: true,
      },
      {
        id: 'cadre-charcoal',
        name: 'Anthracite',
        description: 'Version anthracite moderne',
        theme: {
          name: 'Cadre Anthracite',
          primary: '#1a202c',
          secondary: '#2d3748',
          accent: '#4a5568',
          background: '#1a202c',
          text: '#f7fafc',
          muted: '#a0aec0',
        },
        isDark: true,
      },
    ],
  }

  /**
   * Récupère les variantes pour un template
   */
  function getTemplateVariants(templateId: string): ThemeVariant[] {
    return THEME_VARIANTS[templateId] || []
  }

  /**
   * Récupère une variante spécifique
   */
  function getVariant(templateId: string, variantId: string): ThemeVariant | null {
    const variants = getTemplateVariants(templateId)
    return variants.find((v) => v.id === variantId) || null
  }

  /**
   * Récupère la variante par défaut pour un template
   */
  function getDefaultVariant(templateId: string): ThemeVariant | null {
    const variants = getTemplateVariants(templateId)
    return variants[0] || null
  }

  /**
   * Génère les classes CSS pour une variante
   */
  function generateVariantClasses(variant: ThemeVariant): string {
    const classes = ['resume-theme', `resume-theme-${variant.id}`]
    
    if (variant.isDark) {
      classes.push('resume-theme-dark')
    } else {
      classes.push('resume-theme-light')
    }

    return classes.join(' ')
  }

  /**
   * Génère les variables CSS pour une variante
   */
  function generateVariantCSSVariables(variant: ThemeVariant): Record<string, string> {
    return {
      '--color-primary': variant.theme.primary,
      '--color-secondary': variant.theme.secondary,
      '--color-accent': variant.theme.accent,
      '--color-background': variant.theme.background,
      '--color-text': variant.theme.text,
      '--color-muted': variant.theme.muted,
    }
  }

  /**
   * Applique une variante à un template
   */
  function applyVariant(
    templateId: string,
    variantId: string
  ): { variant: ThemeVariant; cssVariables: Record<string, string>; classes: string } | null {
    const variant = getVariant(templateId, variantId)
    
    if (!variant) return null

    return {
      variant,
      cssVariables: generateVariantCSSVariables(variant),
      classes: generateVariantClasses(variant),
    }
  }

  /**
   * Liste tous les templates avec leurs variantes
   */
  function listAllTemplateVariants(): TemplateVariants[] {
    return Object.entries(THEME_VARIANTS).map(([templateId, variants]) => ({
      templateId,
      templateName: templateId.charAt(0).toUpperCase() + templateId.slice(1),
      variants,
    }))
  }

  /**
   * Recommande une variante basée sur les préférences
   */
  function recommendVariant(
    templateId: string,
    prefersDark: boolean = false
  ): ThemeVariant | null {
    const variants = getTemplateVariants(templateId)
    
    if (variants.length === 0) return null

    // Si l'utilisateur préfère le sombre, retourner une variante sombre
    if (prefersDark) {
      const darkVariant = variants.find((v) => v.isDark)
      if (darkVariant) return darkVariant
    }

    // Sinon, retourner la variante par défaut
    return variants[0]
  }

  /**
   * Crée une nouvelle variante personnalisée
   */
  function createCustomVariant(
    templateId: string,
    name: string,
    theme: ColorTheme,
    isDark: boolean = false
  ): ThemeVariant {
    return {
      id: `${templateId}-custom-${Date.now()}`,
      name,
      description: 'Variante personnalisée',
      theme,
      isDark,
    }
  }

  /**
   * Compare deux variantes
   */
  function compareVariants(variant1: ThemeVariant, variant2: ThemeVariant): boolean {
    return (
      variant1.theme.primary === variant2.theme.primary &&
      variant1.theme.secondary === variant2.theme.secondary &&
      variant1.theme.accent === variant2.theme.accent &&
      variant1.theme.background === variant2.theme.background &&
      variant1.theme.text === variant2.theme.text &&
      variant1.theme.muted === variant2.theme.muted
    )
  }

  return {
    THEME_VARIANTS,
    getTemplateVariants,
    getVariant,
    getDefaultVariant,
    generateVariantClasses,
    generateVariantCSSVariables,
    applyVariant,
    listAllTemplateVariants,
    recommendVariant,
    createCustomVariant,
    compareVariants,
  }
}
