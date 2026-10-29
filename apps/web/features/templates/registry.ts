import { TEMPLATE_CATALOG, type TemplateDefinition, type TemplateSlug } from '@profiloz/shared'

export const TEMPLATE_REGISTRY: TemplateDefinition[] = TEMPLATE_CATALOG.map((t) => ({
  slug: t.slug,
  name: t.name,
  category: t.category,
  description: t.description,
  previewUrl: `/templates/${t.slug.toLowerCase()}.svg`,
  supportedSections: [...t.sections],
}))

export const TEMPLATE_FILTERS = [
  { id: 'all', label: 'Tous les modèles' },
  { id: 'Corporate', label: 'Professionnel' },
  { id: 'Creative', label: 'Créatif' },
  { id: 'Entry-level', label: 'Débutant' },
  { id: 'Technical', label: 'Technique' },
]

export function getTemplateBySlug(slug: TemplateSlug) {
  return TEMPLATE_REGISTRY.find((t) => t.slug === slug)
}
