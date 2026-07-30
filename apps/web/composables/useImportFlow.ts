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
      if (progress.value < 96) {
        // Déplacement rapide au début, puis ralenti fluide pendant le traitement serveur
        const step = progress.value < 60 ? 3 : progress.value < 85 ? 1.5 : 0.5
        progress.value = Math.min(96, Number((progress.value + step).toFixed(1)))

        if (progress.value >= 20 && progress.value < 45) stage.value = 1
        else if (progress.value >= 45 && progress.value < 70) stage.value = 2
        else if (progress.value >= 70) stage.value = 3
      }
    }, 350)
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

    console.log(`⚡ [Profilo’Z OCR] Envoi de la requête d'analyse IA pour le document ID: ${id}...`)
    const startTime = Date.now()

    try {
      const response = await fetch(`${config.public.apiBaseUrl}/documents/${id}/process`, {
        method: 'POST',
        headers,
        signal: controller.signal,
      })

      const elapsed = Date.now() - startTime
      console.log(`⏱️ [Profilo’Z OCR] Réponse HTTP du serveur reçue en ${elapsed}ms (Statut: ${response.status})`)

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        console.error('❌ [Profilo’Z OCR] Le serveur a renvoyé une erreur HTTP:', response.status, error)
        throw error
      }

      const json = await response.json()
      console.log('✅ [Profilo’Z OCR] Données JSON extraites avec succès !', json)
      return json as { parsedData: Partial<ResumeSnapshot>; confidence?: number }
    } catch (error) {
      const elapsed = Date.now() - startTime
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.error(`💥 [Profilo’Z OCR] TIMEOUT ABANDON après ${elapsed}ms d'attente !`)
        throw { detail: MSG.network.timeout }
      }
      console.error(`❌ [Profilo’Z OCR] Échec de la requête après ${elapsed}ms :`, error)
      throw error
    } finally {
      clearTimeout(timer)
    }
  }

  async function processFile(file: File) {
    console.group(`📄 [Profilo’Z Import] Début de l'analyse du fichier : ${file.name} (${(file.size / 1024).toFixed(1)} Ko)`)
    fileName.value = file.name
    state.value = 'processing'
    errorMessage.value = ''
    startProgressAnimation()

    try {
      console.log('1️⃣ [Profilo’Z Import] Vérification de la session utilisateur/invité...')
      await ensureSession()

      console.log('2️⃣ [Profilo’Z Import] Téléversement du fichier sur le serveur...')
      stage.value = 0
      progress.value = Math.max(progress.value, 12)

      const uploaded = await documentService.uploadDocument(file, documentType)
      console.log('✔ Fichier téléversé avec succès. Document ID:', uploaded.id)

      documentId.value = uploaded.id
      mimeType.value = file.type
      stage.value = 1
      progress.value = Math.max(progress.value, 28)

      console.log('3️⃣ [Profilo’Z Import] Démarrage du pipeline de lecture OCR et structuration IA...')
      const result = await processDocumentWithTimeout(uploaded.id)

      stopProgressAnimation()
      stage.value = 4
      progress.value = 100
      extractedData.value = result.parsedData ?? {}
      machineParsed.value = structuredClone(result.parsedData ?? {})

      console.log('4️⃣ [Profilo’Z Import] Analyse terminée à 100% ! Redirection vers l’étape suivante...')
      console.groupEnd()
      state.value = 'preview'
    } catch (error) {
      stopProgressAnimation()
      console.error('💥 [Profilo’Z Import] Erreur globale lors du traitement du fichier :', error)
      console.groupEnd()
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
