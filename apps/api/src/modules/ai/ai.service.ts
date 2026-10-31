import { stripLetterFormulas } from '@profiloz/shared'
import { AppError } from '@/lib/errors'
import { callGemini, isGeminiConfigured, parseJsonOutput } from '@/lib/gemini'

/** Textes courts de l'éditeur : réponse attendue en quelques secondes. */
const TEXT_TIMEOUT_MS = 15_000
const TEXT_BUDGET_MS = 30_000

export type EnhanceKind = 'summary' | 'experience' | 'letter' | 'generic'

const UNAVAILABLE = 'L’IA est momentanément indisponible. Réessayez dans un instant.'

const STYLE_RULES = `- Ton authentique, direct et simple ; pas de clichés ("facilitateur", "catalyseur", "synergie", "passionné par", "forte valeur ajoutée", "dynamique et motivé").
- N'invente AUCUN fait : pas de chiffre, durée, entreprise, diplôme, outil ou résultat absent du texte ou du contexte. S'il manque une information, reste général.
- Garde la langue du texte d'origine (français par défaut) et corrige l'orthographe.
- Genre : accorde selon le prénom du candidat s'il est donné dans le contexte et sans ambiguïté, ou si le texte d'origine le fait déjà ; sinon évite les adjectifs et participes accordés ("habitué", "fort de", "motivé", "rigoureux") au profit de tournures neutres ("maîtrise de…", "sens de la rigueur"). N'écris jamais les deux genres côte à côte ("rigoureux, rigoureuse").
- N'écris jamais le nom du candidat dans le texte et n'en parle pas à la troisième personne ("il", "elle", "Fatou assure…").
- Si le contexte ne donne que le poste visé (sans expérience ni formation), n'affirme AUCUNE expérience passée ("solide expérience", "plusieurs années") : décris les compétences du métier et l'objectif professionnel.`

const KIND_RULES: Record<EnhanceKind, { improve: string; draft: string }> = {
  summary: {
    improve: `Réécris ce profil de CV (accroche en haut du CV) : 2 à 4 phrases, 300 à 550 caractères, à la première personne implicite (sans "je" en début de chaque phrase).`,
    draft: `Rédige un profil de CV (accroche en haut du CV) de 2 à 4 phrases, 300 à 550 caractères, uniquement à partir du contexte fourni.`,
  },
  experience: {
    improve: `Réécris cette description d'expérience de CV en 3 à 6 puces commençant par "- " et un verbe d'action, une puce par ligne. Conserve TOUTES les missions présentes dans le texte, sans en supprimer.`,
    draft: `Rédige une description d'expérience de CV en 3 à 5 puces commençant par "- " et un verbe d'action, une puce par ligne, typiques du poste indiqué dans le contexte, sans chiffre inventé.`,
  },
  letter: {
    improve: `Réécris ce corps de lettre de motivation en 3 paragraphes séparés par une ligne vide, sans formule d'appel ("Madame, Monsieur") ni formule de politesse finale ni signature.`,
    draft: `Rédige un corps de lettre de motivation en 3 paragraphes séparés par une ligne vide, sans formule d'appel ni formule de politesse finale ni signature.`,
  },
  generic: {
    improve: `Améliore ce texte de CV pour qu'il soit clair, percutant et sans fautes, en gardant sa structure (puces, retours à la ligne).`,
    draft: `Rédige un court texte de CV adapté au contexte fourni.`,
  },
}

/** Retire ce qu'un modèle ajoute parfois autour du texte (guillemets, « Voici… », titres en gras). */
export function cleanGeneratedText(raw: string): string {
  let text = raw.trim()
  text = text.replace(/^(?:voici|voilà)[^\n]*:\s*\n+/i, '')
  text = text.replace(/^\*\*[^*\n]+\*\*\s*\n+/, '')
  if (/^["«“]/.test(text) && /["»”]$/.test(text)) text = text.slice(1, -1).trim()
  // Puces Markdown « * » ou « • » → « - », comme dans l'éditeur
  text = text.replace(/^[ \t]*[*•●▪]\s+/gm, '- ')
  return text.replace(/\n{3,}/g, '\n\n').trim()
}

export class AiService {
  private ensureConfigured() {
    if (!isGeminiConfigured()) {
      throw new AppError(503, 'Service Unavailable', 'L’API IA Gemini n’est pas configurée.')
    }
  }

  private async ask(prompt: string, options: { temperature: number; maxOutputTokens: number; json?: boolean }) {
    this.ensureConfigured()
    return callGemini({
      parts: [{ text: prompt }],
      ...options,
      timeoutMs: TEXT_TIMEOUT_MS,
      budgetMs: TEXT_BUDGET_MS,
      label: 'ai',
    })
  }

  /**
   * Améliore un texte de CV, ou en rédige un brouillon s'il est vide (à partir du contexte).
   * Les textes longs ne sont plus tronqués : jusqu'à 4 000 caractères sont envoyés.
   */
  async enhanceText(rawText: string, rawContext?: string, kind: EnhanceKind = 'generic'): Promise<string> {
    const text = (rawText ?? '').trim().slice(0, 4000)
    const context = rawContext ? rawContext.trim().slice(0, 2000) : ''
    if (!text && !context) {
      throw new AppError(400, 'Bad Request', 'Indiquez au moins le poste visé pour que l’IA puisse rédiger.')
    }

    const rules = KIND_RULES[kind] ?? KIND_RULES.generic
    const prompt = `Tu es un rédacteur de CV professionnel et humain.
${text ? rules.improve : rules.draft}

Consignes :
${STYLE_RULES}
${context ? `\nContexte (faits sur le candidat) :\n${context}\n` : ''}
${text ? `Texte à améliorer :\n"""\n${text}\n"""\n` : ''}
Réponds UNIQUEMENT avec le texte final, prêt à être inséré : aucune introduction, aucun commentaire, pas de guillemets autour, pas de Markdown en gras.`

    const output = await this.ask(prompt, { temperature: 0.5, maxOutputTokens: 2048 })
    const cleaned = output ? cleanGeneratedText(output) : ''
    if (!cleaned) throw new AppError(502, 'Bad Gateway', UNAVAILABLE)
    return kind === 'letter' ? stripLetterFormulas(cleaned) || cleaned : cleaned
  }

  async suggestBullets(rawJobTitle: string, rawContext?: string): Promise<string[]> {
    const jobTitle = (rawJobTitle ?? '').trim().slice(0, 100)
    if (!jobTitle) {
      throw new AppError(400, 'Bad Request', 'Indiquez d’abord l’intitulé du poste.')
    }
    const context = rawContext ? rawContext.trim().slice(0, 1500) : ''

    const prompt = `Pour le poste de "${jobTitle}", propose 5 puces de missions ou réalisations concrètes et variées pour un CV.
Consignes strictes :
- Chaque puce commence par un verbe d'action différent (ex : "Coordonner", "Optimiser", "Négocier", "Piloter").
- Phrases courtes : 8 à 15 mots par puce, spécifiques au métier de "${jobTitle}".
- N'invente pas de chiffres précis (pourcentages, montants, effectifs) : le candidat adaptera à son parcours réel.
${context ? `- Ne répète pas ce que la description actuelle contient déjà :\n"""\n${context}\n"""` : ''}

Réponds UNIQUEMENT avec un tableau JSON de 5 chaînes de caractères, sans texte autour.`

    const textOutput = await this.ask(prompt, { temperature: 0.7, maxOutputTokens: 1024, json: true })
    if (!textOutput) throw new AppError(502, 'Bad Gateway', UNAVAILABLE)

    let parsed: unknown
    try {
      parsed = parseJsonOutput(textOutput)
    } catch {
      // Réponse hors JSON : une puce par ligne
      parsed = textOutput.split('\n')
    }
    const list = Array.isArray(parsed) ? parsed : Array.isArray((parsed as { bullets?: unknown })?.bullets) ? (parsed as { bullets: unknown[] }).bullets : []
    const seen = new Set<string>()
    const bullets = list
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.replace(/^[\s\-*•●▪\d.)]+/, '').trim())
      .filter((item) => {
        const key = item.toLowerCase()
        if (item.length < 6 || seen.has(key)) return false
        seen.add(key)
        return true
      })
      .slice(0, 5)
    if (bullets.length === 0) throw new AppError(502, 'Bad Gateway', UNAVAILABLE)
    return bullets
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

    const textOutput = await this.ask(prompt, { temperature: 0.7, maxOutputTokens: 1536, json: true })
    if (!textOutput) {
      throw new AppError(502, 'Bad Gateway', UNAVAILABLE)
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
