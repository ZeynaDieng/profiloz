/**
 * Catalogue des modèles de CV : source unique de vérité.
 *
 * Ajouter un modèle = ajouter une entrée ici + créer
 * `apps/web/components/resume/templates/Template<Composant>.vue`,
 * puis relancer `pnpm db:seed`. Le reste (slugs, validation, galerie,
 * éditeur, couleurs, seed) est dérivé de ce tableau.
 */

export type TemplateSection =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'languages'
  | 'interests'
  | 'certifications'
  | 'contact'

export interface TemplateCatalogEntry {
  slug: string
  name: string
  /** Libellé dans le sélecteur de l'éditeur, s'il diffère de `name`. */
  editorName?: string
  category: string
  /** Phrase courte affichée dans l'éditeur. */
  description: string
  /** Couleur principale par défaut et fond des aperçus. */
  accent: string
  canvas: string
  sections: readonly TemplateSection[]
  /** Suffixe du fichier `Template<component>.vue` ; par défaut, le slug en PascalCase. */
  component?: string
  /** Emplacement photo affiché par défaut, même sans photo. */
  photoSlot?: boolean
}

const DEFAULT_ACCENT = '#0051d5'
const DEFAULT_CANVAS = '#eff4ff'

export const TEMPLATE_CATALOG = [
  { slug: 'ETUDIANT', name: 'Étudiant', category: 'Entry-level', description: 'Mise en valeur des formations', accent: '#059669', canvas: '#ecfdf5', sections: ['education', 'skills'] },
  { slug: 'PROFESSIONNEL', name: 'Professionnel', category: 'Corporate', description: 'Structure rigoureuse et intemporelle', accent: '#0051d5', canvas: '#eff4ff', sections: ['summary', 'experience', 'education'], photoSlot: true },
  { slug: 'MODERNE', name: 'Moderne', category: 'Creative', description: 'Design épuré et contemporain', accent: '#009485', canvas: '#f0fdfa', sections: ['summary', 'experience', 'education', 'skills'], photoSlot: true },
  { slug: 'DEVELOPPEUR', name: 'Développeur', category: 'Technical', description: 'Axé compétences et projets', accent: '#ea580c', canvas: '#fff7ed', sections: ['skills', 'experience', 'education'] },
  { slug: 'COMMERCIAL', name: 'Commercial', category: 'Sales', description: 'Dynamique et orienté résultats', accent: '#1b2a47', canvas: '#f0f4f8', sections: ['experience', 'education', 'skills', 'languages', 'certifications'] },
  { slug: 'MANAGER', name: 'Manager', editorName: 'Executive', category: 'Executive', description: 'Élégant pour cadres et responsables', accent: '#1e293b', canvas: '#f8fafc', sections: ['summary', 'experience', 'education', 'skills', 'languages', 'interests', 'certifications'] },
  { slug: 'INTERNATIONAL', name: 'International', category: 'Global', description: 'Format standard bilingue', accent: '#0891b2', canvas: '#ecfeff', sections: ['languages', 'experience', 'education'], photoSlot: true },
  { slug: 'MINIMALISTE', name: 'Minimaliste', category: 'Clean', description: 'Clarté et sobriété absolue', accent: '#64748b', canvas: '#f1f5f9', sections: ['experience', 'education'] },
  { slug: 'CREATIF', name: 'Créatif', category: 'Artistic', description: 'Layout artistique et audacieux', accent: '#7c3aed', canvas: '#f5f3ff', sections: ['skills', 'experience', 'education', 'interests'], photoSlot: true },
  { slug: 'PREMIUM', name: 'Premium', category: 'Exclusive', description: 'Esthétique luxueuse et soignée', accent: '#4f46e5', canvas: '#eef2ff', sections: ['summary', 'experience', 'education', 'skills'] },
  { slug: 'CADRE', name: 'Cadre', category: 'Corporate', description: 'Idéal pour managers et dirigeants', accent: '#1a3050', canvas: '#e8eef5', sections: ['experience', 'education', 'skills', 'languages', 'interests'], photoSlot: true },
  { slug: 'EXECUTIF', name: 'Exécutif', category: 'Sales', description: 'Structure haut de gamme et sobre', accent: '#2c3e50', canvas: '#eef1f4', sections: ['summary', 'experience', 'education', 'skills', 'languages', 'interests'], photoSlot: true },
  { slug: 'EPURE', name: 'Épuré', category: 'Clean', description: 'Design aéré et moderne', accent: '#0d9488', canvas: '#f0fdfa', sections: ['summary', 'experience', 'education', 'skills', 'contact'], component: 'Sidebar' },
  { slug: 'TECH_LEAD', name: 'Tech Lead', category: 'Technical', description: 'Parfait pour les profils techniques', accent: DEFAULT_ACCENT, canvas: DEFAULT_CANVAS, sections: ['summary', 'experience', 'education', 'skills'] },
  { slug: 'ELEGANCE', name: 'Élégance', category: 'Exclusive', description: 'Design minimaliste chic', accent: DEFAULT_ACCENT, canvas: DEFAULT_CANVAS, sections: ['summary', 'experience', 'education', 'skills'] },
  { slug: 'IMPACT', name: 'Impact', category: 'Creative', description: 'Idéal pour le marketing et la comm', accent: DEFAULT_ACCENT, canvas: DEFAULT_CANVAS, sections: ['summary', 'experience', 'education', 'skills'] },
  { slug: 'CABINET', name: 'Cabinet', category: 'Corporate', description: 'Style classique pour droit et finance', accent: DEFAULT_ACCENT, canvas: DEFAULT_CANVAS, sections: ['experience', 'education', 'skills'] },
  { slug: 'ACADEMIQUE', name: 'Académique', category: 'Clean', description: 'Enseignement et recherche', accent: DEFAULT_ACCENT, canvas: DEFAULT_CANVAS, sections: ['experience', 'education', 'skills'] },
  { slug: 'ATELIER', name: 'Atelier', category: 'Clean', description: 'Style chaleureux pour créatifs', accent: DEFAULT_ACCENT, canvas: DEFAULT_CANVAS, sections: ['experience', 'education', 'skills'] },
  { slug: 'CLINIQUE', name: 'Clinique', category: 'Corporate', description: 'Médical, santé et soin', accent: DEFAULT_ACCENT, canvas: DEFAULT_CANVAS, sections: ['experience', 'education', 'skills'] },
  { slug: 'DUOTONE', name: 'DuoTone', category: 'Creative', description: 'Style bicolore contemporain', accent: DEFAULT_ACCENT, canvas: DEFAULT_CANVAS, sections: ['summary', 'experience', 'education', 'skills'] },
  { slug: 'CHRONOS', name: 'Chronos', category: 'Clean', description: 'Présentation avec timeline', accent: DEFAULT_ACCENT, canvas: DEFAULT_CANVAS, sections: ['experience', 'education', 'skills'] },
  { slug: 'ATS_FRIENDLY', name: 'ATS Friendly', category: 'Clean', description: 'Optimisé pour les filtres robots', accent: DEFAULT_ACCENT, canvas: DEFAULT_CANVAS, sections: ['experience', 'education', 'skills'] },
  { slug: 'LAGUNE', name: 'Lagune', category: 'Creative', description: 'Colonne turquoise avec photo ronde', accent: '#17abb3', canvas: '#f3fbfb', sections: ['summary', 'experience', 'education', 'skills', 'languages', 'interests'] },
  { slug: 'BANDEAU', name: 'Bandeau', category: 'Corporate', description: 'Bandeau coloré avec photo, barre latérale à droite', accent: '#303846', canvas: '#eef0f3', sections: ['summary', 'experience', 'education', 'skills', 'languages', 'interests', 'certifications'] },
  { slug: 'VERTICAL', name: 'Vertical', category: 'Creative', description: 'Liseré prune, colonne claire avec photo et niveaux en points', accent: '#821f61', canvas: '#f9f4f7', sections: ['summary', 'experience', 'education', 'skills', 'languages', 'interests'] },
  { slug: 'BLEU', name: 'Bleu', category: 'Corporate', description: 'Bandes bleues haut et bas, colonne claire avec photo', accent: '#2f43a1', canvas: '#f5f6fa', sections: ['summary', 'experience', 'education', 'skills', 'languages', 'interests'] },
  { slug: 'TURQUOISE', name: 'Turquoise', category: 'Creative', description: 'Carte d’en-tête encadrée, colonne sombre avec barres de niveau', accent: '#138f9e', canvas: '#e7f4f5', sections: ['summary', 'experience', 'education', 'skills', 'languages', 'interests'] },
  { slug: 'ARDOISE', name: 'Ardoise', category: 'Corporate', description: 'Colonne ardoise avec photo ronde, dates à gauche des expériences', accent: '#303745', canvas: '#eceef1', sections: ['summary', 'experience', 'education', 'skills', 'languages', 'interests'] },
] as const satisfies readonly TemplateCatalogEntry[]

export type TemplateSlug = (typeof TEMPLATE_CATALOG)[number]['slug']

/** Tuple non vide, utilisable tel quel par `z.enum`. */
export const TEMPLATE_SLUGS = TEMPLATE_CATALOG.map((t) => t.slug) as unknown as readonly [TemplateSlug, ...TemplateSlug[]]

const CATALOG_BY_SLUG = new Map<string, TemplateCatalogEntry>(TEMPLATE_CATALOG.map((t) => [t.slug, t]))

export function getTemplateCatalogEntry(slug: TemplateSlug): TemplateCatalogEntry {
  return CATALOG_BY_SLUG.get(slug) ?? CATALOG_BY_SLUG.get('PROFESSIONNEL')!
}

export function isTemplateSlug(value: unknown): value is TemplateSlug {
  return typeof value === 'string' && CATALOG_BY_SLUG.has(value)
}

/** Nom du composant Vue : `component` explicite, sinon slug en PascalCase (TECH_LEAD → TechLead). */
export function templateComponentName(entry: TemplateCatalogEntry): string {
  const suffix =
    entry.component ??
    entry.slug
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('')
  return `Template${suffix}`
}
