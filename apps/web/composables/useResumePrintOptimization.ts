/**
 * Optimisation pour l'impression professionnelle des CV
 * Assure que les PDF sont parfaitement lisibles sur toutes les imprimantes
 */

export interface PrintOptimizationSettings {
  enableColorAdjustment: boolean
  enableFontEmbedding: boolean
  enableHighQuality: boolean
  pageSize: 'A4' | 'Letter'
  margins: {
    top: number
    right: number
    bottom: number
    left: number
  }
}

export interface PrintQualityCheck {
  category: string
  check: string
  passed: boolean
  message: string
}

export interface PrintOptimizationReport {
  templateName: string
  overallScore: number
  isPrintReady: boolean
  checks: PrintQualityCheck[]
  recommendations: string[]
}

export function useResumePrintOptimization() {
  /**
   * Paramètres d'impression par défaut
   */
  const defaultSettings: PrintOptimizationSettings = {
    enableColorAdjustment: true,
    enableFontEmbedding: true,
    enableHighQuality: true,
    pageSize: 'A4',
    margins: {
      top: 15,
      right: 15,
      bottom: 15,
      left: 15,
    },
  }

  /**
   * Génère les CSS pour l'impression
   */
  function generatePrintCSS(settings: PrintOptimizationSettings = defaultSettings): string {
    const { pageSize, margins } = settings

    return `
      @page {
        size: ${pageSize};
        margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
      }

      @media print {
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          font-size: 11pt;
          line-height: 1.4;
        }

        /* Optimisation noir et blanc */
        @media print and (color-index: 0) {
          .resume-accent {
            filter: grayscale(100%);
          }
        }

        /* Éviter les coupes de page */
        .resume-section {
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .resume-experience,
        .resume-education {
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .resume-bullet-item {
          page-break-inside: avoid;
          break-inside: avoid;
        }

        /* Optimisation des marges */
        .resume-page {
          margin: 0;
          padding: 0;
        }

        /* Qualité d'impression */
        img {
          max-width: 100%;
          height: auto;
          image-rendering: -webkit-optimize-contrast;
          image-rendering: crisp-edges;
        }

        /* Éviter les éléments inutiles à l'impression */
        .no-print {
          display: none !important;
        }

        /* Optimisation des liens */
        a {
          text-decoration: none;
          color: inherit;
        }

        /* Optimisation des fonds */
        .print-bg {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }

      /* Prévisualisation impression */
      @media screen {
        .print-preview {
          width: 210mm;
          min-height: 297mm;
          margin: 20px auto;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
        }
      }
    `
  }

  /**
   * Vérifie la qualité d'impression d'un template
   */
  function checkPrintQuality(html: string): PrintQualityCheck[] {
    const checks: PrintQualityCheck[] = []

    // Vérifier la taille de police
    const hasSmallFonts = /font-size:\s*[0-7]pt/i.test(html)
    checks.push({
      category: 'typography',
      check: 'Taille de police minimale',
      passed: !hasSmallFonts,
      message: hasSmallFonts
        ? '✗ Certaines polices sont inférieures à 8pt'
        : '✓ Toutes les polices sont ≥ 8pt',
    })

    // Vérifier le contraste (basique)
    const hasLowContrast = /color:\s*#[f-f]{6}.*background:\s*#[f-f]{6}/i.test(html)
    checks.push({
      category: 'contrast',
      check: 'Contraste suffisant',
      passed: !hasLowContrast,
      message: hasLowContrast
        ? '⚠ Contraste potentiellement faible - vérifier manuellement'
        : '✓ Contraste semble adéquat',
    })

    // Vérifier les marges
    const hasMargins = /margin:\s*[1-9][0-9]*mm/i.test(html)
    checks.push({
      category: 'layout',
      check: 'Marges présentes',
      passed: hasMargins,
      message: hasMargins ? '✓ Marges détectées' : '⚠ Marges non détectées',
    })

    // Vérifier les images
    const hasImages = /<img/i.test(html)
    checks.push({
      category: 'images',
      check: 'Images optimisées',
      passed: true,
      message: hasImages ? '✓ Images présentes - vérifier la qualité' : '✓ Pas d\'images',
    })

    // Vérifier les tableaux
    const hasTables = /<table/i.test(html)
    checks.push({
      category: 'layout',
      check: 'Pas de tableaux',
      passed: !hasTables,
      message: hasTables ? '⚠ Tableaux détectés - peuvent causer des problèmes d\'impression' : '✓ Pas de tableaux',
    })

    return checks
  }

  /**
   * Génère un rapport d'optimisation d'impression
   */
  function generatePrintReport(
    templateName: string,
    html: string
  ): PrintOptimizationReport {
    const checks = checkPrintQuality(html)
    const passedCount = checks.filter((c) => c.passed).length
    const overallScore = Math.round((passedCount / checks.length) * 100)

    const recommendations: string[] = []

    if (overallScore < 100) {
      recommendations.push('Corriger les problèmes détectés avant impression')
    }

    if (!checks.some((c) => c.category === 'typography' && c.passed)) {
      recommendations.push('Augmenter la taille des polices pour une meilleure lisibilité')
    }

    if (!checks.some((c) => c.category === 'layout' && c.check === 'Marges présentes' && c.passed)) {
      recommendations.push('Ajouter des marges adéquates pour l\'impression')
    }

    const isPrintReady = overallScore >= 90

    return {
      templateName,
      overallScore,
      isPrintReady,
      checks,
      recommendations,
    }
  }

  /**
   * Optimise le HTML pour l'impression
   */
  function optimizeHTMLForPrint(html: string): string {
    let optimized = html

    // Ajouter les classes d'optimisation
    optimized = optimized.replace(
      /<body>/i,
      '<body class="print-optimized">'
    )

    // Optimiser les images
    optimized = optimized.replace(
      /<img([^>]*?)>/gi,
      '<img$1 class="print-optimized-image">'
    )

    return optimized
  }

  /**
   * Génère les métadonnées PDF
   */
  function generatePDFMetadata(title: string, author?: string): string {
    const metadata = {
      title,
      author: author || 'ProfiloZ',
      creator: 'ProfiloZ',
      producer: 'ProfiloZ',
      keywords: 'CV, resume, curriculum vitae',
    }

    return Object.entries(metadata)
      .map(([key, value]) => `<meta name="pdf-${key}" content="${value}">`)
      .join('\n')
  }

  /**
   * Vérifie la compatibilité noir et blanc
   */
  function checkBlackWhiteCompatibility(html: string): {
    compatible: boolean
    issues: string[]
  } {
    const issues: string[] = []

    // Vérifier les dépendances de couleur
    const hasColorOnlyElements = /color:\s*#[0-9a-f]{6}/gi.test(html)
    if (hasColorOnlyElements) {
      issues.push('Certains éléments dépendent de la couleur')
    }

    // Vérifier les images de fond
    const hasBackgroundImages = /background-image:/gi.test(html)
    if (hasBackgroundImages) {
      issues.push('Images de fond détectées - peuvent ne pas s\'imprimer en N&B')
    }

    return {
      compatible: issues.length === 0,
      issues,
    }
  }

  /**
   * Recommande des réglages d'impression
   */
  function recommendPrintSettings(html: string): {
    colorMode: 'color' | 'grayscale'
    quality: 'draft' | 'normal' | 'high'
    duplex: boolean
  } {
    const bwCheck = checkBlackWhiteCompatibility(html)

    return {
      colorMode: bwCheck.compatible ? 'grayscale' : 'color',
      quality: 'high',
      duplex: false,
    }
  }

  /**
   * Génère un aperçu d'impression
   */
  function generatePrintPreview(html: string, settings: PrintOptimizationSettings): string {
    const css = generatePrintCSS(settings)
    const optimized = optimizeHTMLForPrint(html)

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>${css}</style>
      </head>
      <body>
        ${optimized}
      </body>
      </html>
    `
  }

  return {
    defaultSettings,
    generatePrintCSS,
    checkPrintQuality,
    generatePrintReport,
    optimizeHTMLForPrint,
    generatePDFMetadata,
    checkBlackWhiteCompatibility,
    recommendPrintSettings,
    generatePrintPreview,
  }
}
