import type { ResumeSnapshot } from '@profiloz/shared'
import { buildPreviewSnapshot } from '~/features/templates/demoSnapshot'
import {
  findCoverLetterDraftInStorage,
  findResumeSnapshotInStorage,
} from '~/utils/guest-draft-sync'
import { hasDossierDownloadAccess } from '~/utils/dossier-access'
import {
  ensurePaidGuestDossier,
  initGuestDossier,
  markGuestDossierDownload,
  pinPaidGuestSession,
  restorePaidGuestSession,
} from '~/utils/guest-dossier-state'
import {
  clearPaymentDraftBackup,
  loadPaymentDraftBackup,
} from '~/utils/payment-draft-backup'
import { saveLastPurchasedPlan } from '~/utils/payment-purchase'
import { saveLastDownloadContext } from '~/utils/last-download-context'
import { resolvePersistableResumeId } from '~/utils/resume-id'
import { buildResumePdfFilename } from '~/utils/resumePdfFilename'
import { buildCoverLetterPdfFilename } from '~/utils/coverLetterPdfFilename'

const POLL_INTERVAL_MS = 800
const MAX_POLL_ATTEMPTS = 20

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function applyPaidGuestSession(guestSessionId: string | null | undefined) {
  if (!guestSessionId || !import.meta.client) return
  pinPaidGuestSession(guestSessionId)
}

function isResumeSnapshotValid(snap: any): boolean {
  if (!snap || typeof snap !== 'object') return false
  const p = snap.personalInfo || {}
  const hasName = Boolean((p.firstName || p.lastName || p.fullName)?.trim())
  const hasExp = Boolean(snap.experiences?.length)
  const hasSkills = Boolean(snap.skills?.length)
  const hasSummary = Boolean(snap.summary?.trim())
  return hasName || hasExp || hasSkills || hasSummary
}

function isLetterSnapshotValid(draft: any): boolean {
  if (!draft || typeof draft !== 'object') return false
  return Boolean(draft.content?.trim() || draft.senderName?.trim() || draft.recipientName?.trim())
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

    if (result.purchasedPlan) {
      saveLastPurchasedPlan(result.purchasedPlan)
    }

    if (result.guestSessionClientId) {
      applyGuestSessionId(result.guestSessionClientId)
      const backup = loadPaymentDraftBackup()
      const origin =
        backup?.returnTo && isLetterReturnPath(backup.returnTo)
          ? 'letter'
          : backup?.kind === 'letter'
            ? 'letter'
            : 'cv'
      initGuestDossier(result.guestSessionClientId, origin, { freshPayment: true })
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

  function loadResumeForDownload(serverDraft?: unknown): ResumeSnapshot {
    restorePaidGuestSession()

    if (isResumeSnapshotValid(serverDraft)) {
      const snap = serverDraft as any
      resumeStore.loadSnapshot(snap)
      if (import.meta.client) {
        try {
          localStorage.setItem('pz_resume_draft_v1', JSON.stringify(snap))
        } catch {}
      }
      return snap
    }

    const backup = loadPaymentDraftBackup()
    if (backup?.kind === 'resume' && isResumeSnapshotValid(backup.snapshot)) {
      applyPaidGuestSession(backup.guestSessionId)
      resumeStore.loadSnapshot(backup.snapshot)
      return backup.snapshot
    }

    const snapshot = findResumeSnapshotInStorage()
    if (isResumeSnapshotValid(snapshot)) {
      resumeStore.loadSnapshot(snapshot!)
      return snapshot!
    }

    resumeStore.rehydrateFromStorage()
    if (isResumeSnapshotValid(resumeStore.current)) {
      return {
        ...resumeStore.current!,
        templateConfig: { ...resumeStore.current!.templateConfig },
      }
    }

    const fallback = buildPreviewSnapshot('PROFESSIONNEL', undefined, null)
    resumeStore.loadSnapshot(fallback)
    return fallback
  }

  function loadLetterForDownload(serverDraft?: unknown) {
    restorePaidGuestSession()

    if (isLetterSnapshotValid(serverDraft)) {
      const draft = serverDraft as any
      coverLetterStore.current = { ...draft }
      if (import.meta.client) {
        try {
          localStorage.setItem('pz_cover_letter_draft_v1', JSON.stringify(draft))
        } catch {}
      }
      return coverLetterStore.toSnapshot()
    }

    const backup = loadPaymentDraftBackup()
    if (backup?.kind === 'letter' && isLetterSnapshotValid(backup.draft)) {
      applyPaidGuestSession(backup.guestSessionId)
      coverLetterStore.current = { ...backup.draft }
      return coverLetterStore.toSnapshot()
    }

    const draft = findCoverLetterDraftInStorage()
    if (isLetterSnapshotValid(draft)) {
      coverLetterStore.current = { ...draft! }
      return coverLetterStore.toSnapshot()
    }

    coverLetterStore.rehydrateFromStorage()
    if (isLetterSnapshotValid(coverLetterStore.current)) {
      return coverLetterStore.toSnapshot()
    }

    coverLetterStore.current = {
      id: 'letter-1',
      templateSlug: 'CLASSIQUE',
      senderName: 'Aminata Diallo',
      recipientName: 'Responsable des Ressources Humaines',
      jobTitle: 'Chef de Projet Marketing',
      companyName: 'Société X',
      content: 'Madame, Monsieur,\n\nC’est avec un grand intérêt que je vous adresse ma candidature pour le poste de Chef de Projet.\nFort de plusieurs années d’expérience dans la gestion de projets et le marketing stratégique, j’ai développé une solide expertise.\n\nJe reste à votre disposition pour un entretien.\n\nCordialement,\nAminata Diallo',
      fontSize: 'medium',
    }
    return coverLetterStore.toSnapshot()
  }

  async function downloadFromReturnPath(returnTo: string, paymentRef?: string | null) {
    if (!isGuestPdfReturnPath(returnTo)) return false

    const backup = loadPaymentDraftBackup()
    if (backup?.guestSessionId) {
      applyPaidGuestSession(backup.guestSessionId)
    } else {
      restorePaidGuestSession()
    }

    const entitlements = await waitForEntitlements(paymentRef)
    const serverDraft = entitlements?.paidDraftSnapshot

    phase.value = 'downloading'
    message.value = isLetterReturnPath(returnTo)
      ? 'Génération de votre lettre…'
      : 'Génération de votre PDF…'

    if (isLetterReturnPath(returnTo)) {
      const letterSnapshot = loadLetterForDownload(serverDraft)
      await ensureSession()
      if (!letterSnapshot?.content?.trim()) throw new Error('missing-letter')
      ensurePaidGuestDossier('letter')
      resumeStore.rehydrateFromStorage()
      
      const filename = buildCoverLetterPdfFilename(letterSnapshot.senderName)
      const result = await pdfService.generateLetterFromSnapshot(
        letterSnapshot,
        resolvePersistableResumeId(resumeStore.savedResumeId),
      )
      const jobId = result.jobId

      markGuestDossierDownload('letter', letterSnapshot.id)
      saveLastDownloadContext({ kind: 'letter', filename, downloadedAt: new Date().toISOString() })
      clearPaymentDraftBackup()
      clearPaymentRef()
      await navigateTo(
        { path: '/creer/succes', query: { file: filename, type: 'letter', jobId } },
        { replace: true },
      )
      return true
    }

    const resumeSnapshot = loadResumeForDownload(serverDraft)
    await ensureSession()
    if (!resumeSnapshot?.personalInfo || !resumeSnapshot.id) throw new Error('missing-resume')

    ensurePaidGuestDossier('cv')
    const filename = buildResumePdfFilename(resumeSnapshot)
    const result = await pdfService.generateFromSnapshot(resumeSnapshot)
    const jobId = result.jobId

    markGuestDossierDownload('cv', resumeSnapshot.id)
    saveLastDownloadContext({ kind: 'cv', filename, downloadedAt: new Date().toISOString() })
    clearPaymentDraftBackup()
    clearPaymentRef()
    await navigateTo({ path: '/creer/succes', query: { file: filename, jobId } }, { replace: true })
    return true
  }

  return { phase, message, downloadFromReturnPath, hasDownloadAccess: hasDossierDownloadAccess }
}
