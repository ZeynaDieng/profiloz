import type { ResumeSnapshot } from '@profiloz/shared'

export interface PreviewContent {
  personalInfo: {
    fullName: string
    jobTitle: string
    email: string
    phone: string
    location: string
    linkedinUrl: string
    photoUrl?: string
  }
  summary: string
  experiences: Array<{
    position: string
    company: string
    location: string
    startDate: string
    endDate?: string
    isCurrent: boolean
    description: string
  }>
  educations: Array<{
    degree: string
    institution: string
    field: string
    startDate: string
    endDate?: string
  }>
  skills: Array<{ name: string }>
  languages: Array<{ name: string; level: string }>
  interests: Array<{ name: string }>
}

export interface TemplatePreview {
  templateId: string
  templateName: string
  content: ResumeSnapshot
  thumbnail: string
  description: string
  tags: string[]
}

export function useTemplatePreview() {
  /**
   * Contenu fictif réaliste pour les prévisualisations
   */
  const PREVIEW_CONTENTS: Record<string, PreviewContent> = {
    executif: {
      personalInfo: {
        fullName: 'Marie Dupont',
        jobTitle: 'Directrice Marketing',
        email: 'marie.dupont@email.com',
        phone: '+33 6 12 34 56 78',
        location: 'Paris, France',
        linkedinUrl: 'linkedin.com/in/mariedupont',
        photoUrl: undefined, // Placeholder photo
      },
      summary: 'Directrice marketing avec 15 ans d\'expérience dans le développement de stratégies digitales innovantes. Expertise en transformation digitale, gestion d\'équipes et optimisation de la performance commerciale.',
      experiences: [
        {
          position: 'Directrice Marketing',
          company: 'Tech Solutions',
          location: 'Paris',
          startDate: '2020-01',
          isCurrent: true,
          description: 'Pilotage de la stratégie marketing digitale d\'une entreprise de 200 personnes. Gestion d\'un budget de 2M€ et d\'une équipe de 12 personnes. Augmentation du ROI de 40% en 3 ans.',
        },
        {
          position: 'Responsable Marketing Digital',
          company: 'Innovation Corp',
          location: 'Lyon',
          startDate: '2015-06',
          endDate: '2019-12',
          isCurrent: false,
          description: 'Développement et mise en œuvre de campagnes marketing multi-canal. Création d\'une équipe de 5 personnes. Lancement de 3 nouveaux produits avec succès.',
        },
        {
          position: 'Chef de Projet Marketing',
          company: 'Digital Agency',
          location: 'Paris',
          startDate: '2012-03',
          endDate: '2015-05',
          isCurrent: false,
          description: 'Gestion de projets marketing pour des clients internationaux. Coordination des équipes créatives et techniques. Respect des délais et budgets.',
        },
      ],
      educations: [
        {
          degree: 'Master Marketing et Communication',
          institution: 'HEC Paris',
          field: 'Marketing',
          startDate: '2010-09',
          endDate: '2012-06',
        },
        {
          degree: 'Licence Économie-Gestion',
          institution: 'Université Paris Dauphine',
          field: 'Économie',
          startDate: '2007-09',
          endDate: '2010-06',
        },
      ],
      skills: [
        { name: 'Stratégie Marketing' },
        { name: 'Marketing Digital' },
        { name: 'Gestion d\'Équipe' },
        { name: 'SEO/SEA' },
        { name: 'Analytics' },
        { name: 'CRM' },
        { name: 'Social Media' },
        { name: 'Brand Management' },
        { name: 'Budget Management' },
        { name: 'Transformation Digitale' },
      ],
      languages: [
        { name: 'Français', level: 'NATIVE' },
        { name: 'Anglais', level: 'PROFESSIONAL' },
        { name: 'Espagnol', level: 'CONVERSATIONAL' },
      ],
      interests: [
        { name: 'Voyage: Asie et Amérique du Sud' },
        { name: 'Sport: Tennis et Yoga' },
        { name: 'Culture: Art contemporain' },
      ],
    },
    cadre: {
      personalInfo: {
        fullName: 'Jean Martin',
        jobTitle: 'Chef de Projet Senior',
        email: 'jean.martin@email.com',
        phone: '+33 6 98 76 54 32',
        location: 'Lyon, France',
        linkedinUrl: 'linkedin.com/in/jeanmartin',
        photoUrl: undefined,
      },
      summary: 'Chef de projet senior avec 10 ans d\'expérience dans la gestion de projets technologiques complexes. Spécialisé en méthodologies agiles et coordination d\'équipes pluridisciplinaires.',
      experiences: [
        {
          position: 'Chef de Projet Senior',
          company: 'Software Factory',
          location: 'Lyon',
          startDate: '2018-03',
          isCurrent: true,
          description: 'Gestion de projets de développement logiciel pour des clients bancaires. Coordination d\'équipes de 15 personnes. Mise en place de processus Agile et DevOps.',
        },
        {
          position: 'Chef de Projet',
          company: 'Digital Solutions',
          location: 'Paris',
          startDate: '2014-09',
          endDate: '2018-02',
          isCurrent: false,
          description: 'Pilotage de projets web et mobile pour des startups. Gestion des relations clients et suivi budgétaire. Livraison de 20 projets en 4 ans.',
        },
      ],
      educations: [
        {
          degree: 'Master Informatique - Génie Logiciel',
          institution: 'INSA Lyon',
          field: 'Informatique',
          startDate: '2011-09',
          endDate: '2014-06',
        },
      ],
      skills: [
        { name: 'Gestion de Projet' },
        { name: 'Agile/Scrum' },
        { name: 'DevOps' },
        { name: 'Jira' },
        { name: 'Git' },
        { name: 'Communication' },
        { name: 'Budget Management' },
      ],
      languages: [
        { name: 'Français', level: 'NATIVE' },
        { name: 'Anglais', level: 'PROFESSIONAL' },
      ],
      interests: [
        { name: 'Tech: IoT et IA' },
        { name: 'Sport: Course à pied' },
        { name: 'Lecture: Science-fiction' },
      ],
    },
  }

  /**
   * Convertit le contenu de prévisualisation en ResumeSnapshot
   */
  function convertToResumeSnapshot(content: PreviewContent): ResumeSnapshot {
    return {
      personalInfo: content.personalInfo,
      summary: content.summary,
      experiences: content.experiences,
      educations: content.educations,
      skills: content.skills,
      languages: content.languages as any,
      interests: content.interests,
    } as ResumeSnapshot
  }

  /**
   * Génère une prévisualisation pour un template
   */
  function generateTemplatePreview(templateId: string): TemplatePreview | null {
    const content = PREVIEW_CONTENTS[templateId]
    
    if (!content) return null

    const templateNames: Record<string, string> = {
      executif: 'Exécutif',
      cadre: 'Cadre',
    }

    const descriptions: Record<string, string> = {
      executif: 'Template élégant et professionnel pour cadres dirigeants et managers expérimentés.',
      cadre: 'Template moderne et épuré pour cadres et professionnels en progression.',
    }

    const tags: Record<string, string[]> = {
      executif: ['premium', 'élégant', 'cadre', 'direction'],
      cadre: ['moderne', 'épuré', 'professionnel', 'timeline'],
    }

    return {
      templateId,
      templateName: templateNames[templateId] || templateId,
      content: convertToResumeSnapshot(content),
      thumbnail: `/previews/${templateId}.png`,
      description: descriptions[templateId] || '',
      tags: tags[templateId] || [],
    }
  }

  /**
   * Génère toutes les prévisualisations
   */
  function generateAllPreviews(): TemplatePreview[] {
    const previews: TemplatePreview[] = []

    Object.keys(PREVIEW_CONTENTS).forEach((templateId) => {
      const preview = generateTemplatePreview(templateId)
      if (preview) {
        previews.push(preview)
      }
    })

    return previews
  }

  /**
   * Récupère une prévisualisation spécifique
   */
  function getTemplatePreview(templateId: string): TemplatePreview | null {
    return generateTemplatePreview(templateId)
  }

  /**
   * Personnalise le contenu de prévisualisation
   */
  function customizePreviewContent(
    templateId: string,
    customizations: Partial<PreviewContent>
  ): TemplatePreview | null {
    const baseContent = PREVIEW_CONTENTS[templateId]
    
    if (!baseContent) return null

    const customizedContent = {
      ...baseContent,
      ...customizations,
      personalInfo: {
        ...baseContent.personalInfo,
        ...customizations.personalInfo,
      },
    }

    const preview = generateTemplatePreview(templateId)
    
    if (!preview) return null

    return {
      ...preview,
      content: convertToResumeSnapshot(customizedContent),
    }
  }

  /**
   * Génère une miniature HTML pour la galerie
   */
  function generateThumbnailHTML(preview: TemplatePreview): string {
    return `
      <div class="template-thumbnail" data-template="${preview.templateId}">
        <div class="thumbnail-content">
          <h3 class="thumbnail-name">${preview.content.personalInfo?.fullName || 'Nom'}</h3>
          <p class="thumbnail-title">${preview.content.personalInfo?.jobTitle || 'Poste'}</p>
          <div class="thumbnail-excerpt">
            <p>${(preview.content.summary || '').substring(0, 80)}...</p>
          </div>
          <div class="thumbnail-tags">
            ${preview.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
        </div>
        <div class="thumbnail-overlay">
          <button class="btn-preview">Aperçu</button>
          <button class="btn-select">Choisir</button>
        </div>
      </div>
    `
  }

  /**
   * Filtre les prévisualisations par tags
   */
  function filterPreviewsByTag(tag: string): TemplatePreview[] {
    const allPreviews = generateAllPreviews()
    return allPreviews.filter((preview) => preview.tags.includes(tag))
  }

  /**
   * Recherche dans les prévisualisations
   */
  function searchPreviews(query: string): TemplatePreview[] {
    const allPreviews = generateAllPreviews()
    const lowerQuery = query.toLowerCase()

    return allPreviews.filter((preview) => {
      return (
        preview.templateName.toLowerCase().includes(lowerQuery) ||
        preview.description.toLowerCase().includes(lowerQuery) ||
        preview.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
      )
    })
  }

  /**
   * Compare deux prévisualisations
   */
  function comparePreviews(preview1: TemplatePreview, preview2: TemplatePreview): number {
    // Comparaison par nombre d'expériences
    const expDiff = (preview2.content.experiences?.length || 0) - (preview1.content.experiences?.length || 0)
    if (expDiff !== 0) return expDiff

    // Comparaison par nombre de compétences
    const skillDiff = (preview2.content.skills?.length || 0) - (preview1.content.skills?.length || 0)
    return skillDiff
  }

  /**
   * Trie les prévisualisations
   */
  function sortPreviews(previews: TemplatePreview[], sortBy: 'name' | 'experiences' | 'skills'): TemplatePreview[] {
    const sorted = [...previews]

    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => a.templateName.localeCompare(b.templateName))
      case 'experiences':
        return sorted.sort((a, b) => comparePreviews(a, b))
      case 'skills':
        return sorted.sort((a, b) => (b.content.skills?.length || 0) - (a.content.skills?.length || 0))
      default:
        return sorted
    }
  }

  return {
    PREVIEW_CONTENTS,
    convertToResumeSnapshot,
    generateTemplatePreview,
    generateAllPreviews,
    getTemplatePreview,
    customizePreviewContent,
    generateThumbnailHTML,
    filterPreviewsByTag,
    searchPreviews,
    comparePreviews,
    sortPreviews,
  }
}
