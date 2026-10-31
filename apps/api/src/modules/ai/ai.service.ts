import { stripLetterFormulas } from '@profiloz/shared'
import { AppError } from '@/lib/errors'

/**
 * Modèles essayés dans l'ordre : si l'un est surchargé (503) ou trop lent, on passe au suivant.
 * Mesuré le 31/10/2026 : 3.5-flash-lite répond en 2 à 4 s, 3.1-flash-lite renvoyait souvent 503 ou 20 s.
 */
const GEMINI_MODELS = ['gemini-3.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.1-flash-lite']
const GEMINI_TIMEOUT_MS = 15_000

type GeminiConfig = {
  temperature: number
  maxOutputTokens: number
  json?: boolean
}

/** Retire un éventuel bloc ```json … ``` autour de la réponse avant de la lire. */
function parseJsonOutput(text: string): unknown {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  return JSON.parse(cleaned)
}

export class AiService {
  private getApiKey(): string {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new AppError(503, 'Service Unavailable', 'L’API IA Gemini n’est pas configurée.')
    }
    return apiKey
  }

  /** Texte brut de la réponse, ou null si aucun modèle n'a renvoyé de réponse exploitable. */
  private async callGemini(prompt: string, config: GeminiConfig): Promise<string | null> {
    const apiKey = this.getApiKey()
    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        ...(config.json ? { responseMimeType: 'application/json' } : {}),
        temperature: config.temperature,
        maxOutputTokens: config.maxOutputTokens,
        // Pas de « réflexion » : plus rapide, et elle ne grignote plus la limite de tokens de la réponse
        thinkingConfig: { thinkingLevel: 'minimal' },
      },
    })

    for (const model of GEMINI_MODELS) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
            signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
          },
        )
        if (res.ok) {
          const data = await res.json()
          const parts: Array<{ text?: string }> = data.candidates?.[0]?.content?.parts ?? []
          const text = parts.map((part) => part.text ?? '').join('').trim()
          if (text) return text
          console.warn(`[ai] ${model} : réponse vide (${data.candidates?.[0]?.finishReason ?? 'inconnu'})`)
        } else {
          console.warn(`[ai] ${model} : HTTP ${res.status}`)
          // Clé invalide, requête refusée… : un autre modèle n'y changera rien
          if (res.status === 400 || res.status === 401 || res.status === 403) return null
        }
      } catch (error) {
        // Délai dépassé ou réseau : on passe au modèle suivant
        console.warn(`[ai] ${model} : ${(error as Error).name}`)
      }
    }
    return null
  }

  async enhanceText(rawText: string, rawContext?: string): Promise<string> {
    if (!rawText || !rawText.trim()) return rawText
    const text = rawText.trim().slice(0, 1000)
    const context = rawContext ? rawContext.trim().slice(0, 500) : ''

    const prompt = `Tu es un rédacteur professionnel et un coach de carrière humain.
Améliore ce texte de CV pour qu'il soit percutant, élégant, sans fautes, mais surtout TRÈS HUMAIN et fluide.
Consignes :
- Évite absolument les expressions robotiques ou clichés corporate (ex: "facilitateur", "catalyseur", "synergie", "passionné par", "ayant à cœur de", "forte valeur ajoutée").
- Privilégie un ton authentique, sincère, direct et simple, en t'appuyant uniquement sur les faits fournis.
- N'invente AUCUN fait : pas de chiffre, durée d'expérience, entreprise, diplôme ou résultat absent du texte ou du contexte. S'il manque une information, reste général plutôt que de la deviner.
- Sois concis : pas de phrases à rallonge ou de jargon de remplissage.
${context ? `Contexte : ${context}` : ''}
Texte à améliorer : "${text}"

Réponds UNIQUEMENT avec le texte final amélioré, prêt à être inséré. Aucune introduction, aucune conclusion, aucun commentaire, pas de guillemets autour.`

    const output = await this.callGemini(prompt, { temperature: 0.6, maxOutputTokens: 512 })
    if (!output) {
      throw new AppError(502, 'Bad Gateway', 'L’IA est momentanément indisponible. Réessayez dans un instant.')
    }
    return output
  }

  async suggestBullets(rawJobTitle: string): Promise<string[]> {
    if (!rawJobTitle || !rawJobTitle.trim()) return []
    const jobTitle = rawJobTitle.trim().slice(0, 100)

    const prompt = `Pour le poste de "${jobTitle}", génère 5 puces de réalisations professionnelles concrètes et variées pour un CV.
Consignes strictes :
- Sois TRÈS humain, moderne et réaliste. Évite les puces génériques et robotiques.
- Chaque puce doit commencer par un verbe d'action différent (ex: "Coordonner", "Optimiser", "Négocier", "Piloter").
- Rédige des phrases courtes (10 à 15 mots maximum par puce) qui décrivent un résultat tangible.
- Propose des tâches spécifiques au secteur de "${jobTitle}" pour éviter les répétitions d'un métier à un autre.
- N'invente pas de chiffres précis (pourcentages, montants, effectifs) : ce sont des suggestions que le candidat adaptera à son parcours réel.

Réponds UNIQUEMENT avec un tableau JSON de chaînes de caractères valide, sans texte autour :
[
  "Réalisation spécifique 1...",
  "Réalisation spécifique 2...",
  "Réalisation spécifique 3...",
  "Réalisation spécifique 4...",
  "Réalisation spécifique 5..."
]`

    const textOutput = await this.callGemini(prompt, { temperature: 0.7, maxOutputTokens: 512, json: true })
    if (!textOutput) return []

    try {
      const parsed = parseJsonOutput(textOutput)
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
    } catch {
      return []
    }
  }

  async generateLetter(input: {
    jobOfferText: string
    candidateInfo?: string
    candidateName?: string
    targetCompany?: string
    targetPosition?: string
  }): Promise<{ content: string; subject: string }> {
    const jobOfferText = (input.jobOfferText || '').trim().slice(0, 3000)
    const candidateInfo = input.candidateInfo ? input.candidateInfo.trim().slice(0, 1000) : ''
    const candidateName = input.candidateName ? input.candidateName.trim().slice(0, 80) : ''
    const targetCompany = input.targetCompany ? input.targetCompany.trim().slice(0, 100) : ''
    const targetPosition = input.targetPosition ? input.targetPosition.trim().slice(0, 100) : ''
    if (!jobOfferText && !targetPosition) {
      throw new AppError(400, 'Bad Request', 'Collez l’offre d’emploi ou indiquez au moins le poste visé.')
    }

    const prompt = `Rédige le corps d'une lettre de motivation captivante, directe et profondément HUMAINE en français.

${jobOfferText ? `Offre d'emploi : ${jobOfferText}` : 'Aucune offre fournie : candidature pour le poste ci-dessous.'}
${targetPosition ? `Poste visé : ${targetPosition}` : ''}
${targetCompany ? `Entreprise : ${targetCompany}` : ''}
${candidateName ? `Nom du candidat : ${candidateName}` : ''}
${candidateInfo ? `Profil du candidat :\n${candidateInfo}` : 'Profil du candidat : non fourni.'}

Adaptation à l'offre (le plus important) :
- Repère dans l'offre les 2 ou 3 attentes principales (missions, compétences, qualités) et réponds-y explicitement.
- Relie chaque attente à un élément RÉEL du profil (expérience, formation, compétence) en le nommant précisément.
- Cite l'entreprise et le poste par leur nom quand ils sont connus.

${candidateInfo ? '' : `Profil absent (règle impérative) :
- Le candidat n'a rien dit de son parcours : n'affirme AUCUNE expérience passée, aucun employeur, aucun outil déjà maîtrisé ("Mon parcours m'a permis…", "Habitué à…", "Fort de mon expérience…" sont interdits).
- Parle de sa motivation, de ce qu'il a compris du poste et de ce qu'il s'engage à apporter, au présent ou au futur.
- N'écris pas non plus qu'il remplit une exigence de l'offre ("possédant le permis B", "titulaire du diplôme", "je maîtrise Excel") : il le précisera lui-même.
`}
Accord en genre :
- Déduis le genre uniquement du prénom du candidat s'il est fourni et sans ambiguïté.
- Sinon, écris sans adjectif ni participe accordé au candidat (évite "prêt/prête", "convaincu/convaincue", "ravi/ravie", "habitué/habituée", "heureux/heureuse") : préfère "je souhaite", "j'ai à cœur", "c'est avec enthousiasme que".

Consignes de structure et de style STRICTES :
- Ne génère QUE les 3 paragraphes centraux du corps du message (Vous / Moi / Nous).
- NE réponds PAS avec les en-têtes (pas d'adresse expéditeur/destinataire, pas de "À l'attention de...").
- NE réponds PAS avec la ligne d'objet ("Objet : ...") car elle est affichée séparément par le modèle.
- NE réponds PAS avec la formule d'appel ("Madame, Monsieur," ou "Mme Ndiaye,").
- NE réponds PAS avec la formule de politesse de fin ("Veuillez agréer...", "Je vous prie d'agréer...") ni avec la signature finale.
- Bannis TOUTES les formules de politesse poussiéreuses du XIXe siècle.
- Écris de manière synthétique, fluide et moderne : 3 paragraphes de 2 à 4 phrases, 180 à 260 mots au total.
- Dans les phrases, écris l'intitulé du poste en minuscules ("un poste de développeur web junior"), sauf noms propres et sigles, qui restent en majuscules (B2B, PME, RH, permis B).
- Le candidat ne fait pas encore partie de l'entreprise : dis "vos offres", "votre équipe", jamais "nos offres".
- Une exigence de l'offre (permis, diplôme, langue, outil) n'est attribuée au candidat que si son profil la mentionne.
- Évite les clichés : "forte valeur ajoutée", "passionné", "dynamique et motivé", "relever des défis", "synergie".
- N'invente AUCUN fait : pas de chiffre, durée d'expérience, entreprise, diplôme ou résultat absent du profil du candidat ou de l'offre. S'il manque une information, reste général plutôt que de la deviner.

Réponds UNIQUEMENT avec un objet JSON valide :
{
  "subject": "Intitulé exact du poste visé (ex: Assistant Administratif)",
  "content": "Uniquement les paragraphes du corps du texte (séparés par des sauts de ligne \\n\\n)"
}`

    const textOutput = await this.callGemini(prompt, { temperature: 0.7, maxOutputTokens: 1536, json: true })
    if (!textOutput) {
      throw new AppError(502, 'Bad Gateway', 'L’IA est momentanément indisponible. Réessayez dans un instant.')
    }

    let parsed: { subject?: unknown; content?: unknown } = {}
    try {
      parsed = (parseJsonOutput(textOutput) as typeof parsed) ?? {}
    } catch {
      // Réponse hors JSON : on garde le texte tel quel plutôt que d'échouer
      parsed = { content: textOutput }
    }
    // Le modèle de lettre affiche déjà « Madame, Monsieur » et la politesse finale : pas de doublon
    const content = typeof parsed.content === 'string' ? stripLetterFormulas(parsed.content) : ''
    if (!content) {
      throw new AppError(502, 'Bad Gateway', 'L’IA n’a pas pu rédiger la lettre. Réessayez dans un instant.')
    }
    return {
      subject: typeof parsed.subject === 'string' && parsed.subject.trim() ? parsed.subject.trim() : targetPosition || 'Candidature',
      content,
    }
  }
}

export const aiService = new AiService()
