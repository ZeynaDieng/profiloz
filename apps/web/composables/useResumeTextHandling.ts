/**
 * Gestion intelligente des textes longs dans les templates de CV
 */

export interface TextHandlingOptions {
  maxLength?: number
  truncate?: boolean
  truncateSuffix?: string
  wrap?: boolean
  compact?: boolean
}

export function useResumeTextHandling() {
  /**
   * Tronque un texte si nécessaire
   */
  function truncateText(text: string, maxLength: number, suffix = '...'): string {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength - suffix.length) + suffix
  }

  /**
   * Formate un intitulé de poste potentiellement long
   */
  function formatPositionTitle(title: string, options: TextHandlingOptions = {}): string {
    const { maxLength = 45, truncate = false, truncateSuffix = '...' } = options

    if (!title) return ''
    if (title.length <= maxLength) return title

    if (truncate) {
      return truncateText(title, maxLength, truncateSuffix)
    }

    // Sinon, retourne le texte complet (le CSS gérera le wrapping)
    return title
  }

  /**
   * Formate un nom d'entreprise potentiellement long
   */
  function formatCompanyName(company: string, options: TextHandlingOptions = {}): string {
    const { maxLength = 35, truncate = false, truncateSuffix = '...' } = options

    if (!company) return ''
    if (company.length <= maxLength) return company

    if (truncate) {
      return truncateText(company, maxLength, truncateSuffix)
    }

    return company
  }

  /**
   * Formate un nom de compétence potentiellement long
   */
  function formatSkillName(skill: string, options: TextHandlingOptions = {}): string {
    const { maxLength = 25, truncate = false, truncateSuffix = '...' } = options

    if (!skill) return ''
    if (skill.length <= maxLength) return skill

    if (truncate) {
      return truncateText(skill, maxLength, truncateSuffix)
    }

    return skill
  }

  /**
   * Formate un diplôme potentiellement long
   */
  function formatDegree(degree: string, options: TextHandlingOptions = {}): string {
    const { maxLength = 50, truncate = false, truncateSuffix = '...' } = options

    if (!degree) return ''
    if (degree.length <= maxLength) return degree

    if (truncate) {
      return truncateText(degree, maxLength, truncateSuffix)
    }

    return degree
  }

  /**
   * Formate un nom d'établissement potentiellement long
   */
  function formatInstitution(institution: string, options: TextHandlingOptions = {}): string {
    const { maxLength = 40, truncate = false, truncateSuffix = '...' } = options

    if (!institution) return ''
    if (institution.length <= maxLength) return institution

    if (truncate) {
      return truncateText(institution, maxLength, truncateSuffix)
    }

    return institution
  }

  /**
   * Divise un texte long en plusieurs lignes intelligemment
   */
  function smartWrap(text: string, maxLineLength: number): string[] {
    if (!text) return []
    if (text.length <= maxLineLength) return [text]

    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''

    for (const word of words) {
      if ((currentLine + ' ' + word).length <= maxLineLength) {
        currentLine = currentLine ? currentLine + ' ' + word : word
      } else {
        if (currentLine) lines.push(currentLine)
        currentLine = word.length > maxLineLength ? word.slice(0, maxLineLength) + '...' : word
      }
    }

    if (currentLine) lines.push(currentLine)

    return lines
  }

  /**
   * Détecte si un texte nécessite un traitement spécial
   */
  function needsSpecialHandling(text: string, threshold = 30): boolean {
    return text.length > threshold
  }

  /**
   * Génère des classes CSS pour gérer les textes longs
   */
  function getTextClasses(text: string, baseClass: string = ''): string {
    const classes = [baseClass]

    if (text.length > 40) {
      classes.push('text-wrap-break')
    }
    if (text.length > 50) {
      classes.push('text-compact')
    }

    return classes.join(' ')
  }

  return {
    truncateText,
    formatPositionTitle,
    formatCompanyName,
    formatSkillName,
    formatDegree,
    formatInstitution,
    smartWrap,
    needsSpecialHandling,
    getTextClasses,
  }
}
