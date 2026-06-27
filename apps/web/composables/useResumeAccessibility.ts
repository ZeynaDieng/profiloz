/**
 * Validation de l'accessibilité des templates de CV
 * Assure que les templates sont lisibles et accessibles pour tous
 */

export interface AccessibilityCheck {
  category: string
  check: string
  passed: boolean
  message: string
  severity: 'critical' | 'warning' | 'info'
}

export interface AccessibilityReport {
  templateName: string
  overallScore: number
  isAccessible: boolean
  checks: AccessibilityCheck[]
  criticalIssues: string[]
  warnings: string[]
}

export interface ContrastRatio {
  ratio: number
  passesAA: boolean
  passesAAA: boolean
}

export function useResumeAccessibility() {
  /**
   * Calcule le ratio de contraste entre deux couleurs
   */
  function calculateContrastRatio(foreground: string, background: string): ContrastRatio {
    // Convertir hex en RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result
        ? {
            r: parseInt(result[1] || '00', 16),
            g: parseInt(result[2] || '00', 16),
            b: parseInt(result[3] || '00', 16),
          }
        : { r: 0, g: 0, b: 0 }
    }

    const fg = hexToRgb(foreground)
    const bg = hexToRgb(background)

    // Calculer la luminance
    const luminance = (r: number, g: number, b: number) => {
      const [rs, gs, bs] = [r, g, b].map((c) => {
        c /= 255
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      })
      return 0.2126 * (rs || 0) + 0.7152 * (gs || 0) + 0.0722 * (bs || 0)
    }

    const fgLum = luminance(fg.r, fg.g, fg.b)
    const bgLum = luminance(bg.r, bg.g, bg.b)

    const lighter = Math.max(fgLum, bgLum)
    const darker = Math.min(fgLum, bgLum)

    const ratio = (lighter + 0.05) / (darker + 0.05)

    return {
      ratio: Math.round(ratio * 100) / 100,
      passesAA: ratio >= 4.5,
      passesAAA: ratio >= 7,
    }
  }

  /**
   * Vérifie la taille de police minimale
   */
  function checkFontSize(html: string): AccessibilityCheck {
    const minFontSize = 8 // pt minimum
    const hasSmallFonts = /font-size:\s*[0-7](\.\d+)?pt/i.test(html)

    return {
      category: 'typography',
      check: 'Taille de police minimale',
      passed: !hasSmallFonts,
      message: hasSmallFonts
        ? '✗ Certaines polices sont inférieures à 8pt'
        : '✓ Toutes les polices sont ≥ 8pt',
      severity: 'critical',
    }
  }

  /**
   * Vérifie le contraste des couleurs
   */
  function checkColorContrast(html: string): AccessibilityCheck[] {
    const checks: AccessibilityCheck[] = []

    // Extraire les couleurs du CSS (simplifié)
    const colorMatches = html.match(/color:\s*#([0-9a-f]{6})/gi) || []
    const bgMatches = html.match(/background(?:-color)?:\s*#([0-9a-f]{6})/gi) || []

    // Vérifier quelques combinaisons courantes
    const commonPairs = [
      { fg: '#1e293b', bg: '#ffffff' }, // Texte sur blanc
      { fg: '#ffffff', bg: '#1e3a5f' }, // Texte sur foncé
      { fg: '#64748b', bg: '#ffffff' }, // Texte muted sur blanc
    ]

    commonPairs.forEach((pair) => {
      const contrast = calculateContrastRatio(pair.fg, pair.bg)
      checks.push({
        category: 'contrast',
        check: `Contraste ${pair.fg} sur ${pair.bg}`,
        passed: contrast.passesAA,
        message: contrast.passesAA
          ? `✓ Ratio ${contrast.ratio}:1 (passe AA)`
          : `✗ Ratio ${contrast.ratio}:1 (échoue AA)`,
        severity: 'critical',
      })
    })

    return checks
  }

  /**
   * Vérifie la hauteur de ligne
   */
  function checkLineHeight(html: string): AccessibilityCheck {
    const hasLineHeight = /line-height:\s*[1-9]\.[4-9]/i.test(html)

    return {
      category: 'typography',
      check: 'Hauteur de ligne',
      passed: hasLineHeight,
      message: hasLineHeight
        ? '✓ Hauteur de ligne adéquate détectée'
        : '⚠ Hauteur de ligne non détectée - recommandé 1.4+',
      severity: 'warning',
    }
  }

  /**
   * Vérifie la hiérarchie des titres
   */
  function checkHeadingHierarchy(html: string): AccessibilityCheck {
    const hasH1 = /<h1/i.test(html)
    const hasH2 = /<h2/i.test(html)
    const hasProperOrder = /<h1[^>]*>[\s\S]*?<h2/i.test(html)

    return {
      category: 'structure',
      check: 'Hiérarchie des titres',
      passed: hasH1 && hasH2 && hasProperOrder,
      message: hasH1 && hasH2 && hasProperOrder
        ? '✓ Hiérarchie des titres correcte'
        : '⚠ Hiérarchie des titres à vérifier',
      severity: 'warning',
    }
  }

  /**
   * Vérifie les textes alternatifs pour les images
   */
  function checkAltText(html: string): AccessibilityCheck {
    const imagesWithoutAlt = /<img(?![^>]*alt=)/gi.test(html)

    return {
      category: 'images',
      check: 'Texte alternatif',
      passed: !imagesWithoutAlt,
      message: imagesWithoutAlt
        ? '✗ Certaines images n\'ont pas d\'attribut alt'
        : '✓ Toutes les images ont un attribut alt',
      severity: 'critical',
    }
  }

  /**
   * Vérifie la cohérence typographique
   */
  function checkTypographyConsistency(html: string): AccessibilityCheck {
    const fontFamilies = html.match(/font-family:\s*[^;]+/gi) || []
    const uniqueFonts = new Set(fontFamilies.map((f) => f.toLowerCase()))

    return {
      category: 'typography',
      check: 'Cohérence typographique',
      passed: uniqueFonts.size <= 3,
      message: uniqueFonts.size <= 3
        ? `✓ ${uniqueFonts.size} familles de polices utilisées`
        : `⚠ ${uniqueFonts.size} familles de polices - recommandé ≤ 3`,
      severity: 'warning',
    }
  }

  /**
   * Génère un rapport d'accessibilité complet
   */
  function generateAccessibilityReport(
    templateName: string,
    html: string
  ): AccessibilityReport {
    const checks: AccessibilityCheck[] = []

    // Exécuter tous les checks
    checks.push(checkFontSize(html))
    checks.push(checkLineHeight(html))
    checks.push(checkHeadingHierarchy(html))
    checks.push(checkAltText(html))
    checks.push(checkTypographyConsistency(html))
    checks.push(...checkColorContrast(html))

    // Calculer le score
    const passedCount = checks.filter((c) => c.passed).length
    const totalCount = checks.length
    const overallScore = Math.round((passedCount / totalCount) * 100)

    // Collecter les issues
    const criticalIssues = checks
      .filter((c) => !c.passed && c.severity === 'critical')
      .map((c) => `${c.category}: ${c.check}`)

    const warnings = checks
      .filter((c) => !c.passed && c.severity === 'warning')
      .map((c) => `${c.category}: ${c.check}`)

    // Déterminer l'accessibilité
    const isAccessible = criticalIssues.length === 0 && overallScore >= 80

    return {
      templateName,
      overallScore,
      isAccessible,
      checks,
      criticalIssues,
      warnings,
    }
  }

  /**
   * Recommande des améliorations d'accessibilité
   */
  function getAccessibilityRecommendations(report: AccessibilityReport): string[] {
    const recommendations: string[] = []

    if (report.criticalIssues.length > 0) {
      recommendations.push('Résoudre les problèmes critiques d\'accessibilité')
    }

    if (report.warnings.length > 0) {
      recommendations.push('Envisager de corriger les avertissements')
    }

    // Recommandations spécifiques
    report.checks.forEach((check) => {
      if (!check.passed) {
        switch (check.category) {
          case 'contrast':
            recommendations.push('Augmenter le contraste des couleurs pour atteindre le ratio AA (4.5:1)')
            break
          case 'typography':
            if (check.check.includes('Taille de police')) {
              recommendations.push('Augmenter la taille des polices à minimum 8pt')
            }
            if (check.check.includes('Hauteur de ligne')) {
              recommendations.push('Augmenter la hauteur de ligne à minimum 1.4')
            }
            break
          case 'images':
            recommendations.push('Ajouter des attributs alt descriptifs à toutes les images')
            break
          case 'structure':
            recommendations.push('Améliorer la hiérarchie des titres HTML')
            break
        }
      }
    })

    return recommendations
  }

  /**
   * Valide une couleur pour l'accessibilité
   */
  function validateColor(color: string, background: string = '#ffffff'): {
    valid: boolean
    ratio: number
    recommendations: string[]
  } {
    const contrast = calculateContrastRatio(color, background)
    const recommendations: string[] = []

    if (!contrast.passesAA) {
      recommendations.push(`Le ratio de contraste (${contrast.ratio}:1) est inférieur au minimum AA (4.5:1)`)
      recommendations.push('Considérer d\'assombrir le texte ou d\'éclaircir l\'arrière-plan')
    }

    if (!contrast.passesAAA) {
      recommendations.push(`Le ratio de contraste (${contrast.ratio}:1) n'atteint pas le niveau AAA (7:1)`)
    }

    return {
      valid: contrast.passesAA,
      ratio: contrast.ratio,
      recommendations,
    }
  }

  /**
   * Génère des CSS d'accessibilité
   */
  function generateAccessibilityCSS(): string {
    return `
      /* Focus visible pour l'accessibilité au clavier */
      *:focus {
        outline: 2px solid currentColor;
        outline-offset: 2px;
      }

      /* Texte sélectionné */
      ::selection {
        background: currentColor;
        color: background;
      }

      /* Éviter le texte justifié qui peut créer des espaces irréguliers */
      .resume-content {
        text-align: left;
      }

      /* Espacement suffisant entre les lignes */
      .resume-text {
        line-height: 1.5;
      }

      /* Taille de police minimale */
      .resume-body {
        font-size: 11pt;
      }

      /* Contraste suffisant (à appliquer via variables) */
      .resume-text {
        color: var(--color-text, #1e293b);
      }

      .resume-muted {
        color: var(--color-muted, #64748b);
      }
    `
  }

  return {
    calculateContrastRatio,
    checkFontSize,
    checkColorContrast,
    checkLineHeight,
    checkHeadingHierarchy,
    checkAltText,
    checkTypographyConsistency,
    generateAccessibilityReport,
    getAccessibilityRecommendations,
    validateColor,
    generateAccessibilityCSS,
  }
}
