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

    const prompt = `Tu es un expert mondial en rédaction de CV et de lettres de motivation professionnelles en français.
Ta mission est d'améliorer et de rendre ultra-professionnel, percutant et sans aucune faute le texte ci-dessous.
${context ? `Contexte du poste ou section : ${context}` : ''}

Texte d'origine :
"${text}"

CONSIGNES STRICTES :
- Conserve impérativement le sens et les faits réels d'origine.
- Utilise des verbes d'action percutants et un ton professionnel élégant.
- Réponds UNIQUEMENT avec le texte amélioré final. Ne rajoute aucun commentaire, aucune phrase d'intro, ni guillemets ni balises markdown.`

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3 },
        }),
      },
    )

    if (!res.ok) {
      throw new AppError(502, 'Bad Gateway', 'Erreur lors de l’appel à Gemini')
    }

    const data = await res.json()
    const output = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    return output || text
  }

  async suggestBullets(jobTitle: string): Promise<string[]> {
    if (!jobTitle || !jobTitle.trim()) return []
    const apiKey = this.getApiKey()

    const prompt = `Tu es un recruteur expert. Pour le poste de "${jobTitle}", génère 5 puces de réalisations et tâches professionnelles percutantes et modernes en français.

Réponds UNIQUEMENT avec un tableau JSON de chaînes de caractères (strings) valide :
[
  "Réalisation 1...",
  "Réalisation 2...",
  "Réalisation 3...",
  "Réalisation 4...",
  "Réalisation 5..."
]`

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.4 },
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

    const prompt = `Tu es un rédacteur expert en lettres de motivation à très fort impact pour le marché professionnel.
Rédige une lettre de motivation captivante, moderne et ciblée en français.

Informations de l'offre d'emploi :
${input.jobOfferText}

${input.targetPosition ? `Poste visé : ${input.targetPosition}` : ''}
${input.targetCompany ? `Entreprise visée : ${input.targetCompany}` : ''}
${input.candidateInfo ? `Profil / CV du candidat :\n${input.candidateInfo}` : ''}

Consignes :
1. Rédige une lettre avec une structure claire en 4 paragraphes :
   - Paragraphe 1 : Accroche percutante et motivation pour le poste.
   - Paragraphe 2 : Adéquation de mon parcours avec les besoins de l'entreprise.
   - Paragraphe 3 : Ce que je souhaite apporter (valeur ajoutée concrète).
   - Paragraphe 4 : Conclusion enthousiaste et proposition d'entretien.
2. Sois convaincant, fluide, professionnel et sans fautes d'orthographe.

Réponds UNIQUEMENT avec un objet JSON valide :
{
  "subject": "Objet de la lettre (ex: Candidature au poste de...)",
  "content": "Contenu intégral de la lettre de motivation (avec des sauts de ligne \\n\\n entre paragraphes)"
}`

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.5 },
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
