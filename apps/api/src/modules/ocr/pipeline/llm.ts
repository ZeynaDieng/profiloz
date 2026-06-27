import type { ExtractionMeta, ResumeSnapshot } from '@profiloz/shared'

/**
 * Point d'extension pour une amélioration IA (LLM) des extractions difficiles.
 *
 * Le pipeline reste 100 % fonctionnel sans LLM (heuristiques). Brancher plus tard
 * un fournisseur (OpenAI / Mistral / Gemini…) revient à fournir une implémentation
 * de cette interface, sans toucher au reste du moteur.
 */
export interface LlmEnhancer {
  readonly name: string
  /**
   * Reçoit le texte nettoyé + l'extraction heuristique, renvoie une version
   * éventuellement corrigée/enrichie. Doit être tolérant aux pannes (retourner
   * l'entrée inchangée en cas d'échec).
   */
  enhance(input: {
    rawText: string
    lines: string[]
    data: Partial<ResumeSnapshot>
    meta: ExtractionMeta
  }): Promise<{ data: Partial<ResumeSnapshot>; meta: ExtractionMeta }>
}

/** Implémentation par défaut : ne fait rien (extraction purement heuristique). */
export const noopLlmEnhancer: LlmEnhancer = {
  name: 'noop',
  async enhance(input) {
    return { data: input.data, meta: input.meta }
  },
}
