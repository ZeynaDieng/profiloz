import { describe, expect, it } from 'vitest'
import { extractEducations } from './education'
import { extractExperiences } from './experience'

describe('extractExperiences', () => {
  it('ne fusionne jamais deux expériences distinctes', () => {
    const exps = extractExperiences([
      'Développeur senior chez Orange Sénégal 2020 - Présent',
      '- Migration vers Vue.js',
      'Chef de projet | Sonatel | 2017 - 2020',
    ])
    expect(exps.length).toBe(2)
    expect(exps[0]!.position).toMatch(/Développeur senior/i)
    expect(exps[0]!.company).toMatch(/Orange/i)
    expect(exps[1]!.position).toMatch(/Chef de projet/i)
  })

  it('rattache la description (puces) à la bonne expérience', () => {
    const exps = extractExperiences([
      'Assistant comptable chez Cabinet KPMG 2019 - 2020',
      '- Saisie des écritures',
      '- Rapprochements bancaires',
    ])
    expect(exps).toHaveLength(1)
    expect(exps[0]!.description).toContain('Saisie des écritures')
    expect(exps[0]!.description).toContain('Rapprochements bancaires')
  })

  it('sépare deux entreprises sur des blocs datés successifs', () => {
    const exps = extractExperiences([
      'Stagiaire développeur',
      'Sonatel',
      '2021 - 2022',
      'Stagiaire data',
      'Expresso',
      '2022 - 2023',
    ])
    expect(exps.length).toBe(2)
  })

  it('sépare la ville et le pays depuis la localisation', () => {
    const exps = extractExperiences([
      'Développeur chez Orange 2020 - 2022',
      'Dakar, Sénégal',
    ])
    expect(exps).toHaveLength(1)
    expect(exps[0]!.location).toBe('Dakar')
    expect(exps[0]!.country).toBe('Sénégal')
  })

  it('capte les compétences utilisées', () => {
    const exps = extractExperiences([
      'Développeur chez Orange 2020 - 2022',
      'Compétences utilisées : Vue.js, SQL, Docker',
    ])
    expect(exps).toHaveLength(1)
    expect(exps[0]!.skillsUsed).toEqual(['Vue.js', 'SQL', 'Docker'])
  })

  it('ne prend pas une description (puce sans marqueur) comme entreprise', () => {
    const exps = extractExperiences([
      'Développeuse Web Freelance (Sep 2024 - Aujourd\'hui)',
      'Création de sites vitrines, e-commerce et back-office pour TPE/PME',
      'Intégration responsive Figma vers code avec Tailwind',
    ])
    expect(exps).toHaveLength(1)
    expect(exps[0]!.position).toBe('Développeuse Web Freelance')
    expect(exps[0]!.company ?? '').toBe('')
    expect(exps[0]!.description).toContain('Création de sites vitrines')
  })

  it('garde un employeur multi-mots avec ville en suffixe (format « date d\'abord »)', () => {
    const exps = extractExperiences([
      'Mars 2024 à Avril 2024 Aide Soignante',
      'Poste de Santé Aïnoumadi Bène barak, Dakar',
    ])
    expect(exps).toHaveLength(1)
    expect(exps[0]!.position).toBe('Aide Soignante')
    expect(exps[0]!.company).toBe('Poste de Santé Aïnoumadi Bène barak')
    expect(exps[0]!.location).toBe('Dakar')
  })
})

describe('extractEducations', () => {
  it('produit des formations indépendantes', () => {
    const edus = extractEducations([
      'Master Informatique — UCAD — 2017',
      'Licence Mathématiques, Université Cheikh Anta Diop 2015',
    ])
    expect(edus.length).toBe(2)
    expect(edus[0]!.degree).toMatch(/Master/i)
    expect(edus[1]!.degree).toMatch(/Licence/i)
  })

  it('gère une entrée préfixée par la date', () => {
    const edus = extractEducations(['2021-2022 : Master Finance', 'HEC Paris'])
    expect(edus).toHaveLength(1)
    expect(edus[0]!.degree).toMatch(/Master Finance/i)
  })
})
