import { TEMPLATE_CATALOG, templateComponentName, type TemplateSlug } from '@profiloz/shared'
import type { Component } from 'vue'
import TemplateProfessionnel from '~/components/resume/templates/TemplateProfessionnel.vue'

// Chaque modèle du catalogue est résolu par son nom de fichier : Template<Composant>.vue
const MODULES = import.meta.glob<Component>('../../components/resume/templates/Template*.vue', {
  eager: true,
  import: 'default',
})

const COMPONENTS_BY_NAME = new Map<string, Component>(
  Object.entries(MODULES).map(([path, component]) => [path.split('/').pop()!.replace(/\.vue$/, ''), component]),
)

const TEMPLATE_COMPONENTS = Object.fromEntries(
  TEMPLATE_CATALOG.map((t) => [t.slug, COMPONENTS_BY_NAME.get(templateComponentName(t))]),
) as Partial<Record<TemplateSlug, Component>>

if (import.meta.dev) {
  for (const t of TEMPLATE_CATALOG) {
    if (!TEMPLATE_COMPONENTS[t.slug]) {
      console.error(`[templates] Composant ${templateComponentName(t)}.vue introuvable pour le modèle ${t.slug}`)
    }
  }
}

export function resolveTemplateComponent(slug: TemplateSlug): Component {
  return TEMPLATE_COMPONENTS[slug] ?? TemplateProfessionnel
}
