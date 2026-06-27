import type { ResumeSnapshot } from '@profiloz/shared'

export interface ContentDensity {
  experiences: 'low' | 'medium' | 'high'
  educations: 'low' | 'medium' | 'high'
  skills: 'low' | 'medium' | 'high'
  overall: 'light' | 'balanced' | 'heavy'
}

export interface LayoutRecommendations {
  sidebarWidth: number
  sectionSpacing: number
  skillColumns: number
  compactMode: boolean
  expandMode: boolean
}

export function useResumeLayoutAnalysis() {
  /**
   * Analyse la densité du contenu du CV
   */
  function analyzeContentDensity(resume: ResumeSnapshot): ContentDensity {
    const expCount = resume.experiences?.length || 0
    const eduCount = resume.educations?.length || 0
    const skillCount = resume.skills?.length || 0

    const experiences = expCount <= 2 ? 'low' : expCount <= 5 ? 'medium' : 'high'
    const educations = eduCount === 0 ? 'low' : eduCount <= 2 ? 'medium' : 'high'
    const skills = skillCount <= 5 ? 'low' : skillCount <= 15 ? 'medium' : 'high'

    // Calculer la densité globale
    const totalScore = (expCount * 3) + (eduCount * 2) + skillCount
    const overall = totalScore <= 10 ? 'light' : totalScore <= 25 ? 'balanced' : 'heavy'

    return { experiences, educations, skills, overall }
  }

  /**
   * Génère des recommandations de mise en page basées sur le contenu
   */
  function getLayoutRecommendations(density: ContentDensity): LayoutRecommendations {
    const { overall, skills } = density

    // Ajuster la largeur de la sidebar selon la densité
    const sidebarWidth = overall === 'light' ? 75 : overall === 'balanced' ? 68 : 62

    // Ajuster l'espacement des sections
    const sectionSpacing = overall === 'light' ? 10 : overall === 'balanced' ? 8 : 6

    // Colonnes de compétences
    const skillColumns = skills === 'low' ? 1 : skills === 'medium' ? 2 : 3

    // Mode compact pour contenu dense
    const compactMode = overall === 'heavy'

    // Mode étendu pour contenu léger
    const expandMode = overall === 'light'

    return {
      sidebarWidth,
      sectionSpacing,
      skillColumns,
      compactMode,
      expandMode,
    }
  }

  /**
   * Détecte les textes potentiellement trop longs
   */
  function detectLongTexts(resume: ResumeSnapshot) {
    const warnings: string[] = []

    resume.experiences?.forEach((exp, i) => {
      if (exp.position && exp.position.length > 50) {
        warnings.push(`Poste expérience ${i + 1} très long: "${exp.position}"`)
      }
      if (exp.company && exp.company.length > 40) {
        warnings.push(`Entreprise expérience ${i + 1} très longue: "${exp.company}"`)
      }
    })

    resume.skills?.forEach((skill, i) => {
      if (skill.name && skill.name.length > 30) {
        warnings.push(`Compétence ${i + 1} très longue: "${skill.name}"`)
      }
    })

    return warnings
  }

  /**
   * Calcule le nombre estimé de pages
   */
  function estimatePageCount(resume: ResumeSnapshot): number {
    const density = analyzeContentDensity(resume)
    
    // Estimation basée sur la densité
    if (density.overall === 'light') return 1
    if (density.overall === 'balanced') return 1.5
    return 2
  }

  /**
   * Recommande l'ordre des sections basé sur le contenu
   */
  function recommendSectionOrder(resume: ResumeSnapshot): string[] {
    const order: string[] = []
    const hasExperiences = resume.experiences && resume.experiences.length > 0
    const hasEducations = resume.educations && resume.educations.length > 0
    const hasSkills = resume.skills && resume.skills.length > 0

    // Pour les profils juniors, mettre la formation en premier
    const isJunior = !hasExperiences || (hasExperiences && resume.experiences.length <= 2)

    if (hasExperiences && !isJunior) order.push('experiences')
    if (hasEducations && isJunior) order.push('educations')
    if (hasExperiences && isJunior) order.push('experiences')
    if (hasEducations && !isJunior) order.push('educations')
    if (hasSkills) order.push('skills')

    return order
  }

  return {
    analyzeContentDensity,
    getLayoutRecommendations,
    detectLongTexts,
    estimatePageCount,
    recommendSectionOrder,
  }
}
