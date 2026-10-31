/**
 * Client Gemini partagé (textes IA, import de CV).
 *
 * Les modèles sont essayés dans l'ordre : si l'un est surchargé (503), limité (429) ou trop lent,
 * on passe au suivant, dans la limite d'un budget de temps global.
 * Mesuré le 31/10/2026 : 3.5-flash-lite répond en 2 à 4 s, 3.1-flash-lite renvoyait souvent 503 ou 20 s.
 */
export const GEMINI_MODELS = ['gemini-3.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.1-flash-lite']

export type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } }

export type GeminiRequest = {
  parts: GeminiPart[]
  temperature: number
  maxOutputTokens: number
  json?: boolean
  /** Délai maximum par modèle. */
  timeoutMs: number
  /** Budget total, tous modèles confondus. */
  budgetMs: number
  /** Préfixe des journaux (ex. « ai », « import »). */
  label: string
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY)
}

/** Texte brut de la réponse, ou null si aucun modèle n'a répondu de façon exploitable. */
export async function callGemini(request: GeminiRequest): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null

  const body = JSON.stringify({
    contents: [{ parts: request.parts }],
    generationConfig: {
      ...(request.json ? { responseMimeType: 'application/json' } : {}),
      temperature: request.temperature,
      maxOutputTokens: request.maxOutputTokens,
      // Pas de « réflexion » : plus rapide, et elle ne grignote plus la limite de tokens de la réponse
      thinkingConfig: { thinkingLevel: 'minimal' },
    },
  })

  const deadline = Date.now() + request.budgetMs
  for (const model of GEMINI_MODELS) {
    const remaining = deadline - Date.now()
    if (remaining < 2_000) break
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          signal: AbortSignal.timeout(Math.min(request.timeoutMs, remaining)),
        },
      )
      if (res.ok) {
        const data = await res.json()
        const candidate = data.candidates?.[0]
        const parts: Array<{ text?: string }> = candidate?.content?.parts ?? []
        const text = parts.map((part) => part.text ?? '').join('').trim()
        // Réponse coupée par la limite de tokens : le JSON serait incomplet, on tente le modèle suivant
        if (text && !(request.json && candidate?.finishReason === 'MAX_TOKENS')) return text
        console.warn(`[${request.label}] ${model} : réponse inexploitable (${candidate?.finishReason ?? 'vide'})`)
      } else {
        console.warn(`[${request.label}] ${model} : HTTP ${res.status}`)
        // Clé invalide, requête refusée… : un autre modèle n'y changera rien
        if (res.status === 400 || res.status === 401 || res.status === 403) return null
      }
    } catch (error) {
      // Délai dépassé ou réseau : on passe au modèle suivant
      console.warn(`[${request.label}] ${model} : ${(error as Error).name}`)
    }
  }
  return null
}

/** Lit un JSON renvoyé par le modèle, en retirant un éventuel bloc ```json … ``` autour. */
export function parseJsonOutput(text: string): unknown {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  return JSON.parse(cleaned)
}
