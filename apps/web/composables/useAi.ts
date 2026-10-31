import { ref } from 'vue'

export type AiTextKind = 'summary' | 'experience' | 'letter' | 'generic'

/**
 * Appels IA de l'éditeur. Par défaut, une erreur s'affiche en notification : sinon le bouton
 * revenait à son état normal sans rien dire. `toastErrors: false` quand l'écran l'affiche lui-même.
 */
export function useAi(options: { toastErrors?: boolean } = {}) {
  const toastErrors = options.toastErrors ?? true
  const toast = useAppToast()
  const loading = ref(false)
  const error = ref<string | null>(null)

  function fail(err: unknown) {
    error.value = (err as Error)?.message || 'Erreur IA'
    if (toastErrors) toast.error('L’IA n’a pas pu répondre', error.value)
  }
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBaseUrl || '/api/v1'

  async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
    try {
      const data = await res.json()
      return data.detail || data.message || data.error || fallback
    } catch {
      return fallback
    }
  }

  /** Améliore le texte, ou en rédige un brouillon s'il est vide (à partir du contexte). */
  async function enhanceText(text: string, context?: string, kind: AiTextKind = 'generic'): Promise<string | null> {
    if (!text?.trim() && !context?.trim()) {
      // Rien à améliorer ni à partir de quoi rédiger : on le dit plutôt que de ne rien faire
      error.value = 'Renseignez d’abord le poste visé (ou quelques informations) pour que l’IA puisse rédiger.'
      if (toastErrors) toast.info('Il manque une information', error.value)
      return null
    }
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${apiBase}/ai/enhance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text ?? '', context, kind }),
      })
      if (!res.ok) {
        const msg = await parseErrorMessage(res, 'Erreur lors de l’amélioration du texte par l’IA')
        throw new Error(msg)
      }
      const data = await res.json()
      return data.enhancedText || null
    } catch (err) {
      fail(err)
      return null
    } finally {
      loading.value = false
    }
  }

  async function suggestBullets(jobTitle: string, context?: string): Promise<string[]> {
    if (!jobTitle || !jobTitle.trim()) return []
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${apiBase}/ai/suggest-bullets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTitle, context }),
      })
      if (!res.ok) {
        const msg = await parseErrorMessage(res, 'Erreur lors de la suggestion de puces par l’IA')
        throw new Error(msg)
      }
      const data = await res.json()
      return Array.isArray(data.bullets) ? data.bullets : []
    } catch (err) {
      fail(err)
      return []
    } finally {
      loading.value = false
    }
  }

  async function generateLetter(input: {
    jobOfferText: string
    candidateInfo?: string
    candidateName?: string
    targetCompany?: string
    targetPosition?: string
  }): Promise<{ content: string; subject: string } | null> {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${apiBase}/ai/generate-letter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const msg = await parseErrorMessage(res, 'Erreur lors de la génération de la lettre de motivation')
        throw new Error(msg)
      }
      return await res.json()
    } catch (err) {
      fail(err)
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    enhanceText,
    suggestBullets,
    generateLetter,
  }
}
