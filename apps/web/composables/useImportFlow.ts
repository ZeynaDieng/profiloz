import type { DocumentType, ResumeSnapshot } from '@profiloz/shared'
import { MSG } from '@profiloz/shared'
import { parseApiAuthError } from '~/utils/api-error'

const PROCESS_TIMEOUT_MS = 120_000

export function useImportFlow(documentType: DocumentType) {
  const documentService = useDocumentService()
  const { ensureSession } = useGuestSession()
  const config = useRuntimeConfig()

  const state = ref<'idle' | 'processing' | 'preview' | 'error'>('idle')
  const progress = ref(0)
  const stage = ref(0)
  const fileName = ref('')
  const documentId = ref('')
  const mimeType = ref('')
  const extractedData = ref<Partial<ResumeSnapshot>>({})
  const machineParsed = ref<Partial<ResumeSnapshot>>({})
  const errorMessage = ref('')

  let progressTimer: ReturnType<typeof setInterval> | undefined

  function stopProgressAnimation() {
    if (progressTimer) {
      clearInterval(progressTimer)
      progressTimer = undefined
    }
  }

  function startProgressAnimation() {
    stopProgressAnimation()
    progress.value = 5
    stage.value = 0
    progressTimer = setInterval(() => {
      if (progress.value < 92) {
        progress.value = Math.min(92, progress.value + 2)
        if (progress.value >= 20) stage.value = 1
        if (progress.value >= 40) stage.value = 2
        if (progress.value >= 60) stage.value = 3
        if (progress.value >= 80) stage.value = 4
      }
    }, 450)
  }

  async function processDocumentWithTimeout(id: string) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), PROCESS_TIMEOUT_MS)

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (import.meta.client) {
      const guestSessionId = localStorage.getItem('profiloz:guest-session')
      if (guestSessionId) headers['X-Guest-Session-Id'] = guestSessionId

      const authStore = useAuthStore()
      authStore.syncSession()
      const token = getStoredAccessToken()
      if (token) headers.Authorization = `Bearer ${token}`
    }

    try {
      const response = await fetch(`${config.public.apiBaseUrl}/documents/${id}/process`, {
        method: 'POST',
        headers,
        signal: controller.signal,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw error
      }

      return (await response.json()) as { parsedData: Partial<ResumeSnapshot>; confidence?: number }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw {
          detail: MSG.network.timeout,
        }
      }
      throw error
    } finally {
      clearTimeout(timer)
    }
  }

  async function processFile(file: File) {
    fileName.value = file.name
    state.value = 'processing'
    errorMessage.value = ''
    startProgressAnimation()

    try {
      await ensureSession()
      stage.value = 0
      progress.value = Math.max(progress.value, 12)

      const uploaded = await documentService.uploadDocument(file, documentType)
      documentId.value = uploaded.id
      mimeType.value = file.type
      stage.value = 1
      progress.value = Math.max(progress.value, 28)

      const result = await processDocumentWithTimeout(uploaded.id)
      stopProgressAnimation()
      stage.value = 4
      progress.value = 100
      extractedData.value = result.parsedData ?? {}
      machineParsed.value = structuredClone(result.parsedData ?? {})
      state.value = 'preview'
    } catch (error) {
      stopProgressAnimation()
      errorMessage.value = parseApiAuthError(error, MSG.upload.ocrError)
      state.value = 'error'
    }
  }

  function reset() {
    stopProgressAnimation()
    state.value = 'idle'
    progress.value = 0
    stage.value = 0
    fileName.value = ''
    documentId.value = ''
    mimeType.value = ''
    extractedData.value = {}
    machineParsed.value = {}
    errorMessage.value = ''
  }

  return {
    state,
    progress,
    stage,
    fileName,
    documentId,
    mimeType,
    extractedData,
    machineParsed,
    errorMessage,
    processFile,
    reset,
  }
}
