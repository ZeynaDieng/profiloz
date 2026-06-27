import type { ResumeSnapshot } from '@profiloz/shared'
import type { ColorTheme } from './useResumeCustomization'

export interface CoverLetterTemplate {
  id: string
  name: string
  associatedResumeTemplate: string
  description: string
  theme: ColorTheme
  layout: 'classic' | 'modern' | 'minimal'
}

export interface CoverLetterContent {
  senderName: string
  senderAddress: string
  senderPhone: string
  senderEmail: string
  recipientName: string
  recipientCompany: string
  recipientAddress: string
  date: string
  subject: string
  salutation: string
  body: string
  closing: string
  signature: string
}

export interface CoverLetterMatch {
  resumeTemplate: string
  coverLetterTemplate: string
  matchScore: number
  reason: string
}

export function useCoverLetterSystem() {
  /**
   * Templates de lettres de motivation associés aux templates de CV
   */
  const COVER_LETTER_TEMPLATES: CoverLetterTemplate[] = [
    {
      id: 'executif-letter',
      name: 'Lettre Exécutive',
      associatedResumeTemplate: 'executif',
      description: 'Lettre de motivation élégante et professionnelle pour cadres dirigeants',
      theme: {
        name: 'Exécutif',
        primary: '#1a2332',
        secondary: '#2d3748',
        accent: '#6366f1',
        background: '#ffffff',
        text: '#1e293b',
        muted: '#64748b',
      },
      layout: 'classic',
    },
    {
      id: 'cadre-letter',
      name: 'Lettre Cadre',
      associatedResumeTemplate: 'cadre',
      description: 'Lettre de motivation moderne et professionnelle pour cadres',
      theme: {
        name: 'Cadre',
        primary: '#1e3a5f',
        secondary: '#2c5282',
        accent: '#3182ce',
        background: '#f8fafc',
        text: '#1e293b',
        muted: '#64748b',
      },
      layout: 'modern',
    },
  ]

  /**
   * Trouve la lettre de motivation associée à un template de CV
   */
  function findMatchingCoverLetter(resumeTemplateId: string): CoverLetterTemplate | null {
    return (
      COVER_LETTER_TEMPLATES.find(
        (letter) => letter.associatedResumeTemplate === resumeTemplateId
      ) || null
    )
  }

  /**
   * Génère le contenu de la lettre à partir du CV
   */
  function generateCoverLetterContent(resume: ResumeSnapshot): Partial<CoverLetterContent> {
    const personalInfo = resume.personalInfo || {}

    return {
      senderName: personalInfo.fullName || '',
      senderAddress: personalInfo.location || '',
      senderPhone: personalInfo.phone || '',
      senderEmail: personalInfo.email || '',
      recipientName: '', // À remplir par l'utilisateur
      recipientCompany: '', // À remplir par l'utilisateur
      recipientAddress: '', // À remplir par l'utilisateur
      date: new Date().toLocaleDateString('fr-FR'),
      subject: 'Candidature pour le poste de...',
      salutation: 'Madame, Monsieur,',
      body: generateDefaultBody(resume),
      closing: 'Je vous prie d\'agréer, Madame, Monsieur, l\'expression de mes salutations distinguées.',
      signature: personalInfo.fullName || '',
    }
  }

  /**
   * Génère un corps de lettre par défaut basé sur le CV
   */
  function generateDefaultBody(resume: ResumeSnapshot): string {
    const personalInfo = resume.personalInfo || {}
    const latestExperience = resume.experiences?.[0]
    const latestEducation = resume.educations?.[0]

    let body = ''

    // Introduction
    body += `Je vous adresse ma candidature pour le poste de ${latestExperience?.position || '...'}. `
    body += `Fort de ${resume.experiences?.length || 0} années d'expérience, je souhaite mettre mes compétences au service de votre entreprise.\n\n`

    // Expérience
    if (latestExperience) {
      body += `Actuellement ${latestExperience.position} chez ${latestExperience.company || '...'}. `
      body += `J'ai acquis une expertise solide dans ${latestExperience.description?.substring(0, 100) || 'ce domaine'}.\n\n`
    }

    // Formation
    if (latestEducation) {
      body += `Diplômé de ${latestEducation.degree || '...'} `
      body += `à ${latestEducation.institution || '...'}, je dispose des qualifications requises pour ce poste.\n\n`
    }

    // Motivation
    body += `Votre entreprise m'intéresse particulièrement car ${resume.summary?.substring(0, 100) || '...'}. `
    body += `Je suis convaincu(e) que mon profil correspond parfaitement à vos attentes.\n\n`

    // Conclusion
    body += `Je serais ravi(e) de vous présenter mon parcours et mes motivations lors d'un entretien.`

    return body
  }

  /**
   * Calcule le score de correspondance entre CV et lettre
   */
  function calculateMatchScore(
    resumeTemplate: string,
    coverLetterTemplate: string
  ): CoverLetterMatch {
    const letter = COVER_LETTER_TEMPLATES.find((l) => l.id === coverLetterTemplate)
    
    if (!letter) {
      return {
        resumeTemplate,
        coverLetterTemplate,
        matchScore: 0,
        reason: 'Template de lettre non trouvé',
      }
    }

    if (letter.associatedResumeTemplate === resumeTemplate) {
      return {
        resumeTemplate,
        coverLetterTemplate,
        matchScore: 100,
        reason: 'Correspondance parfaite - lettre spécialement conçue pour ce template',
      }
    }

    // Correspondance partielle basée sur le style
    const styleMatch = letter.layout === 'classic' ? 70 : 85

    return {
      resumeTemplate,
      coverLetterTemplate,
      matchScore: styleMatch,
      reason: 'Correspondance partielle - styles compatibles',
    }
  }

  /**
   * Recommande une lettre de motivation pour un template de CV
   */
  function recommendCoverLetter(resumeTemplateId: string): CoverLetterTemplate | null {
    return findMatchingCoverLetter(resumeTemplateId)
  }

  /**
   * Liste toutes les lettres de motivation disponibles
   */
  function listAllCoverLetters(): CoverLetterTemplate[] {
    return COVER_LETTER_TEMPLATES
  }

  /**
   * Liste les correspondances CV/Lettre
   */
  function listCoverLetterMatches(): CoverLetterMatch[] {
    const matches: CoverLetterMatch[] = []

    COVER_LETTER_TEMPLATES.forEach((letter) => {
      const match = calculateMatchScore(letter.associatedResumeTemplate, letter.id)
      matches.push(match)
    })

    return matches
  }

  /**
   * Valide le contenu d'une lettre de motivation
   */
  function validateCoverLetterContent(content: Partial<CoverLetterContent>): {
    valid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    if (!content.senderName) errors.push('Nom de l\'expéditeur manquant')
    if (!content.senderEmail) errors.push('Email de l\'expéditeur manquant')
    if (!content.recipientName) warnings.push('Nom du destinataire non renseigné')
    if (!content.recipientCompany) warnings.push('Entreprise du destinataire non renseignée')
    if (!content.subject) warnings.push('Objet de la lettre non renseigné')
    if (!content.body || content.body.length < 100) warnings.push('Corps de la lettre trop court')

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Génère les variables CSS pour une lettre de motivation
   */
  function generateCoverLetterCSSVariables(theme: ColorTheme): Record<string, string> {
    return {
      '--letter-primary': theme.primary,
      '--letter-secondary': theme.secondary,
      '--letter-accent': theme.accent,
      '--letter-background': theme.background,
      '--letter-text': theme.text,
      '--letter-muted': theme.muted,
    }
  }

  /**
   * Synchronise le thème entre CV et lettre
   */
  function syncThemeWithResume(
    resumeTemplateId: string,
    resumeTheme: ColorTheme
  ): ColorTheme | null {
    const letter = findMatchingCoverLetter(resumeTemplateId)
    
    if (!letter) return null

    // Par défaut, utiliser le thème de la lettre
    // Mais permettre de synchroniser avec le CV si nécessaire
    return resumeTheme
  }

  /**
   * Exporte le contenu de la lettre
   */
  function exportCoverLetterContent(content: CoverLetterContent): string {
    return JSON.stringify(content, null, 2)
  }

  /**
   * Importe le contenu de la lettre
   */
  function importCoverLetterContent(json: string): CoverLetterContent | null {
    try {
      return JSON.parse(json)
    } catch (error) {
      console.error('Failed to parse cover letter content:', error)
      return null
    }
  }

  return {
    COVER_LETTER_TEMPLATES,
    findMatchingCoverLetter,
    generateCoverLetterContent,
    generateDefaultBody,
    calculateMatchScore,
    recommendCoverLetter,
    listAllCoverLetters,
    listCoverLetterMatches,
    validateCoverLetterContent,
    generateCoverLetterCSSVariables,
    syncThemeWithResume,
    exportCoverLetterContent,
    importCoverLetterContent,
  }
}
