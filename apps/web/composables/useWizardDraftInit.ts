import type { TemplateSlug } from '@profiloz/shared'
import { TEMPLATE_SLUGS } from '@profiloz/shared'

export function useWizardDraftInit() {
  const resumeStore = useResumeStore()
  const route = useRoute()

  onMounted(() => {
    const templateQuery = String(route.query.template ?? route.query.select ?? '').toUpperCase()
    const skipDemo = route.query.fresh === '1' || TEMPLATE_SLUGS.includes(templateQuery as TemplateSlug)

    if (!resumeStore.current?.personalInfo.fullName) {
      resumeStore.rehydrateFromStorage()
    }

    if (!resumeStore.current?.personalInfo.fullName?.trim()) {
      if (skipDemo) {
        resumeStore.initDraft()
        if (TEMPLATE_SLUGS.includes(templateQuery as TemplateSlug)) {
          resumeStore.setTemplate(templateQuery as TemplateSlug)
        }
      } else {
        resumeStore.loadDemoPersona()
      }
    } else {
      resumeStore.initDraft()
      if (TEMPLATE_SLUGS.includes(templateQuery as TemplateSlug)) {
        resumeStore.setTemplate(templateQuery as TemplateSlug)
      }
    }
  })
}
