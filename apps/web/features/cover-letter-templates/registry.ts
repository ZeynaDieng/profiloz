import type { CoverLetterTemplateDefinition, CoverLetterTemplateSlug } from '~/types/cover-letter'

export const COVER_LETTER_TEMPLATE_REGISTRY: CoverLetterTemplateDefinition[] = [
  {
    slug: 'CLASSIQUE',
    name: 'Classique',
    category: 'Corporate',
    description: 'Lettre élégante au format traditionnel, idéale pour tous secteurs.',
  },
  {
    slug: 'MODERNE',
    name: 'Moderne',
    category: 'Professionnel',
    description: 'Mise en page claire et contemporaine avec une touche d’accent.',
  },
  {
    slug: 'ACCENT',
    name: 'Accent',
    category: 'Distinctif',
    description: 'Bandeau coloré et typographie soignée pour se démarquer.',
  },
  {
    slug: 'PROFESSIONNEL',
    name: 'Professionnel',
    category: 'Corporate',
    description: 'Structure rigoureuse adaptée aux candidatures formelles.',
  },
  {
    slug: 'CREATIF',
    name: 'Créatif',
    category: 'Créatif',
    description: 'Design original tout en restant lisible et professionnel.',
  },
]

export const COVER_LETTER_TEMPLATE_FILTERS = [
  { id: 'all', label: 'Tous les modèles' },
  { id: 'Corporate', label: 'Corporate' },
  { id: 'Professionnel', label: 'Professionnel' },
  { id: 'Créatif', label: 'Créatif' },
]

export function getCoverLetterTemplateBySlug(slug: CoverLetterTemplateSlug) {
  return COVER_LETTER_TEMPLATE_REGISTRY.find((t) => t.slug === slug)
}

export const DEFAULT_LETTER_CONTENT = `Je me permets de vous adresser ma candidature pour le poste mentionné ci-dessus.

Fort(e) de mon expérience et de ma motivation, je serais ravi(e) de contribuer aux objectifs de votre entreprise.

Je reste à votre disposition pour un entretien afin d'échanger sur ma candidature.`
