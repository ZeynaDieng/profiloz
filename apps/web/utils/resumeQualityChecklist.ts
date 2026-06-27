/**
 * Checklist qualité pour les templates de CV
 * Chaque nouveau template doit satisfaire ces critères avant publication
 */

export interface QualityCheckResult {
  passed: boolean
  category: string
  check: string
  message: string
}

export interface TemplateQualityReport {
  templateName: string
  overallScore: number
  results: QualityCheckResult[]
  canPublish: boolean
}

export const QUALITY_CHECKS = {
  design: [
    {
      id: 'hierarchy',
      name: 'Hiérarchie visuelle',
      description: 'Le nom doit être le point focal, suivi du poste',
    },
    {
      id: 'spacing',
      name: 'Espacements cohérents',
      description: 'Marges et espacements uniformes dans tout le document',
    },
    {
      id: 'typography',
      name: 'Typographie premium',
      description: 'Combinaison de polices élégante et lisible',
    },
    {
      id: 'color',
      name: 'Palette harmonieuse',
      description: 'Couleurs professionnelles et bien contrastées',
    },
  ],
  ats: [
    {
      id: 'text_content',
      name: 'Contenu textuel',
      description: 'Toutes les informations importantes sont en texte (pas d\'images)',
    },
    {
      id: 'section_order',
      name: 'Ordre logique',
      description: 'Sections dans un ordre naturel pour les ATS',
    },
    {
      id: 'no_decorative',
      name: 'Pas d\'éléments décoratifs excessifs',
      description: 'Éviter les graphiques qui bloquent la lecture automatique',
    },
  ],
  readability: [
    {
      id: 'font_size',
      name: 'Taille de police minimale',
      description: 'Minimum 8pt pour le corps du texte',
    },
    {
      id: 'contrast',
      name: 'Contraste suffisant',
      description: 'Ratio de contraste minimum 4.5:1',
    },
    {
      id: 'line_height',
      name: 'Hauteur de ligne',
      description: 'Minimum 1.4 pour la lisibilité',
    },
  ],
  responsive: [
    {
      id: 'light_content',
      name: 'Contenu léger',
      description: 'Fonctionne avec peu d\'expériences/compétences',
    },
    {
      id: 'heavy_content',
      name: 'Contenu dense',
      description: 'Fonctionne avec beaucoup d\'expériences/compétences',
    },
    {
      id: 'long_text',
      name: 'Textes longs',
      description: 'Gère les intitulés de poste/entreprise longs',
    },
  ],
  printing: [
    {
      id: 'bw_printable',
      name: 'Impression N&B',
      description: 'Lisible en noir et blanc',
    },
    {
      id: 'a4_optimized',
      name: 'Format A4',
      description: 'Optimisé pour impression A4 standard',
    },
    {
      id: 'margins',
      name: 'Marges d\'impression',
      description: 'Marges suffisantes pour l\'impression',
    },
  ],
  consistency: [
    {
      id: 'brand_match',
      name: 'Cohérence Profilo\'Z',
      description: 'Style cohérent avec la plateforme',
    },
    {
      id: 'cover_letter',
      name: 'Lettre associée',
      description: 'Lettre de motivation correspondante disponible',
    },
  ],
}

/**
 * Génère un rapport de qualité pour un template
 */
export function generateQualityReport(
  templateName: string,
  checks: Record<string, boolean>
): TemplateQualityReport {
  const results: QualityCheckResult[] = []
  let passedCount = 0
  let totalCount = 0

  Object.entries(QUALITY_CHECKS).forEach(([category, categoryChecks]) => {
    categoryChecks.forEach((check) => {
      totalCount++
      const passed = checks[check.id] ?? false
      if (passed) passedCount++

      results.push({
        passed,
        category,
        check: check.name,
        message: passed ? '✓ ' + check.description : '✗ ' + check.description,
      })
    })
  })

  const overallScore = Math.round((passedCount / totalCount) * 100)
  const canPublish = overallScore >= 90

  return {
    templateName,
    overallScore,
    results,
    canPublish,
  }
}

/**
 * Liste des templates avec leur rapport de qualité
 */
export const TEMPLATE_QUALITY_REGISTRY: Record<string, TemplateQualityReport> = {}

/**
 * Enregistre le rapport de qualité d'un template
 */
export function registerTemplateQuality(report: TemplateQualityReport) {
  TEMPLATE_QUALITY_REGISTRY[report.templateName] = report
}

/**
 * Récupère le rapport de qualité d'un template
 */
export function getTemplateQuality(templateName: string): TemplateQualityReport | null {
  return TEMPLATE_QUALITY_REGISTRY[templateName] || null
}

/**
 * Liste tous les templates avec leur score
 */
export function listTemplateScores(): Array<{ name: string; score: number; canPublish: boolean }> {
  return Object.entries(TEMPLATE_QUALITY_REGISTRY).map(([name, report]) => ({
    name,
    score: report.overallScore,
    canPublish: report.canPublish,
  }))
}
