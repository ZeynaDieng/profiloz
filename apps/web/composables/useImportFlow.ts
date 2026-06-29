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
  const fileName = ref('')
  const extractedData = ref<Partial<ResumeSnapshot>>({})
  const errorMessage = ref('')

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
    progress.value = 10
    errorMessage.value = ''

    try {
      await ensureSession()
      progress.value = 20

      const uploaded = await documentService.uploadDocument(file, documentType)
      progress.value = 45

      const result = await processDocumentWithTimeout(uploaded.id)
      progress.value = 100
      extractedData.value = result.parsedData ?? {}
      state.value = 'preview'
    } catch (error) {
      errorMessage.value = parseApiAuthError(error, MSG.upload.ocrError)
      state.value = 'error'
    }
  }

  function reset() {
    state.value = 'idle'
    progress.value = 0
    fileName.value = ''
    extractedData.value = {}
    errorMessage.value = ''
  }

  return { state, progress, fileName, extractedData, errorMessage, processFile, reset }
}
