import type { ExtractionMeta, ResumeSnapshot } from '@profiloz/shared'
import type { LlmEnhancer } from './llm'
import { cropPhotoFromBuffer, compressImageForAi } from './crop-photo'
import { renderPdfPagesToImages } from '../ocr.service'

export class GeminiLlmEnhancer implements LlmEnhancer {
  readonly name = 'gemini-3.1-flash-lite'

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

      // 1. Transmettre le buffer du document (PDF ou Image) avec compression si image lourde
      if (
        input.buffer &&
        input.mimeType &&
        (input.mimeType.startsWith('image/') || input.mimeType === 'application/pdf')
      ) {
        let payloadBuffer = input.buffer
        let payloadMime = input.mimeType

        if (input.mimeType.startsWith('image/')) {
          const compressed = await compressImageForAi(input.buffer)
          payloadBuffer = compressed.buffer
          payloadMime = compressed.mimeType
        }

        parts.push({
          inlineData: {
            mimeType: payloadMime,
            data: payloadBuffer.toString('base64'),
          },
        })
      }

      // 2. Consignes strictes d'extraction avec Résumé (Profil) et Détection de Photo de Profil
      const prompt = `Tu es un expert mondial en analyse et extraction de CV.
Examine avec une précision absolue le document de CV ci-joint (PDF/Image) ainsi que le texte extrait ci-dessous :
---
${input.rawText}
---

CONSIGNES STRICTES :
1. "summary" (Profil / À propos / Résumé professionnel) : S'il y a un texte d'accroche, un paragraphe de présentation ou de profil en haut du CV, extrait-le INTÉGRALEMENT dans le champ "summary". N'omets aucun mot du profil.
2. "photo" (Photo de portrait du candidat) : Si le document contient une photo de portrait du candidat, indique "present": true et donne sa bounding box [ymin, xmin, ymax, xmax] (normalisée 0 à 1000). ATTENTION : Recadre ÉTROITEMENT et UNIQUEMENT sur le visage et le haut des épaules du candidat. EXCLUS impérativement tous les éléments extérieurs : contours, cadres, bordures circulaires, anneaux colorés ou motifs graphiques du modèle de CV d'origine.
3. Expériences professionnelles : Extrait TOUTES les expériences sans omission, avec l'entreprise, le poste, les dates et TOUTES les descriptions de tâches intégrales.
4. Formations, Compétences et Langues : Extrait tout fidèlement.

Réponds UNIQUEMENT avec un objet JSON valide suivant exactement cette structure :
{
  "summary": "Texte intégral du profil / à propos / résumé professionnel (null si absent)",
  "photo": {
    "present": true ou false,
    "box": [ymin, xmin, ymax, xmax] (coordonnées 0..1000 du visage/photo si présente, sinon null)
  },
  "personalInfo": {
    "fullName": "Nom et prénom exacts",
    "jobTitle": "Titre du poste principal",
    "email": "Email",
    "phone": "Téléphone",
    "location": "Ville / Pays",
    "linkedin": "Lien LinkedIn si présent",
    "website": "Site web / Portfolio",
    "summary": "Même résumé de profil qu'au dessus"
  },
  "experiences": [
    {
      "company": "Nom de l'entreprise",
      "position": "Intitulé du poste",
      "location": "Ville / Lieu",
      "startDate": "Date de début",
      "endDate": "Date de fin",
      "current": true ou false,
      "description": "Description intégrale des tâches"
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
    { "language": "Langue", "level": "Niveau" }
  ]
}

Ne rajoute AUCUN texte explicatif, ni balises markdown. Réponds directement par le JSON.`

      parts.push({ text: prompt })

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1,
              maxOutputTokens: 2048,
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

      // Extraction du Résumé (Profil) au niveau racine du snapshot
      const extractedSummary =
        (typeof parsed.summary === 'string' && parsed.summary.trim()) ||
        (typeof parsed.personalInfo?.summary === 'string' && parsed.personalInfo.summary.trim()) ||
        input.data.summary

      // Extraction et découpage automatique de la photo de profil si présente
      let extractedPhotoUrl: string | undefined = input.data.personalInfo?.photoUrl

      if (parsed.photo?.present && Array.isArray(parsed.photo?.box) && input.buffer) {
        try {
          let imageBufferToCrop: Buffer | null = null

          if (input.mimeType?.startsWith('image/')) {
            imageBufferToCrop = input.buffer
          } else if (input.mimeType === 'application/pdf') {
            const pages = await renderPdfPagesToImages(input.buffer)
            if (pages.length > 0 && pages[0]) {
              imageBufferToCrop = pages[0]
            }
          }

          if (imageBufferToCrop) {
            const croppedDataUrl = await cropPhotoFromBuffer(
              imageBufferToCrop,
              parsed.photo.box as [number, number, number, number],
            )
            if (croppedDataUrl) {
              extractedPhotoUrl = croppedDataUrl
            }
          }
        } catch (cropErr) {
          console.warn('Photo extraction failed:', cropErr)
        }
      }

      const mergedData: Partial<ResumeSnapshot> = {
        ...input.data,
        summary: extractedSummary,
        personalInfo: {
          ...input.data.personalInfo,
          ...(parsed.personalInfo || {}),
          photoUrl: extractedPhotoUrl,
          summary: extractedSummary,
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
