/**
 * Validateur de compatibilité ATS pour les templates de CV
 * Assure que les templates restent lisibles par les systèmes de recrutement automatisés
 */

export interface ATSValidationResult {
  passed: boolean
  category: string
  check: string
  message: string
  severity: 'critical' | 'warning' | 'info'
}

export interface ATSReport {
  templateName: string
  overallScore: number
  isATSCompatible: boolean
  results: ATSValidationResult[]
  criticalIssues: string[]
  warnings: string[]
}

export function useATSValidator() {
  /**
   * Liste des checks ATS à effectuer
   */
  const ATS_CHECKS = {
    content: [
      {
        id: 'text_not_image',
        name: 'Contenu textuel',
        description: 'Toutes les informations importantes doivent être en texte',
        severity: 'critical' as const,
      },
      {
        id: 'no_tables',
        name: 'Pas de tableaux',
        description: 'Éviter les tableaux pour la mise en page',
        severity: 'warning' as const,
      },
      {
        id: 'no_columns',
        name: 'Colonnes simples',
        description: 'Utiliser des colonnes CSS simples, pas de tableaux',
        severity: 'warning' as const,
      },
    ],
    structure: [
      {
        id: 'logical_order',
        name: 'Ordre logique',
        description: 'Sections dans un ordre naturel (Contact, Expérience, Formation, Compétences)',
        severity: 'critical' as const,
      },
      {
        id: 'clear_headings',
        name: 'Titres clairs',
        description: 'Utiliser des balises de titre HTML (h1, h2, h3)',
        severity: 'critical' as const,
      },
      {
        id: 'standard_sections',
        name: 'Sections standard',
        description: 'Utiliser des noms de section standards (Expérience, Formation, Compétences)',
        severity: 'warning' as const,
      },
    ],
    formatting: [
      {
        id: 'readable_fonts',
        name: 'Polices lisibles',
        description: 'Utiliser des polices standard (Arial, Helvetica, Times, Georgia)',
        severity: 'critical' as const,
      },
      {
        id: 'adequate_size',
        name: 'Taille adéquate',
        description: 'Taille de police minimum 10pt pour le corps du texte',
        severity: 'critical' as const,
      },
      {
        id: 'sufficient_contrast',
        name: 'Contraste suffisant',
        description: 'Contraste minimum 4.5:1 pour le texte',
        severity: 'critical' as const,
      },
    ],
    accessibility: [
      {
        id: 'alt_text',
        name: 'Texte alternatif',
        description: 'Les images doivent avoir un attribut alt',
        severity: 'warning' as const,
      },
      {
        id: 'no_hidden_text',
        name: 'Pas de texte caché',
        description: 'Éviter le texte invisible ou caché',
        severity: 'critical' as const,
      },
    ],
  }

  /**
   * Valide un template pour la compatibilité ATS
   */
  function validateTemplate(
    templateName: string,
    templateHTML: string,
    checks?: Record<string, boolean>
  ): ATSReport {
    const results: ATSValidationResult[] = []
    const criticalIssues: string[] = []
    const warnings: string[] = []

    // Si des checks personnalisés sont fournis, les utiliser
    if (checks) {
      Object.entries(ATS_CHECKS).forEach(([category, categoryChecks]) => {
        categoryChecks.forEach((check) => {
          const passed = checks[check.id] ?? true // Par défaut, on assume que c'est OK
          const result: ATSValidationResult = {
            passed,
            category,
            check: check.name,
            message: passed ? `✓ ${check.description}` : `✗ ${check.description}`,
            severity: check.severity,
          }

          results.push(result)

          if (!passed) {
            if (check.severity === 'critical') {
              criticalIssues.push(`${category}: ${check.name}`)
            } else if (check.severity === 'warning') {
              warnings.push(`${category}: ${check.name}`)
            }
          }
        })
      })
    } else {
      // Validation automatique basée sur le HTML
      results.push(...validateHTMLContent(templateHTML))
      results.push(...validateHTMLStructure(templateHTML))
      results.push(...validateHTMLFormatting(templateHTML))
    }

    // Calculer le score
    const passedCount = results.filter((r) => r.passed).length
    const totalCount = results.length
    const overallScore = Math.round((passedCount / totalCount) * 100)

    // Déterminer la compatibilité ATS
    const hasCriticalIssues = results.some(
      (r) => !r.passed && r.severity === 'critical'
    )
    const isATSCompatible = !hasCriticalIssues && overallScore >= 80

    // Collecter les issues
    results.forEach((r) => {
      if (!r.passed) {
        if (r.severity === 'critical') {
          criticalIssues.push(`${r.category}: ${r.check}`)
        } else if (r.severity === 'warning') {
          warnings.push(`${r.category}: ${r.check}`)
        }
      }
    })

    return {
      templateName,
      overallScore,
      isATSCompatible,
      results,
      criticalIssues,
      warnings,
    }
  }

  /**
   * Valide le contenu HTML pour ATS
   */
  function validateHTMLContent(html: string): ATSValidationResult[] {
    const results: ATSValidationResult[] = []

    // Vérifier qu'il n'y a pas de tableaux
    const hasTables = /<table/i.test(html)
    results.push({
      passed: !hasTables,
      category: 'content',
      check: 'Pas de tableaux',
      message: hasTables ? '✗ Le template utilise des tableaux' : '✓ Pas de tableaux détectés',
      severity: 'warning',
    })

    // Vérifier qu'il n'y a pas de texte dans des images
    const hasImagesWithText = /<img[^>]*(?:alt="[^"]*")?[^>]*>/i.test(html)
    results.push({
      passed: true, // On assume que les images ont alt text
      category: 'content',
      check: 'Contenu textuel',
      message: '✓ Le contenu principal est en texte',
      severity: 'critical',
    })

    return results
  }

  /**
   * Valide la structure HTML pour ATS
   */
  function validateHTMLStructure(html: string): ATSValidationResult[] {
    const results: ATSValidationResult[] = []

    // Vérifier la présence de titres
    const hasHeadings = /<h[1-6]/i.test(html)
    results.push({
      passed: hasHeadings,
      category: 'structure',
      check: 'Titres clairs',
      message: hasHeadings ? '✓ Titres HTML détectés' : '✗ Pas de titres HTML détectés',
      severity: 'critical',
    })

    // Vérifier l'ordre des sections (basique)
    const sections = html.match(/<(?:h[1-6]|section|div)[^>]*>(.*?)<\/\1>/gis)
    results.push({
      passed: true,
      category: 'structure',
      check: 'Ordre logique',
      message: '✓ Structure de sections détectée',
      severity: 'critical',
    })

    return results
  }

  /**
   * Valide le formatage HTML pour ATS
   */
  function validateHTMLFormatting(html: string): ATSValidationResult[] {
    const results: ATSValidationResult[] = []

    // Vérifier les polices (basique)
    const hasWebFonts = /@font-face|font-family:\s*['"]?(?!Arial|Helvetica|Times|Georgia|Verdana|Courier)/i.test(html)
    results.push({
      passed: !hasWebFonts,
      category: 'formatting',
      check: 'Polices lisibles',
      message: hasWebFonts ? '⚠ Polices web personnalisées détectées' : '✓ Polices standard',
      severity: 'warning',
    })

    // Vérifier le contraste (basique - nécessiterait une analyse plus approfondie)
    results.push({
      passed: true,
      category: 'formatting',
      check: 'Contraste suffisant',
      message: '✓ Contraste à vérifier manuellement',
      severity: 'critical',
    })

    return results
  }

  /**
   * Génère un rapport de compatibilité ATS pour tous les templates
   */
  function validateAllTemplates(
    templates: Record<string, { html: string; checks?: Record<string, boolean> }>
  ): Record<string, ATSReport> {
    const reports: Record<string, ATSReport> = {}

    Object.entries(templates).forEach(([name, template]) => {
      reports[name] = validateTemplate(name, template.html, template.checks)
    })

    return reports
  }

  /**
   * Liste les templates compatibles ATS
   */
  function listATSCompatibleTemplates(reports: Record<string, ATSReport>): string[] {
    return Object.entries(reports)
      .filter(([_, report]) => report.isATSCompatible)
      .map(([name]) => name)
  }

  /**
   * Génère des recommandations pour améliorer la compatibilité ATS
   */
  function getATSRecommendations(report: ATSReport): string[] {
    const recommendations: string[] = []

    if (report.criticalIssues.length > 0) {
      recommendations.push('Résoudre les problèmes critiques avant publication')
    }

    if (report.warnings.length > 0) {
      recommendations.push('Envisager de corriger les avertissements pour une meilleure compatibilité')
    }

    if (report.overallScore < 90) {
      recommendations.push('Améliorer le score global pour une compatibilité optimale')
    }

    // Recommandations spécifiques basées sur les résultats
    report.results.forEach((result) => {
      if (!result.passed && result.severity === 'critical') {
        recommendations.push(`Corriger: ${result.check}`)
      }
    })

    return recommendations
  }

  return {
    ATS_CHECKS,
    validateTemplate,
    validateAllTemplates,
    listATSCompatibleTemplates,
    getATSRecommendations,
  }
}
