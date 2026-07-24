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
  {
    slug: 'TECH_LEAD',
    name: 'Tech Lead',
    category: 'Technical',
    description: 'Style monospace sombre moderne adapté aux profils technologiques.',
  },
  {
    slug: 'ELEGANCE',
    name: 'Élégance',
    category: 'Distinctif',
    description: 'Style épuré avec typographie serif haut de gamme pour postes de prestige.',
  },
  {
    slug: 'IMPACT',
    name: 'Impact',
    category: 'Créatif',
    description: 'Souligné par une couleur accent et des blocs modernes structurés.',
  },
  {
    slug: 'CABINET',
    name: 'Cabinet',
    category: 'Corporate',
    description: 'Gabarit ultra-formel classique idéal pour le conseil, droit et finance.',
  },
  {
    slug: 'ACADEMIQUE',
    name: 'Académique',
    category: 'Professionnel',
    description: 'Mise en page classique à une colonne centrée pour la recherche ou l\'enseignement.',
  },
  {
    slug: 'ATELIER',
    name: 'Atelier',
    category: 'Créatif',
    description: 'Teintes chaudes naturelles et marges aérées pour artistes et créateurs.',
  },
  {
    slug: 'CLINIQUE',
    name: 'Clinique',
    category: 'Professionnel',
    description: 'Design soigné et rassurant dans les tons bleus/verts médicaux.',
  },
  {
    slug: 'DUOTONE',
    name: 'DuoTone',
    category: 'Créatif',
    description: 'Mise en page bicolore asymétrique très visuelle pour la communication.',
  },
  {
    slug: 'CHRONOS',
    name: 'Chronos',
    category: 'Professionnel',
    description: 'Design minimaliste et propre parfait pour la gestion de projet.',
  },
  {
    slug: 'ATS_FRIENDLY',
    name: 'ATS Friendly',
    category: 'Professionnel',
    description: 'Structure brute optimisée à 100% pour la lecture par robots recruteurs.',
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
