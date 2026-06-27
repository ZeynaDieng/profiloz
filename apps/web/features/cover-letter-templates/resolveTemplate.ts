import type { CoverLetterTemplateSlug } from '~/types/cover-letter'
import type { Component } from 'vue'
import TemplateAccent from '~/components/cover-letter/templates/TemplateAccent.vue'
import TemplateClassique from '~/components/cover-letter/templates/TemplateClassique.vue'
import TemplateCreatif from '~/components/cover-letter/templates/TemplateCreatif.vue'
import TemplateModerne from '~/components/cover-letter/templates/TemplateModerne.vue'
import TemplateProfessionnel from '~/components/cover-letter/templates/TemplateProfessionnel.vue'

const TEMPLATE_COMPONENTS: Record<CoverLetterTemplateSlug, Component> = {
  CLASSIQUE: TemplateClassique,
  MODERNE: TemplateModerne,
  ACCENT: TemplateAccent,
  PROFESSIONNEL: TemplateProfessionnel,
  CREATIF: TemplateCreatif,
}

export function resolveCoverLetterTemplateComponent(slug: CoverLetterTemplateSlug): Component {
  return TEMPLATE_COMPONENTS[slug] ?? TemplateClassique
}
