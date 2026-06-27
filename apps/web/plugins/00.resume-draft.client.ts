import { clearLegacyResumeDraft } from '~/utils/resume-draft-storage'

export default defineNuxtPlugin(() => {
  if (!import.meta.client) return
  clearLegacyResumeDraft()
})
