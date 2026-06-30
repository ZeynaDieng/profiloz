import type { ResumeSnapshot } from '@profiloz/shared'
import {
  findCoverLetterDraftInStorage,
  findResumeSnapshotInStorage,
} from '~/utils/guest-draft-sync'
import { hasDossierDownloadAccess } from '~/utils/dossier-access'
import {
  clearPaymentDraftBackup,
  loadPaymentDraftBackup,
} from '~/utils/payment-draft-backup'
import { clearPaymentRef, isGuestPdfReturnPath, isLetterReturnPath } from '~/utils/payment-return'

const POLL_INTERVAL_MS = 800
const MAX_POLL_ATTEMPTS = 8

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function usePostPaymentDownload() {
  const paymentService = usePaymentService()
  const pdfService = usePdfService()
  const resumeStore = useResumeStore()
  const coverLetterStore = useCoverLetterStore()
  const { ensureSession, applyGuestSessionId } = useGuestSession()

  const phase = ref<'idle' | 'confirming' | 'downloading'>('idle')
  const message = ref('')

  async function confirmPaymentOnce(paymentRef: string) {
    const result = await paymentService.confirmReturn(paymentRef)

    const shouldSwitchSession = Boolean(
      result.guestSessionClientId
      && hasDossierDownloadAccess(result.entitlements)
      && !hasDossierDownloadAccess(await paymentService.getEntitlements().catch(() => null)),
    )

    if (shouldSwitchSession && result.guestSessionClientId) {
      applyGuestSessionId(result.guestSessionClientId)
      await ensureSession()
    }

    if (hasDossierDownloadAccess(result.entitlements)) {
      return result.entitlements!
    }

    const afterSwitch = await paymentService.getEntitlements()
    if (hasDossierDownloadAccess(afterSwitch)) {
      return afterSwitch
    }

    return null
  }

  async function waitForEntitlements(paymentRef?: string | null) {
    phase.value = 'confirming'
    message.value = 'Confirmation de votre paiement…'

    if (paymentRef) {
      const [currentResult, confirmResult] = await Promise.allSettled([
        paymentService.getEntitlements(),
        confirmPaymentOnce(paymentRef),
      ])

      if (currentResult.status === 'fulfilled' && hasDossierDownloadAccess(currentResult.value)) {
        return currentResult.value
      }
      if (confirmResult.status === 'fulfilled' && confirmResult.value) {
        return confirmResult.value
      }
    } else {
      try {
        const current = await paymentService.getEntitlements()
        if (hasDossierDownloadAccess(current)) return current
      } catch {
        // continue
      }
    }

    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      if (attempt > 0) {
        message.value = 'Finalisation de votre accès au téléchargement…'
        await sleep(POLL_INTERVAL_MS)
      }

      if (paymentRef && attempt > 0 && attempt % 2 === 0) {
        try {
          const confirmed = await confirmPaymentOnce(paymentRef)
          if (confirmed) return confirmed
        } catch {
          // ignore
        }
      }

      try {
        const entitlements = await paymentService.getEntitlements()
        if (hasDossierDownloadAccess(entitlements)) {
          return entitlements
        }
      } catch {
        // retry
      }
    }

    throw new Error('payment-not-confirmed')
  }

  function loadResumeForDownload(): ResumeSnapshot | null {
    const backup = loadPaymentDraftBackup()
    if (backup?.kind === 'resume') {
      if (backup.guestSessionId && import.meta.client) {
        localStorage.setItem('profiloz:guest-session', backup.guestSessionId)
      }
      resumeStore.loadSnapshot(backup.snapshot)
      return backup.snapshot
    }

    const snapshot = findResumeSnapshotInStorage()
    if (snapshot) {
      resumeStore.loadSnapshot(snapshot)
      return snapshot
    }

    resumeStore.rehydrateFromStorage()
    if (resumeStore.current?.personalInfo.fullName?.trim()) {
      return {
        ...resumeStore.current,
        templateConfig: { ...resumeStore.current.templateConfig },
      }
    }

    return null
  }

  function loadLetterForDownload() {
    const backup = loadPaymentDraftBackup()
    if (backup?.kind === 'letter') {
      if (backup.guestSessionId && import.meta.client) {
        localStorage.setItem('profiloz:guest-session', backup.guestSessionId)
      }
      coverLetterStore.current = { ...backup.draft }
      return coverLetterStore.toSnapshot()
    }

    const draft = findCoverLetterDraftInStorage()
    if (draft) {
      coverLetterStore.current = { ...draft }
      return coverLetterStore.toSnapshot()
    }

    coverLetterStore.rehydrateFromStorage()
    return coverLetterStore.toSnapshot()
  }

  async function downloadFromReturnPath(returnTo: string, paymentRef?: string | null) {
    if (!isGuestPdfReturnPath(returnTo)) return false

    await waitForEntitlements(paymentRef)

    phase.value = 'downloading'
    message.value = isLetterReturnPath(returnTo)
      ? 'Génération de votre lettre…'
      : 'Génération de votre PDF…'

    const snapshot = isLetterReturnPath(returnTo)
      ? loadLetterForDownload()
      : loadResumeForDownload()

    await ensureSession()

    if (isLetterReturnPath(returnTo)) {
      if (!snapshot?.content?.trim()) throw new Error('missing-letter')
      const { filename } = await pdfService.generateLetterAndDownload(snapshot)
      clearPaymentDraftBackup()
      clearPaymentRef()
      await navigateTo(
        { path: '/creer/succes', query: { file: filename, type: 'letter' } },
        { replace: true },
      )
      return true
    }

    const resumeSnapshot = snapshot as ResumeSnapshot | null
    if (!resumeSnapshot?.personalInfo.fullName?.trim()) throw new Error('missing-resume')

    const { filename } = await pdfService.generateAndDownload(resumeSnapshot)
    clearPaymentDraftBackup()
    clearPaymentRef()
    await navigateTo({ path: '/creer/succes', query: { file: filename } }, { replace: true })
    return true
  }

  return { phase, message, downloadFromReturnPath, hasDownloadAccess: hasDossierDownloadAccess }
}
