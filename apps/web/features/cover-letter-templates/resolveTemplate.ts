import type { CoverLetterTemplateSlug } from '~/types/cover-letter'
import type { Component } from 'vue'
import TemplateAccent from '~/components/cover-letter/templates/TemplateAccent.vue'
import TemplateClassique from '~/components/cover-letter/templates/TemplateClassique.vue'
import TemplateCreatif from '~/components/cover-letter/templates/TemplateCreatif.vue'
import TemplateModerne from '~/components/cover-letter/templates/TemplateModerne.vue'
import TemplateProfessionnel from '~/components/cover-letter/templates/TemplateProfessionnel.vue'
import TemplateTechLead from '~/components/cover-letter/templates/TemplateTechLead.vue'
import TemplateElegance from '~/components/cover-letter/templates/TemplateElegance.vue'
import TemplateImpact from '~/components/cover-letter/templates/TemplateImpact.vue'
import TemplateCabinet from '~/components/cover-letter/templates/TemplateCabinet.vue'
import TemplateAcademique from '~/components/cover-letter/templates/TemplateAcademique.vue'
import TemplateAtelier from '~/components/cover-letter/templates/TemplateAtelier.vue'
import TemplateClinique from '~/components/cover-letter/templates/TemplateClinique.vue'
import TemplateDuotone from '~/components/cover-letter/templates/TemplateDuotone.vue'
import TemplateChronos from '~/components/cover-letter/templates/TemplateChronos.vue'
import TemplateAtsFriendly from '~/components/cover-letter/templates/TemplateAtsFriendly.vue'

const TEMPLATE_COMPONENTS: Record<CoverLetterTemplateSlug, Component> = {
  CLASSIQUE: TemplateClassique,
  MODERNE: TemplateModerne,
  ACCENT: TemplateAccent,
  PROFESSIONNEL: TemplateProfessionnel,
  CREATIF: TemplateCreatif,
  TECH_LEAD: TemplateTechLead,
  ELEGANCE: TemplateElegance,
  IMPACT: TemplateImpact,
  CABINET: TemplateCabinet,
  ACADEMIQUE: TemplateAcademique,
  ATELIER: TemplateAtelier,
  CLINIQUE: TemplateClinique,
  DUOTONE: TemplateDuotone,
  CHRONOS: TemplateChronos,
  ATS_FRIENDLY: TemplateAtsFriendly,
}

export function resolveCoverLetterTemplateComponent(slug: CoverLetterTemplateSlug): Component {
  return TEMPLATE_COMPONENTS[slug] ?? TemplateClassique
}
