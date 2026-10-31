import { describe, expect, it } from 'vitest'
import { firstPhone, mergeLlmResume, normalizeLlmResume, toLanguageLevel, toSkillLevel } from './llm-normalize'

describe('normalizeLlmResume', () => {
  it('accepte les anciens noms de champ renvoyés par le modèle', () => {
    const result = normalizeLlmResume({
      personalInfo: { fullName: 'Awa Diop', linkedin: 'linkedin.com/in/awa', website: 'awa.sn' },
      experiences: [{ title: 'Secrétaire', employer: 'Orange Money', current: true, endDate: 'Présent' }],
      educations: [{ school: 'ISM Dakar', diploma: 'BTS', fieldOfStudy: 'Assistanat' }],
      languages: [{ language: 'Anglais', level: 'Courant' }],
    })
    expect(result?.personalInfo).toMatchObject({ linkedinUrl: 'linkedin.com/in/awa', websiteUrl: 'awa.sn' })
    expect(result?.experiences[0]).toMatchObject({ position: 'Secrétaire', company: 'Orange Money', isCurrent: true })
    expect(result?.experiences[0]?.endDate).toBeUndefined()
    expect(result?.educations[0]).toMatchObject({ institution: 'ISM Dakar', degree: 'BTS', field: 'Assistanat' })
    expect(result?.languages[0]).toEqual({ name: 'Anglais', level: 'PROFESSIONAL' })
  })

  it('ignore les valeurs vides déguisées et les entrées sans contenu', () => {
    const result = normalizeLlmResume({
      personalInfo: { fullName: 'Moussa Ndiaye', email: 'null', phone: 'N/A', location: 'Non spécifié' },
      experiences: [{ position: '', company: null }, { position: 'Stagiaire', company: 'Jokkolabs' }],
    })
    expect(result?.personalInfo.email).toBeUndefined()
    expect(result?.personalInfo.phone).toBeUndefined()
    expect(result?.personalInfo.location).toBeUndefined()
    expect(result?.experiences).toHaveLength(1)
  })

  it('rejette un email invalide', () => {
    expect(normalizeLlmResume({ personalInfo: { fullName: 'A B', email: 'awa(at)mail' } })?.personalInfo.email).toBeUndefined()
  })

  it('découpe les compétences regroupées et supprime les doublons', () => {
    const result = normalizeLlmResume({ skills: ['Excel, Word; PowerPoint', { name: 'excel', level: 'avancé' }, { name: 'React', level: 'expert' }] })
    expect(result?.skills.map((s) => s.name)).toEqual(['Excel', 'Word', 'PowerPoint', 'React'])
    expect(result?.skills[3]?.level).toBe('EXPERT')
  })

  it('transforme une liste de missions en puces', () => {
    const result = normalizeLlmResume({ experiences: [{ position: 'Caissière', company: 'Auchan', description: ['Encaisser', '- Accueillir'] }] })
    expect(result?.experiences[0]?.description).toBe('- Encaisser\n- Accueillir')
  })

  it('lit les langues écrites en texte libre', () => {
    const result = normalizeLlmResume({ personalInfo: { fullName: 'X Y' }, languages: ['Wolof (langue maternelle)', 'Français : courant', 'Anglais'] })
    expect(result?.languages).toEqual([
      { name: 'Wolof', level: 'NATIVE' },
      { name: 'Français', level: 'PROFESSIONAL' },
      { name: 'Anglais', level: undefined },
    ])
  })

  it('valide la boîte de la photo', () => {
    expect(normalizeLlmResume({ personalInfo: { fullName: 'X Y' }, photo: { present: true, box: [50, 60, 300, 260] } })?.photoBox).toEqual([50, 60, 300, 260])
    expect(normalizeLlmResume({ personalInfo: { fullName: 'X Y' }, photo: { present: true, box: [50, 60, 55, 62] } })?.photoBox).toBeUndefined()
    expect(normalizeLlmResume({ personalInfo: { fullName: 'X Y' }, photo: { present: true, box: [50, 60, 2000, 260] } })?.photoBox).toBeUndefined()
  })

  it('renvoie null pour une réponse vide ou non conforme', () => {
    expect(normalizeLlmResume(null)).toBeNull()
    expect(normalizeLlmResume([])).toBeNull()
    expect(normalizeLlmResume({ personalInfo: {}, experiences: [] })).toBeNull()
  })
})

describe('niveaux', () => {
  it('convertit les niveaux de langue', () => {
    expect(toLanguageLevel('C1')).toBe('PROFESSIONAL')
    expect(toLanguageLevel('Bilingue')).toBe('PROFESSIONAL')
    expect(toLanguageLevel('B1')).toBe('CONVERSATIONAL')
    expect(toLanguageLevel('Notions')).toBe('BASIC')
    expect(toLanguageLevel('Langue maternelle')).toBe('NATIVE')
    expect(toLanguageLevel('')).toBeUndefined()
  })

  it('convertit les niveaux de compétence', () => {
    expect(toSkillLevel('Débutant')).toBe('BEGINNER')
    expect(toSkillLevel('Confirmé')).toBe('ADVANCED')
    expect(toSkillLevel('Intermédiaire')).toBe('INTERMEDIATE')
  })
})

describe('mergeLlmResume', () => {
  const rawText = `Awa Diop — Assistante administrative — awa.diop@gmail.com — +221 77 123 45 67
${'Expérience chez Orange Money, accueil, gestion des agendas, archivage. '.repeat(4)}`

  it('ne laisse jamais une valeur vide de l’IA effacer une valeur trouvée', () => {
    const llm = normalizeLlmResume({ personalInfo: { fullName: 'Awa Diop' }, experiences: [] })!
    const merged = mergeLlmResume(
      { personalInfo: { fullName: 'AWA DIOP', email: 'awa.diop@gmail.com' }, experiences: [{ company: 'Orange Money', position: 'Secrétaire' }] },
      llm,
      rawText,
    )
    expect(merged.personalInfo?.email).toBe('awa.diop@gmail.com')
    expect(merged.personalInfo?.fullName).toBe('Awa Diop')
    expect(merged.experiences).toHaveLength(1)
  })

  it('ignore un email ou un téléphone inventés, absents du document', () => {
    const llm = normalizeLlmResume({ personalInfo: { fullName: 'Awa Diop', email: 'contact@awa.sn', phone: '+221 70 000 00 00' } })!
    const merged = mergeLlmResume({ personalInfo: {} }, llm, rawText)
    expect(merged.personalInfo?.email).toBeUndefined()
    expect(merged.personalInfo?.phone).toBeUndefined()
  })

  it('garde l’email et le téléphone de l’IA quand ils figurent dans le document', () => {
    const llm = normalizeLlmResume({ personalInfo: { fullName: 'Awa Diop', email: 'awa.diop@gmail.com', phone: '77 123 45 67' } })!
    const merged = mergeLlmResume({ personalInfo: {} }, llm, rawText)
    expect(merged.personalInfo?.email).toBe('awa.diop@gmail.com')
    expect(merged.personalInfo?.phone).toBe('77 123 45 67')
  })

  it('fait confiance à l’IA quand le texte OCR est inexploitable (photo floue)', () => {
    const llm = normalizeLlmResume({ personalInfo: { fullName: 'Awa Diop', email: 'awa.diop@gmail.com' } })!
    const merged = mergeLlmResume({ personalInfo: {} }, llm, 'Aw4 D1op')
    expect(merged.personalInfo?.email).toBe('awa.diop@gmail.com')
  })

  it('fait foi quand elle a vu le document, même pour dire « rien »', () => {
    const llm = normalizeLlmResume({ personalInfo: { fullName: 'Mariama Kane', jobTitle: null }, educations: [] })!
    const heuristic = { personalInfo: { fullName: 'MK', jobTitle: 'Kane', email: 'mariama.kane@example.com' }, educations: [{ institution: 'personnelles', degree: 'Informations' }] }
    const merged = mergeLlmResume(heuristic, llm, 'MK Mariama Kane', true)
    expect(merged.personalInfo).toMatchObject({ fullName: 'Mariama Kane', email: 'mariama.kane@example.com' })
    expect(merged.personalInfo?.jobTitle).toBeUndefined()
    expect(merged.educations).toEqual([])
    // Sans le document (texte seul), on garde les heuristiques en secours
    expect(mergeLlmResume(heuristic, llm, 'MK Mariama Kane').educations).toHaveLength(1)
  })

  it('préfère l’email et le téléphone lus par l’IA sur le document plutôt que l’OCR', () => {
    const llm = normalizeLlmResume({ personalInfo: { fullName: 'OMAR NDIAYE', email: 'on7156914@gmail.com', phone: '(+221) 70 605 13 87' } })!
    const merged = mergeLlmResume({ personalInfo: { email: '0n7156914@gmail.com', phone: '2024-2025' } }, llm, rawText, true)
    expect(merged.personalInfo).toMatchObject({ fullName: 'Omar Ndiaye', email: 'on7156914@gmail.com', phone: '(+221) 70 605 13 87' })
  })

  it('n’accepte pas une plage d’années comme téléphone', () => {
    const llm = normalizeLlmResume({ personalInfo: { fullName: 'Awa Diop' } })!
    expect(mergeLlmResume({ personalInfo: { phone: '2024-2025' } }, llm, rawText).personalInfo?.phone).toBeUndefined()
  })
})

describe('photo et niveaux sénégalais', () => {
  it('accepte une boîte de photo imbriquée ou en objet', () => {
    expect(normalizeLlmResume({ personalInfo: { fullName: 'X Y' }, photo: { present: true, box: [[31, 107, 219, 281]] } })?.photoBox).toEqual([31, 107, 219, 281])
    expect(normalizeLlmResume({ personalInfo: { fullName: 'X Y' }, photo: { present: true, box: { ymin: 31, xmin: 107, ymax: 219, xmax: 281 } } })?.photoBox).toEqual([31, 107, 219, 281])
  })

  it('comprend « lu, parlé et écrit » et « parlé »', () => {
    expect(toLanguageLevel('lu, parlé et écrit')).toBe('PROFESSIONAL')
    expect(toLanguageLevel('parlé')).toBe('CONVERSATIONAL')
  })

  it('garde le premier numéro quand il y en a plusieurs', () => {
    expect(firstPhone('(+221) 70 605 13 87 - 77 833 76 20')).toBe('(+221) 70 605 13 87')
    expect(firstPhone('77 123 45 67 / 70 000 00 00')).toBe('77 123 45 67')
    expect(firstPhone('+221) 70 605 13\n87')).toBe('+221) 70 605 13 87')
    expect(firstPhone('2024-2025')).toBeUndefined()
  })
})
