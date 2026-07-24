import type { TemplateSlug } from '@profiloz/shared'
import type { Component } from 'vue'
import TemplateCommercial from '~/components/resume/templates/TemplateCommercial.vue'
import TemplateCreatif from '~/components/resume/templates/TemplateCreatif.vue'
import TemplateDeveloppeur from '~/components/resume/templates/TemplateDeveloppeur.vue'
import TemplateEtudiant from '~/components/resume/templates/TemplateEtudiant.vue'
import TemplateInternational from '~/components/resume/templates/TemplateInternational.vue'
import TemplateManager from '~/components/resume/templates/TemplateManager.vue'
import TemplateMinimaliste from '~/components/resume/templates/TemplateMinimaliste.vue'
import TemplateModerne from '~/components/resume/templates/TemplateModerne.vue'
import TemplateCadre from '~/components/resume/templates/TemplateCadre.vue'
import TemplateExecutif from '~/components/resume/templates/TemplateExecutif.vue'
import TemplatePremium from '~/components/resume/templates/TemplatePremium.vue'
import TemplateProfessionnel from '~/components/resume/templates/TemplateProfessionnel.vue'
import TemplateSidebar from '~/components/resume/templates/TemplateSidebar.vue'
import TemplateTechLead from '~/components/resume/templates/TemplateTechLead.vue'
import TemplateElegance from '~/components/resume/templates/TemplateElegance.vue'
import TemplateImpact from '~/components/resume/templates/TemplateImpact.vue'
import TemplateCabinet from '~/components/resume/templates/TemplateCabinet.vue'
import TemplateAcademique from '~/components/resume/templates/TemplateAcademique.vue'
import TemplateAtelier from '~/components/resume/templates/TemplateAtelier.vue'
import TemplateClinique from '~/components/resume/templates/TemplateClinique.vue'
import TemplateDuotone from '~/components/resume/templates/TemplateDuotone.vue'
import TemplateChronos from '~/components/resume/templates/TemplateChronos.vue'
import TemplateAtsFriendly from '~/components/resume/templates/TemplateAtsFriendly.vue'

const TEMPLATE_COMPONENTS: Record<TemplateSlug, Component> = {
  ETUDIANT: TemplateEtudiant,
  PROFESSIONNEL: TemplateProfessionnel,
  MODERNE: TemplateModerne,
  DEVELOPPEUR: TemplateDeveloppeur,
  COMMERCIAL: TemplateCommercial,
  MANAGER: TemplateManager,
  INTERNATIONAL: TemplateInternational,
  MINIMALISTE: TemplateMinimaliste,
  CREATIF: TemplateCreatif,
  PREMIUM: TemplatePremium,
  CADRE: TemplateCadre,
  EXECUTIF: TemplateExecutif,
  EPURE: TemplateSidebar,
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

export function resolveTemplateComponent(slug: TemplateSlug): Component {
  return TEMPLATE_COMPONENTS[slug] ?? TemplateProfessionnel
}
