import { MSG } from '@profiloz/shared'
import { hasDossierDownloadAccess } from '~/utils/dossier-access'
import {
  loadPaymentDraftBackup,
} from '~/utils/payment-draft-backup'
import {
  markGuestDossierDownload,
  restorePaidGuestSession,
} from '~/utils/guest-dossier-state'
import {
  findCoverLetterDraftInStorage,
  findResumeSnapshotInStorage,
} from '~/utils/guest-draft-sync'
import { saveLastDownloadContext, type LastDownloadKind } from '~/utils/last-download-context'
import { resolvePersistableResumeId } from '~/utils/resume-id'

export function useGuestDownload() {
  const pdfService = usePdfService()
  const coverLetterService = useCoverLetterService()
  const resumeStore = useResumeStore()
  const coverLetterStore = useCoverLetterStore()
  const authStore = useAuthStore()
  const { ensureSession } = useGuestSession()

  const downloading = ref(false)
  const downloadError = ref('')
  const lastFilename = ref('')

  async function preparePaidSession() {
    restorePaidGuestSession()
    await ensureSession().catch(() => {})
    await syncGuestSessionForEditor()
    const { fetchEntitlements } = usePaymentEntitlements()
    const entitlements = await fetchEntitlements()
    if (!hasDossierDownloadAccess(entitlements)) {
      throw new Error('payment-required')
    }
  }

  function loadResumeSnapshot() {
    const backup = loadPaymentDraftBackup()
    if (backup?.kind === 'resume') {
      resumeStore.loadSnapshot(backup.snapshot)
      return backup.snapshot
    }

    const fromStorage = findResumeSnapshotInStorage()
    if (fromStorage) {
      resumeStore.loadSnapshot(fromStorage)
      return fromStorage
    }

    resumeStore.rehydrateFromStorage()
    if (!resumeStore.current?.personalInfo.fullName?.trim()) return null
    return {
      ...resumeStore.current,
      templateConfig: { ...resumeStore.current.templateConfig },
    }
  }

  function loadLetterSnapshot() {
    const backup = loadPaymentDraftBackup()
    if (backup?.kind === 'letter') {
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

  async function downloadKind(kind: LastDownloadKind) {
    downloading.value = true
    downloadError.value = ''
    lastFilename.value = ''

    try {
      await preparePaidSession()

      if (authStore.isAuthenticated && kind === 'cv') {
        resumeStore.rehydrateFromStorage()
        const resumeId = resolvePersistableResumeId(resumeStore.savedResumeId)
        const snapshot = loadResumeSnapshot()
        if (resumeId && snapshot) {
          const { filename } = await pdfService.downloadResumeCv(resumeId, snapshot)
          lastFilename.value = filename
          saveLastDownloadContext({ kind, filename, downloadedAt: new Date().toISOString() })
          return filename
        }
      }

      if (authStore.isAuthenticated && kind === 'letter') {
        const letterId =
          typeof useRoute().query.letterId === 'string' ? useRoute().query.letterId : null
        if (letterId) {
          const { filename } = await coverLetterService.downloadPdf(letterId)
          markGuestDossierDownload('letter')
          lastFilename.value = filename
          saveLastDownloadContext({ kind, filename, downloadedAt: new Date().toISOString() })
          return filename
        }
      }

      if (kind === 'letter') {
        const snapshot = loadLetterSnapshot()
        if (!snapshot?.content?.trim()) throw new Error('missing-letter')
        resumeStore.rehydrateFromStorage()
        const { filename } = await pdfService.generateLetterAndDownload(
          snapshot,
          resolvePersistableResumeId(resumeStore.savedResumeId),
        )
        markGuestDossierDownload('letter')
        lastFilename.value = filename
        saveLastDownloadContext({ kind, filename, downloadedAt: new Date().toISOString() })
        return filename
      }

      const snapshot = loadResumeSnapshot()
      if (!snapshot?.personalInfo.fullName?.trim()) throw new Error('missing-resume')
      const { filename } = await pdfService.generateAndDownload(snapshot)
      markGuestDossierDownload('cv')
      lastFilename.value = filename
      saveLastDownloadContext({ kind, filename, downloadedAt: new Date().toISOString() })
      return filename
    } catch (err) {
      const code = err instanceof Error ? err.message : ''
      if (code === 'payment-required') {
        downloadError.value = MSG.payment.error
      } else if (code === 'missing-resume' || code === 'missing-letter') {
        downloadError.value =
          'Votre brouillon est introuvable sur cet appareil. Rouvrez votre document depuis le même navigateur, sans vider l’historique.'
      } else {
        downloadError.value = MSG.pdf.error
      }
      throw err
    } finally {
      downloading.value = false
    }
  }

  return {
    downloading,
    downloadError,
    lastFilename,
    downloadKind,
    downloadCv: () => downloadKind('cv'),
    downloadLetter: () => downloadKind('letter'),
  }
}
