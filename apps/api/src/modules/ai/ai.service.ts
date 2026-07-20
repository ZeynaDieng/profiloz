import { AppError } from '@/lib/errors'

export class AiService {
  private getApiKey(): string {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new AppError(503, 'Service Unavailable', 'L’API IA Gemini n’est pas configurée.')
    }
    return apiKey
  }

  async enhanceText(text: string, context?: string): Promise<string> {
    if (!text || !text.trim()) return text
    const apiKey = this.getApiKey()

    const prompt = `Tu es un expert en rédaction professionnelle de CV en français.
Améliore ce texte pour qu'il soit percutant, élégant et sans fautes.
${context ? `Contexte : ${context}` : ''}
Texte : "${text}"

Réponds UNIQUEMENT avec le texte final amélioré. Aucun commentaire, aucune intro, pas de guillemets.`

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 512,
          },
        }),
      },
    )

    if (!res.ok) {
      throw new AppError(502, 'Bad Gateway', 'Erreur lors de l’appel à l’IA')
    }

    const data = await res.json()
    const output = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    return output || text
  }

  async suggestBullets(jobTitle: string): Promise<string[]> {
    if (!jobTitle || !jobTitle.trim()) return []
    const apiKey = this.getApiKey()

    const prompt = `Pour le poste de "${jobTitle}", génère 5 puces de réalisations et tâches professionnelles percutantes en français.
Réponds UNIQUEMENT avec un tableau JSON de chaînes de caractères valide :
[
  "Mise en place de...",
  "Gestion de...",
  "Optimisation de...",
  "Développement de...",
  "Suivi et analyse de..."
]`

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.3,
            maxOutputTokens: 512,
          },
        }),
      },
    )

    if (!res.ok) return []

    const data = await res.json()
    const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    if (!textOutput) return []

    try {
      const parsed = JSON.parse(textOutput)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  async generateLetter(input: {
    jobOfferText: string
    candidateInfo?: string
    targetCompany?: string
    targetPosition?: string
  }): Promise<{ content: string; subject: string }> {
    const apiKey = this.getApiKey()

    const prompt = `Rédige une lettre de motivation captivante et ciblée en français.

Offre d'emploi : ${input.jobOfferText}
${input.targetPosition ? `Poste visé : ${input.targetPosition}` : ''}
${input.targetCompany ? `Entreprise : ${input.targetCompany}` : ''}
${input.candidateInfo ? `Profil du candidat :\n${input.candidateInfo}` : ''}

Réponds UNIQUEMENT avec un objet JSON valide :
{
  "subject": "Objet de la lettre",
  "content": "Contenu intégral de la lettre (avec sauts de ligne \\n\\n entre paragraphes)"
}`

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.4,
            maxOutputTokens: 1024,
          },
        }),
      },
    )

    if (!res.ok) {
      throw new AppError(502, 'Bad Gateway', 'Erreur lors de la génération de la lettre avec l’IA')
    }

    const data = await res.json()
    const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    if (!textOutput) {
      throw new AppError(500, 'Internal Server Error', 'Réponse IA vide')
    }

    const parsed = JSON.parse(textOutput)
    return {
      subject: parsed.subject || 'Candidature',
      content: parsed.content || '',
    }
  }
}

export const aiService = new AiService()
