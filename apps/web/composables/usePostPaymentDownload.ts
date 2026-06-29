import type { ResumeSnapshot } from '@profiloz/shared'
import { isGuestPdfReturnPath, isLetterReturnPath } from '~/utils/payment-return'

const POLL_INTERVAL_MS = 1500
const MAX_POLL_ATTEMPTS = 20

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function usePostPaymentDownload() {
  const paymentService = usePaymentService()
  const pdfService = usePdfService()
  const resumeStore = useResumeStore()
  const coverLetterStore = useCoverLetterStore()
  const { ensureSession } = useGuestSession()

  const phase = ref<'idle' | 'confirming' | 'downloading'>('idle')
  const message = ref('')

  async function waitForEntitlements() {
    phase.value = 'confirming'
    message.value = 'Confirmation de votre paiement…'

    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      if (attempt > 0) await sleep(POLL_INTERVAL_MS)
      try {
        const entitlements = await paymentService.getEntitlements()
        if (entitlements.unlimitedActive || entitlements.creditsBalance > 0) {
          return entitlements
        }
      } catch {
        // retry — IPN peut mettre quelques secondes
      }
    }

    throw new Error('payment-not-confirmed')
  }

  async function downloadFromReturnPath(returnTo: string) {
    if (!isGuestPdfReturnPath(returnTo)) return false

    await waitForEntitlements()
    await ensureSession()

    phase.value = 'downloading'
    message.value = isLetterReturnPath(returnTo)
      ? 'Génération de votre lettre…'
      : 'Génération de votre PDF…'

    if (isLetterReturnPath(returnTo)) {
      coverLetterStore.rehydrateFromStorage()
      coverLetterStore.initDraft()
      const snapshot = coverLetterStore.toSnapshot()
      if (!snapshot?.content?.trim()) throw new Error('missing-letter')
      const { filename } = await pdfService.generateLetterAndDownload(snapshot)
      await navigateTo(
        { path: '/creer/succes', query: { file: filename, type: 'letter' } },
        { replace: true },
      )
      return true
    }

    resumeStore.rehydrateFromStorage()
    resumeStore.initDraft()
    if (!resumeStore.current) throw new Error('missing-resume')

    const snapshot: ResumeSnapshot = {
      ...resumeStore.current,
      templateConfig: { ...resumeStore.current.templateConfig },
    }
    const { filename } = await pdfService.generateAndDownload(snapshot)
    await navigateTo({ path: '/creer/succes', query: { file: filename } }, { replace: true })
    return true
  }

  return { phase, message, downloadFromReturnPath }
}
