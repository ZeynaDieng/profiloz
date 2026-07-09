import type { ResumeSnapshot } from '@profiloz/shared'
import { buildPreviewSnapshot } from '~/features/templates/demoSnapshot'

/**
 * Aperçu wizard : fusionne la saisie utilisateur avec la démo Aminata
 * pour que l’aperçu reste rempli même si le formulaire est vide (placeholders).
 */
export function useWizardPreviewResume() {
  const resumeStore = useResumeStore()

  const previewResume = computed<ResumeSnapshot | null>(() => {
    const current = resumeStore.current
    const slug = current?.templateSlug ?? 'PROFESSIONNEL'
    const accent = current?.templateConfig?.accentColor
    return buildPreviewSnapshot(slug, accent, current)
  })

  return { previewResume }
}
