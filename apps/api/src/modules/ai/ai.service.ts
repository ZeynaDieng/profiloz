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

    const prompt = `Tu es un rédacteur professionnel et un coach de carrière humain.
Améliore ce texte de CV pour qu'il soit percutant, élégant, sans fautes, mais surtout TRÈS HUMAIN et fluide.
Consignes :
- Évite absolument les expressions robotiques ou clichés corporate (ex: "facilitateur", "catalyseur", "synergie", "passionné par", "ayant à cœur de", "forte valeur ajoutée").
- Privilégie un ton authentique, sincère, direct et simple. Raconte des faits réels.
- Sois concis : pas de phrases à rallonge ou de jargon de remplissage.
${context ? `Contexte : ${context}` : ''}
Texte à améliorer : "${text}"

Réponds UNIQUEMENT avec le texte final amélioré, prêt à être inséré. Aucune introduction, aucune conclusion, aucun commentaire, pas de guillemets autour.`

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.6,
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

    const prompt = `Pour le poste de "${jobTitle}", génère 5 puces de réalisations professionnelles concrètes et variées pour un CV.
Consignes strictes :
- Sois TRÈS humain, moderne et réaliste. Évite les puces génériques et robotiques.
- Chaque puce doit commencer par un verbe d'action différent (ex: "Coordonner", "Optimiser", "Négocier", "Piloter").
- Rédige des phrases courtes (10 à 15 mots maximum par puce) qui décrivent un résultat tangible.
- Propose des tâches spécifiques au secteur de "${jobTitle}" pour éviter les répétitions d'un métier à un autre.

Réponds UNIQUEMENT avec un tableau JSON de chaînes de caractères valide, sans texte autour :
[
  "Réalisation spécifique 1...",
  "Réalisation spécifique 2...",
  "Réalisation spécifique 3...",
  "Réalisation spécifique 4...",
  "Réalisation spécifique 5..."
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
            temperature: 0.7,
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

    const prompt = `Rédige le corps d'une lettre de motivation captivante, directe et profondément HUMAINE en français.

Offre d'emploi : ${input.jobOfferText}
${input.targetPosition ? `Poste visé : ${input.targetPosition}` : ''}
${input.targetCompany ? `Entreprise : ${input.targetCompany}` : ''}
${input.candidateInfo ? `Profil du candidat :\n${input.candidateInfo}` : ''}

Consignes de structure et de style STRICTES :
- Ne génère QUE les 3 paragraphes centraux du corps du message (Vous / Moi / Nous).
- NE réponds PAS avec les en-têtes (pas d'adresse expéditeur/destinataire, pas de "À l'attention de...").
- NE réponds PAS avec la ligne d'objet ("Objet : ...") car elle est affichée séparément par le modèle.
- NE réponds PAS avec la formule d'appel ("Madame, Monsieur," ou "Mme Ndiaye,").
- NE réponds PAS avec la formule de politesse de fin ("Veuillez agréer...", "Je vous prie d'agréer...") ni avec la signature finale.
- Bannis TOUTES les formules de politesse poussiéreuses du XIXe siècle.
- Écris de manière synthétique, fluide et moderne (maximum 3 paragraphes courts séparés par des sauts de ligne).

Réponds UNIQUEMENT avec un objet JSON valide :
{
  "subject": "Intitulé exact du poste visé (ex: Assistant Administratif)",
  "content": "Uniquement les paragraphes du corps du texte (séparés par des sauts de ligne \\n\\n)"
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
            temperature: 0.7,
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
