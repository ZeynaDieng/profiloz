import type { ExtractionMeta, ResumeSnapshot } from '@profiloz/shared'
import type { LlmEnhancer } from './llm'

export class GeminiLlmEnhancer implements LlmEnhancer {
  readonly name = 'gemini-1.5-flash'

  async enhance(input: {
    rawText: string
    lines: string[]
    data: Partial<ResumeSnapshot>
    meta: ExtractionMeta
  }): Promise<{ data: Partial<ResumeSnapshot>; meta: ExtractionMeta }> {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return { data: input.data, meta: input.meta }
    }

    try {
      const prompt = `Tu es un assistant IA spécialisé dans l'analyse et la structuration de CV professionnels.
Voici le texte brut extrait d'un CV :
---
${input.rawText}
---

Analyse le texte et réponds UNIQUEMENT avec un objet JSON valide suivant exactement cette structure :
{
  "personalInfo": {
    "fullName": "Nom et prénom (ex: Jean Dupont)",
    "jobTitle": "Titre du poste principal (ex: Développeur Full Stack)",
    "email": "Adresse email",
    "phone": "Numéro de téléphone",
    "location": "Ville / Pays",
    "linkedin": "Profil LinkedIn si présent",
    "website": "Site web ou portfolio",
    "summary": "Résumé de profil / accroche"
  },
  "experiences": [
    {
      "company": "Nom de l'entreprise",
      "position": "Intitulé du poste",
      "location": "Ville / Lieu",
      "startDate": "Date de début (ex: 2020-01)",
      "endDate": "Date de fin ou Présent",
      "current": true ou false,
      "description": "Description des tâches et réalisations"
    }
  ],
  "educations": [
    {
      "institution": "Nom de l'école ou université",
      "degree": "Diplôme ou certification",
      "fieldOfStudy": "Domaine d'études",
      "location": "Ville / Lieu",
      "startDate": "Année début",
      "endDate": "Année fin",
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

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
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
