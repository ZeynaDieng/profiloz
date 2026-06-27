import type { ResumeSnapshot } from '@profiloz/shared'

export interface BalanceMetrics {
  sidebarContent: number
  mainContent: number
  ratio: number
  isBalanced: boolean
  recommendations: string[]
}

export interface SectionBalance {
  section: string
  contentWeight: number
  visualWeight: number
  isOverloaded: boolean
}

export function useResumeVisualBalance() {
  /**
   * Calcule le poids visuel d'une section
   */
  function calculateSectionWeight(section: string, resume: ResumeSnapshot): number {
    let weight = 0

    switch (section) {
      case 'experiences':
        weight = (resume.experiences?.length || 0) * 10
        resume.experiences?.forEach((exp) => {
          weight += (exp.description?.length || 0) / 50
        })
        break
      case 'educations':
        weight = (resume.educations?.length || 0) * 8
        break
      case 'skills':
        weight = (resume.skills?.length || 0) * 3
        break
      case 'languages':
        weight = (resume.languages?.length || 0) * 4
        break
      case 'interests':
        weight = (resume.interests?.length || 0) * 2
        break
      case 'summary':
        weight = resume.summary ? resume.summary.length / 30 : 0
        break
      case 'contact':
        weight = 5 // Base pour les coordonnées
        if (resume.personalInfo?.phone) weight += 2
        if (resume.personalInfo?.email) weight += 2
        if (resume.personalInfo?.location) weight += 2
        if (resume.personalInfo?.linkedinUrl) weight += 2
        break
    }

    return weight
  }

  /**
   * Analyse l'équilibre entre sidebar et contenu principal
   */
  function analyzeSidebarBalance(resume: ResumeSnapshot): BalanceMetrics {
    const sidebarSections = ['contact', 'skills', 'languages', 'interests']
    const mainSections = ['experiences', 'educations', 'summary']

    let sidebarWeight = 0
    sidebarSections.forEach((section) => {
      sidebarWeight += calculateSectionWeight(section, resume)
    })

    let mainWeight = 0
    mainSections.forEach((section) => {
      mainWeight += calculateSectionWeight(section, resume)
    })

    // Ajouter le poids de la photo
    if (resume.personalInfo?.photoUrl) {
      sidebarWeight += 15
    }

    const ratio = mainWeight / (sidebarWeight || 1)
    const isBalanced = ratio >= 2 && ratio <= 4

    const recommendations: string[] = []

    if (ratio < 2) {
      recommendations.push('Sidebar trop chargée par rapport au contenu principal')
      recommendations.push('Considérer de déplacer certaines compétences vers le contenu principal')
    } else if (ratio > 4) {
      recommendations.push('Contenu principal trop dense par rapport à la sidebar')
      recommendations.push('Considérer d\'ajouter plus d\'informations dans la sidebar')
    }

    return {
      sidebarContent: sidebarWeight,
      mainContent: mainWeight,
      ratio,
      isBalanced,
      recommendations,
    }
  }

  /**
   * Analyse l'équilibre de chaque section
   */
  function analyzeSectionBalance(resume: ResumeSnapshot): SectionBalance[] {
    const sections: SectionBalance[] = []
    const allSections = ['experiences', 'educations', 'skills', 'languages', 'interests', 'summary']

    allSections.forEach((section) => {
      const contentWeight = calculateSectionWeight(section, resume)
      const visualWeight = contentWeight * 1.2 // Poids visuel légèrement plus élevé
      const isOverloaded = contentWeight > 50

      sections.push({
        section,
        contentWeight,
        visualWeight,
        isOverloaded,
      })
    })

    return sections
  }

  /**
   * Recommande des ajustements pour améliorer l'équilibre
   */
  function getBalanceRecommendations(resume: ResumeSnapshot): string[] {
    const recommendations: string[] = []
    const balance = analyzeSidebarBalance(resume)
    const sectionBalances = analyzeSectionBalance(resume)

    // Vérifier les sections surchargées
    sectionBalances.forEach((sb) => {
      if (sb.isOverloaded) {
        recommendations.push(`Section "${sb.section}" surchargée - considérer de réduire ou diviser`)
      }
    })

    // Vérifier les sections vides
    sectionBalances.forEach((sb) => {
      if (sb.contentWeight === 0) {
        recommendations.push(`Section "${sb.section}" vide - peut être supprimée ou remplie`)
      }
    })

    // Ajouter les recommandations de balance sidebar/main
    recommendations.push(...balance.recommendations)

    // Vérifier si trop peu de contenu
    const totalWeight = sectionBalances.reduce((sum, sb) => sum + sb.contentWeight, 0)
    if (totalWeight < 30) {
      recommendations.push('Contenu global très léger - considérer d\'ajouter plus de détails')
    }

    return recommendations
  }

  /**
   * Calcule l'espace vertical optimal pour chaque section
   */
  function calculateOptimalSpacing(resume: ResumeSnapshot): Record<string, number> {
    const spacing: Record<string, number> = {}
    const balance = analyzeSidebarBalance(resume)

    // Espacement de base
    const baseSpacing = balance.isBalanced ? 8 : balance.ratio < 2 ? 6 : 10

    spacing.section = baseSpacing
    spacing.item = baseSpacing / 2
    spacing.line = baseSpacing / 4

    return spacing
  }

  /**
   * Détecte les espaces blancs excessifs
   */
  function detectExcessiveWhitespace(resume: ResumeSnapshot): string[] {
    const warnings: string[] = []
    const sectionBalances = analyzeSectionBalance(resume)

    // Si une section est vide mais d'autres sont pleines
    const emptySections = sectionBalances.filter((sb) => sb.contentWeight === 0)
    const filledSections = sectionBalances.filter((sb) => sb.contentWeight > 0)

    if (emptySections.length > 0 && filledSections.length > 0) {
      warnings.push(`Sections vides détectées: ${emptySections.map((s) => s.section).join(', ')}`)
    }

    // Si sidebar très vide
    const sidebarBalance = analyzeSidebarBalance(resume)
    if (sidebarBalance.sidebarContent < 10 && sidebarBalance.mainContent > 50) {
      warnings.push('Sidebar très vide par rapport au contenu principal')
    }

    return warnings
  }

  /**
   * Génère des classes CSS dynamiques basées sur l'équilibre
   */
  function generateBalanceClasses(resume: ResumeSnapshot): Record<string, string> {
    const balance = analyzeSidebarBalance(resume)
    const classes: Record<string, string> = {}

    if (balance.ratio < 2) {
      classes.sidebar = 'sidebar-compact'
      classes.main = 'main-expanded'
    } else if (balance.ratio > 4) {
      classes.sidebar = 'sidebar-expanded'
      classes.main = 'main-compact'
    } else {
      classes.sidebar = 'sidebar-balanced'
      classes.main = 'main-balanced'
    }

    return classes
  }

  return {
    calculateSectionWeight,
    analyzeSidebarBalance,
    analyzeSectionBalance,
    getBalanceRecommendations,
    calculateOptimalSpacing,
    detectExcessiveWhitespace,
    generateBalanceClasses,
  }
}
