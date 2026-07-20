import type { ExtractionMeta, ResumeSnapshot } from '@profiloz/shared'
import type { LlmEnhancer } from './llm'

export class GeminiLlmEnhancer implements LlmEnhancer {
  readonly name = 'gemini-3.5-flash'

  async enhance(input: {
    rawText: string
    lines: string[]
    data: Partial<ResumeSnapshot>
    meta: ExtractionMeta
    buffer?: Buffer
    mimeType?: string
  }): Promise<{ data: Partial<ResumeSnapshot>; meta: ExtractionMeta }> {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return { data: input.data, meta: input.meta }
    }

    try {
      const parts: any[] = []

      // 1. Si le buffer d'origine est disponible (PDF ou Image), on le transmet directement en Vision multimodale !
      if (
        input.buffer &&
        input.mimeType &&
        (input.mimeType.startsWith('image/') || input.mimeType === 'application/pdf')
      ) {
        parts.push({
          inlineData: {
            mimeType: input.mimeType,
            data: input.buffer.toString('base64'),
          },
        })
      }

      // 2. Consignes strictes d'extraction avec fidélité maximale
      const prompt = `Tu es un expert mondial en analyse et extraction de CV.
Examine avec une précision absolue le document de CV ci-joint (PDF/Image) ainsi que le texte extrait ci-dessous :
---
${input.rawText}
---

CONSIGNES STRICTES :
1. Extraction 100% fidèle : n'omets AUCUNE expérience professionnelle, AUCUN diplôme et AUCUNE compétence présents sur le document.
2. Pour chaque expérience professionnelle : extrait le nom de l'entreprise, le poste, les dates exactes, la ville et TOUTES les puces/descriptions détaillées des tâches. Ne résume pas les descriptions.
3. Pour la formation : extrait chaque établissement, le nom exact du diplôme et les dates.
4. Pour les compétences : extrait TOUTES les compétences techniques, outils et savoir-être mentionnés.

Réponds UNIQUEMENT avec un objet JSON valide suivant exactement cette structure :
{
  "personalInfo": {
    "fullName": "Nom et prénom exacts",
    "jobTitle": "Titre du poste principal",
    "email": "Email",
    "phone": "Téléphone",
    "location": "Ville / Pays",
    "linkedin": "Lien LinkedIn si présent",
    "website": "Site web / Portfolio",
    "summary": "Résumé de profil ou accroche intégrale"
  },
  "experiences": [
    {
      "company": "Nom de l'entreprise",
      "position": "Intitulé du poste",
      "location": "Ville / Lieu",
      "startDate": "Date de début (ex: 2020-01 ou 2020)",
      "endDate": "Date de fin (ex: 2022 ou Présent)",
      "current": true ou false,
      "description": "Toutes les puces / tâches réalisées de manière intégrale"
    }
  ],
  "educations": [
    {
      "institution": "Nom de l'école ou université",
      "degree": "Diplôme ou formation",
      "fieldOfStudy": "Domaine d'études",
      "location": "Ville / Lieu",
      "startDate": "Date début",
      "endDate": "Date fin",
      "description": "Détails"
    }
  ],
  "skills": [
    { "name": "Nom de la compétence", "category": "Technique / Humaine / Outil" }
  ],
  "languages": [
    { "language": "Langue", "level": "Niveau (ex: Courant, Bilingue, Notions)" }
  ]
}

Ne rajoute AUCUN texte explicatif, ni balises markdown. Réponds directement par le JSON.`

      parts.push({ text: prompt })

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          }),
        },
      )

      if (!response.ok) {
        console.warn('Gemini API call failed:', await response.text())
        return { data: input.data, meta: input.meta }
      }

      const resData = await response.json()
      const textOutput = resData.candidates?.[0]?.content?.parts?.[0]?.text
      if (!textOutput) {
        return { data: input.data, meta: input.meta }
      }

      const parsed = JSON.parse(textOutput)

      const mergedData: Partial<ResumeSnapshot> = {
        ...input.data,
        personalInfo: {
          ...input.data.personalInfo,
          ...(parsed.personalInfo || {}),
        },
        experiences:
          Array.isArray(parsed.experiences) && parsed.experiences.length > 0
            ? parsed.experiences
            : input.data.experiences,
        educations:
          Array.isArray(parsed.educations) && parsed.educations.length > 0
            ? parsed.educations
            : input.data.educations,
        skills:
          Array.isArray(parsed.skills) && parsed.skills.length > 0
            ? parsed.skills
            : input.data.skills,
        languages:
          Array.isArray(parsed.languages) && parsed.languages.length > 0
            ? parsed.languages
            : input.data.languages,
      }

      return {
        data: mergedData,
        meta: {
          ...input.meta,
          engine: 'heuristic+llm',
        },
      }
    } catch (err) {
      console.warn('Gemini enhancement error:', err)
      return { data: input.data, meta: input.meta }
    }
  }
}

export const geminiLlmEnhancer = new GeminiLlmEnhancer()
