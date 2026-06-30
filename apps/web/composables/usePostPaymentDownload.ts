import type { ResumeSnapshot } from '@profiloz/shared'
import type { Entitlements } from '~/services/payment.service'
import {
  findCoverLetterDraftInStorage,
  findResumeSnapshotInStorage,
} from '~/utils/guest-draft-sync'
import {
  clearPaymentDraftBackup,
  loadPaymentDraftBackup,
} from '~/utils/payment-draft-backup'
import { clearPaymentRef, isGuestPdfReturnPath, isLetterReturnPath } from '~/utils/payment-return'

const POLL_INTERVAL_MS = 1500
const MAX_POLL_ATTEMPTS = 12

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function hasDownloadAccess(entitlements?: Entitlements | null) {
  if (!entitlements) return false
  return entitlements.unlimitedActive
    || entitlements.creditsBalance > 0
    || entitlements.canDownloadSnapshot === true
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
      && hasDownloadAccess(result.entitlements)
      && !hasDownloadAccess(await paymentService.getEntitlements().catch(() => null)),
    )

    if (shouldSwitchSession && result.guestSessionClientId) {
      applyGuestSessionId(result.guestSessionClientId)
      await ensureSession()
    }

    if (hasDownloadAccess(result.entitlements)) {
      return result.entitlements!
    }

    const afterSwitch = await paymentService.getEntitlements()
    if (hasDownloadAccess(afterSwitch)) {
      return afterSwitch
    }

    return null
  }

  async function waitForEntitlements(paymentRef?: string | null) {
    phase.value = 'confirming'
    message.value = 'Confirmation de votre paiement…'

    try {
      const current = await paymentService.getEntitlements()
      if (hasDownloadAccess(current)) return current
    } catch {
      // continue
    }

    if (paymentRef) {
      try {
        const confirmed = await confirmPaymentOnce(paymentRef)
        if (confirmed) return confirmed
      } catch {
        // IPN peut être en retard — on poll /me seulement ensuite
      }
    }

    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      if (attempt > 0) {
        message.value = 'Finalisation de votre accès au téléchargement…'
        await sleep(POLL_INTERVAL_MS)
      }

      if (paymentRef && (attempt === 2 || attempt === 6)) {
        try {
          const confirmed = await confirmPaymentOnce(paymentRef)
          if (confirmed) return confirmed
        } catch {
          // ignore
        }
      }

      try {
        const entitlements = await paymentService.getEntitlements()
        if (hasDownloadAccess(entitlements)) {
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
    await ensureSession()

    phase.value = 'downloading'
    message.value = isLetterReturnPath(returnTo)
      ? 'Génération de votre lettre…'
      : 'Génération de votre PDF…'

    if (isLetterReturnPath(returnTo)) {
      const snapshot = loadLetterForDownload()
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

    const snapshot = loadResumeForDownload()
    if (!snapshot?.personalInfo.fullName?.trim()) throw new Error('missing-resume')

    const { filename } = await pdfService.generateAndDownload(snapshot)
    clearPaymentDraftBackup()
    clearPaymentRef()
    await navigateTo({ path: '/creer/succes', query: { file: filename } }, { replace: true })
    return true
  }

  return { phase, message, downloadFromReturnPath, hasDownloadAccess }
}
