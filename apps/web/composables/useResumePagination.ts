import type { ResumeSnapshot } from '@profiloz/shared'

export interface PaginationRule {
  type: 'section' | 'experience' | 'education' | 'list'
  selector: string
  avoidBreakInside?: boolean
  avoidBreakAfter?: boolean
  avoidBreakBefore?: boolean
}

export interface PaginationAnalysis {
  estimatedPages: number
  riskyBreaks: string[]
  recommendations: string[]
}

export function useResumePagination() {
  /**
   * Règles de pagination pour éviter les coupes maladroites
   */
  const PAGINATION_RULES: PaginationRule[] = [
    // Ne jamais couper un titre de section
    {
      type: 'section',
      selector: '.resume-section-title',
      avoidBreakAfter: true,
      avoidBreakBefore: true,
    },
    // Ne jamais couper une expérience au milieu
    {
      type: 'experience',
      selector: '.resume-experience',
      avoidBreakInside: true,
    },
    // Ne jamais couper une formation au milieu
    {
      type: 'education',
      selector: '.resume-education',
      avoidBreakInside: true,
    },
    // Éviter de couper une liste de compétences
    {
      type: 'list',
      selector: '.resume-skills-list',
      avoidBreakInside: true,
    },
  ]

  /**
   * Analyse le contenu pour détecter les risques de pagination
   */
  function analyzePaginationRisks(resume: ResumeSnapshot): PaginationAnalysis {
    const riskyBreaks: string[] = []
    const recommendations: string[] = []

    // Estimer le nombre de pages
    const estimatedPages = estimatePageCount(resume)

    // Détecter les expériences très longues
    resume.experiences?.forEach((exp, i) => {
      const descriptionLength = exp.description?.length || 0
      if (descriptionLength > 500) {
        riskyBreaks.push(`Expérience ${i + 1} (${exp.position}) - description très longue (${descriptionLength} caractères)`)
        recommendations.push(`Considérer de réduire la description de l'expérience ${i + 1}`)
      }
    })

    // Détecter si beaucoup de compétences
    const skillCount = resume.skills?.length || 0
    if (skillCount > 20) {
      riskyBreaks.push(`Beaucoup de compétences (${skillCount}) - risque de coupure de liste`)
      recommendations.push('Répartir les compétences sur plusieurs colonnes')
    }

    // Détecter si beaucoup de formations
    const eduCount = resume.educations?.length || 0
    if (eduCount > 5) {
      riskyBreaks.push(`Beaucoup de formations (${eduCount}) - risque de coupure`)
      recommendations.push('Considérer de regrouper ou réduire les formations')
    }

    return {
      estimatedPages,
      riskyBreaks,
      recommendations,
    }
  }

  /**
   * Estime le nombre de pages nécessaires
   */
  function estimatePageCount(resume: ResumeSnapshot): number {
    let contentScore = 0

    // Expériences
    resume.experiences?.forEach((exp) => {
      contentScore += 10 // Base pour chaque expérience
      contentScore += (exp.description?.length || 0) / 100 // Description
    })

    // Formations
    contentScore += (resume.educations?.length || 0) * 8

    // Compétences
    contentScore += (resume.skills?.length || 0) * 2

    // Langues
    contentScore += (resume.languages?.length || 0) * 3

    // Centres d'intérêt
    contentScore += (resume.interests?.length || 0) * 2

    // Profil
    if (resume.summary) {
      contentScore += resume.summary.length / 50
    }

    // Photo
    if (resume.personalInfo?.photoUrl) {
      contentScore += 5
    }

    // Conversion en pages (approximatif)
    const pageThreshold = 100
    return Math.ceil(contentScore / pageThreshold)
  }

  /**
   * Génère les CSS pour la pagination intelligente
   */
  function generatePaginationCSS(): string {
    return `
      /* Éviter les coupes de page maladroites */
      .resume-section-title {
        page-break-after: avoid;
        page-break-inside: avoid;
        break-after: avoid;
        break-inside: avoid;
      }

      .resume-experience {
        page-break-inside: avoid;
        break-inside: avoid;
      }

      .resume-education {
        page-break-inside: avoid;
        break-inside: avoid;
      }

      .resume-skills-list {
        page-break-inside: avoid;
        break-inside: avoid;
      }

      /* Éviter les orphelines et veuves */
      .resume-bullet-item {
        page-break-inside: avoid;
        break-inside: avoid;
      }

      /* Éviter qu'un titre reste seul en bas de page */
      .resume-section {
        page-break-before: auto;
        break-before: auto;
      }

      /* Optimisation pour l'impression */
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .resume-page {
          page-break-after: always;
          break-after: always;
        }

        .resume-page:last-child {
          page-break-after: auto;
          break-after: auto;
        }
      }
    `
  }

  /**
   * Recommande des ajustements pour optimiser la pagination
   */
  function getPaginationOptimizations(resume: ResumeSnapshot): string[] {
    const optimizations: string[] = []
    const analysis = analyzePaginationRisks(resume)

    if (analysis.estimatedPages > 2) {
      optimizations.push('Réduire le contenu pour tenir sur 2 pages maximum')
    }

    if (analysis.riskyBreaks.length > 0) {
      optimizations.push('Réduire les descriptions d\'expériences longues')
    }

    const expCount = resume.experiences?.length || 0
    if (expCount > 8) {
      optimizations.push('Ne conserver que les 5-8 expériences les plus récentes')
    }

    const skillCount = resume.skills?.length || 0
    if (skillCount > 15) {
      optimizations.push('Grouper les compétences par catégorie')
    }

    return optimizations
  }

  /**
   * Calcule l'espace vertical estimé pour chaque section
   */
  function calculateSectionHeights(resume: ResumeSnapshot): Record<string, number> {
    const heights: Record<string, number> = {}

    // Header
    heights.header = 40 // mm

    // Expériences
    heights.experiences = (resume.experiences?.length || 0) * 25

    // Formations
    heights.educations = (resume.educations?.length || 0) * 15

    // Compétences
    heights.skills = Math.ceil((resume.skills?.length || 0) / 5) * 10

    // Langues
    heights.languages = (resume.languages?.length || 0) * 8

    // Centres d'intérêt
    heights.interests = (resume.interests?.length || 0) * 6

    // Profil
    heights.summary = resume.summary ? Math.ceil(resume.summary.length / 100) * 5 : 0

    return heights
  }

  return {
    PAGINATION_RULES,
    analyzePaginationRisks,
    estimatePageCount,
    generatePaginationCSS,
    getPaginationOptimizations,
    calculateSectionHeights,
  }
}
