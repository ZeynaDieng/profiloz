import type { TemplateSlug } from '@profiloz/shared'
import { TEMPLATE_SLUGS } from '@profiloz/shared'
import { isLocalDemoResumeId } from '~/utils/resume-id'

/**
 * Initialise un brouillon CV vide pour le formulaire.
 * La démo Aminata n’est plus injectée dans le store : elle sert uniquement à l’aperçu.
 */
export function useWizardDraftInit() {
  const resumeStore = useResumeStore()
  const route = useRoute()

  function ensureEmptyDraft() {
    if (!resumeStore.current) {
      resumeStore.rehydrateFromStorage()
    }

    // Anciens brouillons démo (Aminata) → formulaire vide
    if (isLocalDemoResumeId(resumeStore.current?.id)) {
      resumeStore.startNewDraft()
    }

    resumeStore.initDraft()

    const templateQuery = String(route.query.template ?? route.query.select ?? '').toUpperCase()
    if (TEMPLATE_SLUGS.includes(templateQuery as TemplateSlug)) {
      resumeStore.setTemplate(templateQuery as TemplateSlug)
    }
  }

  // Synchrone : les formulaires lisent le store juste après dans setup
  ensureEmptyDraft()
  onMounted(ensureEmptyDraft)
}
