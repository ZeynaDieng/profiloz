import { describe, expect, it } from 'vitest'
import { runResumePipeline } from '../modules/ocr/pipeline'
import { isExperienceDateLabel, isValidExperienceEntry } from '../modules/ocr/ocr.parser'

/** Reproduit le CV Sire Thiam (comptable) — puces « — » confondues avec des postes. */
const SIRE_THIAM_CV = `
SIRE THIAM SANE
Janvier 2025
sirethiamsane@gmail.com
+221 77 933 40 41
Dakar

COMPÉTENCES
Microsoft Word
Microsoft Excel
Microsoft PowerPoint

EXPÉRIENCE
Chargé des opérations comptables et de trésorerie — Prime Store
Dakar
Janvier 2025 — Présent
rigoureux — Réalisation des rapprochements bancaires et de trésorerie
Gestion quotidienne des opérations comptables (journaux, factures clients et fournisseurs)
Participation active aux clôtures mensuelles et annuelles
Assistante Comptable — Intech Group SAS - Dakar
Septembre 2024 — Décembre 2024
Suivi des encaissements et des décaissements
normes comptables en vigueur. — Participation active aux clôtures mensuelles
Stagiaire Trésorerie — Heliconia Senegal - Dakar
Mars 2024 — Août 2024
`.trim()

describe('CV comptable Sire Thiam — puces vs postes', () => {
  it('rejette une date comme poste visé', () => {
    expect(isExperienceDateLabel('Janvier 2025')).toBe(true)
  })

  it('ne transforme pas les missions « adjectif — verbe » en expériences', () => {
    expect(
      isValidExperienceEntry({
        position: 'rigoureux',
        company: 'Réalisation des rapprochements bancaires',
      }),
    ).toBe(false)
  })

  it('extrait 3 expériences réelles avec missions en description', async () => {
    const result = await runResumePipeline(SIRE_THIAM_CV, { ocrConfidence: 0.75 })

    expect(result.personalInfo?.fullName).toMatch(/SIRE THIAM SANE/i)
    expect(result.personalInfo?.jobTitle).not.toMatch(/janvier\s*2025/i)
    expect(result.personalInfo?.jobTitle).toMatch(/comptable|trésorerie|chargé/i)

    const exps = result.experiences ?? []
    expect(exps.length).toBe(3)

    expect(exps[0]!.position).toMatch(/Chargé des opérations comptables/i)
    expect(exps[0]!.company).toMatch(/Prime Store/i)
    expect(exps[0]!.description ?? '').toMatch(/rapprochements|Gestion quotidienne/i)

    expect(exps.some((e) => /rigoureux/i.test(e.position ?? '') && !e.description)).toBe(false)
    expect(exps.some((e) => /Réalisation des rapprochements/i.test(e.position ?? ''))).toBe(false)
    expect(exps.some((e) => /normes comptables en vigueur/i.test(e.position ?? ''))).toBe(false)

    expect(exps.some((e) => /Assistante Comptable/i.test(e.position ?? ''))).toBe(true)
    expect(exps.some((e) => /Stagiaire Trésorerie/i.test(e.position ?? ''))).toBe(true)
  })

  it('extrait le CV classique une colonne (poste + dates, employeur en dessous)', async () => {
    const classicCv = `
SIRE THIAM SANE
Yoff Océan, Dakar, Senegal | +221 77 933 40 41 | sirethiamsane@gmail.com

EXPÉRIENCES PROFESSIONNELLES
Chargé des opérations comptables et de trésorerie Janvier 2025 – Présent
Prime Store – Dakar, Almadies
Gestion quotidienne de la trésorerie

Assistante Comptable Juillet 2024 – Présent
Intech Group SAS – Dakar, Almadies

Stagiaire Trésorerie Septembre – Décembre 2023
Heliconia Senegal – Dakar, Ngor

Stagiaire Commercial Septembre – Octobre 2022
Orange Senegal – Dakar
`.trim()

    const result = await runResumePipeline(classicCv, { ocrConfidence: 0.85 })

    expect(result.personalInfo?.jobTitle).toMatch(/Chargé des opérations comptables/i)
    expect(result.personalInfo?.location).toMatch(/dakar/i)
    expect(result.experiences?.length).toBe(4)
    expect(result.experiences?.[0]?.company).toMatch(/Prime Store/i)
    expect(result.experiences?.[0]?.isCurrent).toBe(true)
    expect(result.experiences?.some((e) => /Intech Group/i.test(e.company ?? ''))).toBe(true)
    expect(result.experiences?.some((e) => /Heliconia/i.test(e.company ?? ''))).toBe(true)
    expect(result.experiences?.some((e) => /Orange Senegal/i.test(e.company ?? ''))).toBe(true)
  })
})
