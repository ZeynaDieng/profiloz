import { describe, expect, it } from 'vitest'
import { augmentContact } from './contact'
import { extractLanguages } from './languages'
import { extractSkills } from './skills'

describe('extractLanguages', () => {
  it('reconnaît les langues et leur niveau (formes variées)', () => {
    const langs = extractLanguages(['Français — Courant', 'Anglais : B2', 'Wolof (langue maternelle)'])
    const byName = Object.fromEntries(langs.map((l) => [l.name, l.level]))
    expect(byName['Français']).toBe('PROFESSIONAL')
    expect(byName['Anglais']).toBe('CONVERSATIONAL')
    expect(byName['Wolof']).toBe('NATIVE')
  })

  it('reconnaît Pulaar (variantes) et les niveaux « bien / très bien / les bases »', () => {
    const langs = extractLanguages([
      'Français : Bien | Anglais : Technique | Wolof : Très bien | Pullar : Les bases',
    ])
    const by = Object.fromEntries(langs.map((l) => [l.name, l.level]))
    expect(by['Français']).toBe('CONVERSATIONAL')
    expect(by['Wolof']).toBe('PROFESSIONAL')
    expect(by['Pulaar']).toBe('BASIC')
  })

  it('gère une liste sur une seule ligne', () => {
    const langs = extractLanguages(['Français, Anglais, Espagnol, Arabe'])
    expect(langs.map((l) => l.name)).toEqual(['Français', 'Anglais', 'Espagnol', 'Arabe'])
  })

  it('parse les niveaux CEFR sur une ligne Europass', () => {
    const langs = extractLanguages(['Français (C2) — Anglais (B2)'])
    expect(langs.map((l) => l.name)).toEqual(['Français', 'Anglais'])
    expect(langs[0]!.level).toBe('PROFESSIONAL')
    expect(langs[1]!.level).toBe('CONVERSATIONAL')
  })
})

describe('extractSkills', () => {
  it('nettoie, déduplique et garde les compétences en majuscules', () => {
    const skills = extractSkills([
      { kind: 'skills', headerText: 'Compétences', lines: ['JavaScript, Vue.js, Node.js', 'HYGIÈNE ET CONTACT PATIENT'] },
    ])
    const names = skills.map((s) => s.name)
    expect(names).toContain('JavaScript')
    expect(names).toContain('HYGIÈNE ET CONTACT PATIENT')
    expect(new Set(names).size).toBe(names.length)
  })

  it('retire les préfixes de catégorie (« Langages : », « UI/Design : »)', () => {
    const skills = extractSkills([
      {
        kind: 'skills',
        headerText: 'Compétences Techniques',
        lines: [
          'Langages : JavaScript, TypeScript, PHP',
          'UI/Design : Tailwind CSS, Bootstrap',
        ],
      },
    ])
    const names = skills.map((s) => s.name)
    expect(names).toContain('JavaScript')
    expect(names).toContain('Tailwind CSS')
    // Aucun token ne doit conserver le libellé de catégorie ni le « : ».
    expect(names.some((n) => /langages|design\b|:/i.test(n))).toBe(false)
  })

  it('catégorise Hard / Soft selon le titre du bloc', () => {
    const skills = extractSkills([
      { kind: 'skills', headerText: 'Hard Skills', lines: ['Python, SQL'] },
      { kind: 'skills', headerText: 'Soft Skills', lines: ['Communication, Leadership'] },
    ])
    expect(skills.find((s) => s.name === 'Python')?.category).toBe('Hard skills')
    expect(skills.find((s) => s.name === 'Communication')?.category).toBe('Soft skills')
  })

  it('consolide les listes à deux-points sans éclater en fragments', () => {
    const skills = extractSkills([
      {
        kind: 'skills',
        headerText: 'Compétences clés',
        lines: [
          'Trésorerie & Finance',
          'Gestion de trésorerie : suivi des flux, prévisions, contrôle des soldes bancaires',
          'Outils Informatiques',
          'SAGE 100 Comptabilité',
          'Microsoft Excel',
          'Microsoft Word & PowerPoint',
        ],
      },
    ])
    const names = skills.map((s) => s.name)
    expect(names).toContain('Gestion de trésorerie')
    expect(names).toContain('SAGE 100 Comptabilité')
    expect(names).toContain('Microsoft Excel')
    expect(names).not.toContain('suivi des flux')
    expect(names).not.toContain('Trésorerie & Finance')
    expect(names).not.toContain('Outils Informatiques')
  })
})

describe('augmentContact', () => {
  it('détecte email, LinkedIn, GitHub et portfolio sans écraser l’existant', () => {
    const raw = [
      'Awa Ndiaye',
      'awa.ndiaye@mail.com',
      'https://linkedin.com/in/awandiaye',
      'github.com/awandiaye',
      'www.awa-portfolio.com',
    ].join('\n')
    const info = augmentContact({ fullName: 'Awa Ndiaye' }, raw)
    expect(info.fullName).toBe('Awa Ndiaye')
    expect(info.email).toBe('awa.ndiaye@mail.com')
    expect(info.linkedinUrl).toContain('linkedin.com/in/awandiaye')
    // Portfolio prioritaire sur GitHub pour le site web.
    expect(info.websiteUrl).toContain('awa-portfolio.com')
  })

  it('utilise GitHub comme site si pas de portfolio', () => {
    const info = augmentContact({}, 'Profil\ngithub.com/dev42')
    expect(info.websiteUrl).toContain('github.com/dev42')
  })
})
