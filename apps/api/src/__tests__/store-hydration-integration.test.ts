import { describe, expect, it } from 'vitest'
import { runResumePipeline } from '../modules/ocr/pipeline'

describe('Store Hydration & Form Normalization Verification', () => {
  it('secures full extraction and normalization for form inputs', async () => {
    const rawCv = `
Aissatou Sow
Responsable Marketing Digital
aissatou.sow@gmail.com
+221 77 123 45 67
Dakar, Sénégal

PROFIL
Spécialiste du marketing digital avec 5 ans d'expérience dans l'acquisition de clients et la gestion de campagnes publicitaires.

EXPÉRIENCES
Chef de Projet Digital — Sonatel
Dakar, Sénégal
Janvier 2022 — Présent
- Gestion du budget marketing digital de 50M FCFA
- Augmentation du trafic web de 45% en 1 an

Consultante SEO / SEA — Wave Mobile Money
Dakar, Sénégal
Juin 2020 — Décembre 2021
- Optimisation des campagnes Google Ads et Meta Ads

FORMATION
Master en Marketing Digital — Université Cheikh Anta Diop (UCAD)
Dakar
2018 — 2020

COMPÉTENCES
Google Ads, Meta Ads, SEO, Google Analytics, Copywriting

LANGUES
Français (Courant), Anglais (Intermédiaire), Wolof (Langue maternelle)
`.trim()

    const extracted = await runResumePipeline(rawCv, { ocrConfidence: 0.9 })

    // Verification 1: Personal info extraction
    expect(extracted.personalInfo?.fullName).toMatch(/Aissatou Sow/i)
    expect(extracted.personalInfo?.jobTitle).toMatch(/Responsable Marketing/i)
    expect(extracted.personalInfo?.email).toBe('aissatou.sow@gmail.com')
    expect(extracted.personalInfo?.phone).toMatch(/\+221\s*77\s*123\s*45\s*67/)
    expect(extracted.personalInfo?.location).toMatch(/Dakar/i)

    // Verification 2: Summary / Profile
    expect(extracted.summary).toMatch(/Spécialiste du marketing digital/i)

    // Verification 3: Experiences
    expect(extracted.experiences?.length).toBeGreaterThanOrEqual(2)
    expect(extracted.experiences?.[0]?.company).toMatch(/Sonatel/i)
    expect(extracted.experiences?.[0]?.position).toMatch(/Chef de Projet Digital/i)

    // Verification 4: Educations
    expect(extracted.educations?.length).toBeGreaterThanOrEqual(1)
    expect(extracted.educations?.[0]?.institution).toMatch(/UCAD|Université Cheikh Anta Diop/i)

    // Verification 5: Skills
    expect(extracted.skills?.length).toBeGreaterThanOrEqual(3)

    // Verification 6: Languages
    expect(extracted.languages?.length).toBeGreaterThanOrEqual(2)
  })

  it('handles raw scanned OCR text cleanly', async () => {
    const scannedOcrText = `
MAMADOU DIALLO
Ingénieur Logiciel Fullstack
mamadou.diallo@email.sn
778901234
Saint-Louis, Senegal

EXPERIENCE
Développeur Web — Teranga Tech
2021 — 2024
Développement d'applications Vue.js et Node.js.

EDUCATION
Licence Informatique — UGB Saint-Louis
2017 — 2020

COMPETENCES
JavaScript, TypeScript, Python, Docker, PostgreSQL
`.trim()

    const extracted = await runResumePipeline(scannedOcrText, { ocrConfidence: 0.65 })

    expect(extracted.personalInfo?.fullName).toMatch(/MAMADOU DIALLO/i)
    expect(extracted.personalInfo?.jobTitle).toMatch(/Ingénieur Logiciel/i)
    expect(extracted.personalInfo?.email).toBe('mamadou.diallo@email.sn')
    expect(extracted.personalInfo?.phone).toMatch(/778901234/)
    expect(extracted.experiences?.length).toBeGreaterThanOrEqual(1)
    expect(extracted.educations?.length).toBeGreaterThanOrEqual(1)
    expect(extracted.skills?.length).toBeGreaterThanOrEqual(3)
  })
})
