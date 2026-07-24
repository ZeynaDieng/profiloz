import type { TemplateDefinition, TemplateSlug } from '@profiloz/shared'

export const TEMPLATE_REGISTRY: TemplateDefinition[] = [
  { slug: 'ETUDIANT', name: 'Étudiant', category: 'Entry-level', previewUrl: '/templates/etudiant.svg', supportedSections: ['education', 'skills'] },
  { slug: 'PROFESSIONNEL', name: 'Professionnel', category: 'Corporate', previewUrl: '/templates/professionnel.svg', supportedSections: ['summary', 'experience', 'education'] },
  { slug: 'MODERNE', name: 'Moderne', category: 'Creative', previewUrl: '/templates/moderne.svg', supportedSections: ['summary', 'experience', 'education', 'skills'] },
  { slug: 'DEVELOPPEUR', name: 'Développeur', category: 'Technical', previewUrl: '/templates/developpeur.svg', supportedSections: ['skills', 'experience', 'education'] },
  { slug: 'COMMERCIAL', name: 'Commercial', category: 'Sales', previewUrl: '/templates/commercial.svg', supportedSections: ['experience', 'education', 'skills', 'languages', 'certifications'] },
  { slug: 'MANAGER', name: 'Manager', category: 'Executive', previewUrl: '/templates/manager.svg', supportedSections: ['summary', 'experience', 'education', 'skills', 'languages', 'interests', 'certifications'] },
  { slug: 'INTERNATIONAL', name: 'International', category: 'Global', previewUrl: '/templates/international.svg', supportedSections: ['languages', 'experience', 'education'] },
  { slug: 'MINIMALISTE', name: 'Minimaliste', category: 'Clean', previewUrl: '/templates/minimaliste.svg', supportedSections: ['experience', 'education'] },
  { slug: 'CREATIF', name: 'Créatif', category: 'Artistic', previewUrl: '/templates/creatif.svg', supportedSections: ['skills', 'experience', 'education', 'interests'] },
  { slug: 'PREMIUM', name: 'Premium', category: 'Exclusive', previewUrl: '/templates/premium.svg', supportedSections: ['summary', 'experience', 'education', 'skills'] },
  { slug: 'CADRE', name: 'Cadre', category: 'Corporate', previewUrl: '/templates/cadre.svg', supportedSections: ['experience', 'education', 'skills', 'languages', 'interests'] },
  { slug: 'EXECUTIF', name: 'Exécutif', category: 'Sales', previewUrl: '/templates/executif.svg', supportedSections: ['summary', 'experience', 'education', 'skills', 'languages', 'interests'] },
  { slug: 'EPURE', name: 'Épuré', category: 'Clean', previewUrl: '/templates/epure.svg', supportedSections: ['summary', 'experience', 'education', 'skills', 'contact'] },
  { slug: 'TECH_LEAD', name: 'Tech Lead', category: 'Technical', previewUrl: '/templates/tech_lead.svg', supportedSections: ['summary', 'experience', 'education', 'skills'] },
  { slug: 'ELEGANCE', name: 'Élégance', category: 'Exclusive', previewUrl: '/templates/elegance.svg', supportedSections: ['summary', 'experience', 'education', 'skills'] },
  { slug: 'IMPACT', name: 'Impact', category: 'Creative', previewUrl: '/templates/impact.svg', supportedSections: ['summary', 'experience', 'education', 'skills'] },
  { slug: 'CABINET', name: 'Cabinet', category: 'Corporate', previewUrl: '/templates/cabinet.svg', supportedSections: ['experience', 'education', 'skills'] },
  { slug: 'ACADEMIQUE', name: 'Académique', category: 'Clean', previewUrl: '/templates/academique.svg', supportedSections: ['experience', 'education', 'skills'] },
  { slug: 'ATELIER', name: 'Atelier', category: 'Clean', previewUrl: '/templates/atelier.svg', supportedSections: ['experience', 'education', 'skills'] },
  { slug: 'CLINIQUE', name: 'Clinique', category: 'Corporate', previewUrl: '/templates/clinique.svg', supportedSections: ['experience', 'education', 'skills'] },
  { slug: 'DUOTONE', name: 'DuoTone', category: 'Creative', previewUrl: '/templates/duotone.svg', supportedSections: ['summary', 'experience', 'education', 'skills'] },
  { slug: 'CHRONOS', name: 'Chronos', category: 'Clean', previewUrl: '/templates/chronos.svg', supportedSections: ['experience', 'education', 'skills'] },
  { slug: 'ATS_FRIENDLY', name: 'ATS Friendly', category: 'Clean', previewUrl: '/templates/ats_friendly.svg', supportedSections: ['experience', 'education', 'skills'] },
]

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
