import type { ResumeSnapshot } from '@profiloz/shared'

export function useWizardPreviewResume() {
  const resumeStore = useResumeStore()

  const previewResume = computed<ResumeSnapshot | null>(() => resumeStore.current)

  return { previewResume }
}
