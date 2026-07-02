import { describe, expect, it } from 'vitest'
import { classifyHeading, guessSectionForContent, runResumePipeline } from '../modules/ocr/pipeline'

describe('classifyHeading', () => {
  it('reconnaît des synonymes variés de titres de section', () => {
    expect(classifyHeading('Parcours professionnel')).toBe('experience')
    expect(classifyHeading('EXPÉRIENCES PROFESSIONNELLES')).toBe('experience')
    expect(classifyHeading('Études et diplômes')).toBe('education')
    expect(classifyHeading('Diplômes')).toBe('education')
    expect(classifyHeading('Hard Skills')).toBe('skills')
    expect(classifyHeading('Soft Skills')).toBe('skills')
    expect(classifyHeading('À propos de moi')).toBe('profile')
    expect(classifyHeading('Loisirs')).toBe('interests')
    expect(classifyHeading('Coordonnées')).toBe('contact')
    expect(classifyHeading('Références')).toBe('references')
  })

  it('ne classe pas une ligne de contenu comme un titre', () => {
    expect(classifyHeading('Développeur senior chez Orange Sénégal 2020 - Présent')).toBeNull()
    expect(classifyHeading('amadou.diallo@email.com')).toBeNull()
  })
})

describe('guessSectionForContent', () => {
  it('devine la section probable d’un contenu non classé', () => {
    expect(guessSectionForContent('Master Informatique, UCAD')).toBe('education')
    expect(guessSectionForContent('amadou@email.com')).toBe('contact')
    expect(guessSectionForContent('Anglais courant')).toBe('languages')
  })
})

describe('runResumePipeline', () => {
  const raw = `
Amadou Diallo
Développeur Full Stack

Profil
Développeur passionné avec 5 ans d'expérience.

Expériences professionnelles
Développeur senior chez Orange Sénégal 2020 - Présent
- Migration vers Vue.js

Chef de projet | Sonatel | 2017 - 2020

Formations
Master Informatique — UCAD — 2017

Compétences
JavaScript, Vue.js, Node.js, HYGIÈNE ET CONTACT PATIENT

Langues
Français — Courant
Anglais — Professionnel

amadou.diallo@email.com
+221 77 123 45 67
`

  it('produit des données + métadonnées d’extraction', async () => {
    const result = await runResumePipeline(raw)
    expect(result._extraction).toBeDefined()
    expect(result._extraction.engine).toBe('heuristic')
    expect(result._extraction.confidence.overall).toBeGreaterThan(0)
  })

  it('détecte les coordonnées avec une forte confiance', async () => {
    const result = await runResumePipeline(raw)
    expect(result.personalInfo?.email).toBe('amadou.diallo@email.com')
    expect(result._extraction.confidence.personalInfo?.email).toBe(1)
    expect(result._extraction.confidence.personalInfo?.phone ?? 0).toBeGreaterThan(0.6)
  })

  it('ne fusionne jamais deux expériences distinctes', async () => {
    const result = await runResumePipeline(raw)
    expect((result.experiences ?? []).length).toBeGreaterThanOrEqual(2)
  })

  it('détecte les sections présentes', async () => {
    const result = await runResumePipeline(raw)
    expect(result._extraction.detectedSections).toContain('experience')
    expect(result._extraction.detectedSections).toContain('education')
    expect(result._extraction.detectedSections).toContain('skills')
    expect(result._extraction.detectedSections).toContain('languages')
  })

  it('attribue un score de confiance par expérience', async () => {
    const result = await runResumePipeline(raw)
    const scores = result._extraction.confidence.experiences ?? []
    expect(scores.length).toBe((result.experiences ?? []).length)
    for (const score of scores) {
      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThanOrEqual(1)
    }
  })

  it('expose une liste « à vérifier » sans planter', async () => {
    const result = await runResumePipeline(raw)
    expect(Array.isArray(result._extraction.review)).toBe(true)
  })
})

describe('runResumePipeline — CV complet réaliste (bout en bout)', () => {
  const cv = `
Fatou Ndiaye
Cheffe de projet digital

À propos de moi
Cheffe de projet avec 8 ans d'expérience dans la transformation digitale,
spécialisée en gestion d'équipes pluridisciplinaires et conduite du changement.

Contact
fatou.ndiaye@example.com
+221 78 456 78 90
linkedin.com/in/fatou-ndiaye
github.com/fatoun

Expériences professionnelles
Cheffe de projet digital — Orange Digital Center
Dakar, Sénégal
Janvier 2021 - Présent
- Pilotage de 12 projets web et mobile
- Encadrement d'une équipe de 6 personnes
Compétences utilisées : Jira, Scrum, Figma, Gestion budgétaire

Product Owner — Wave Mobile Money
Abidjan, Côte d'Ivoire
2018 - 2020
- Rédaction des user stories et backlog
Outils : Notion, SQL, Mixpanel

Consultante junior — Deloitte
Paris, France
2016 - 2018

Formations
Master Management de projet — Université Paris-Dauphine — 2016
Licence Économie, Université Cheikh Anta Diop, Dakar 2014

Compétences
Gestion de projet, Agile, Roadmap produit, Analyse de données

Langues
Français — Langue maternelle
Anglais — Courant
Wolof — Bilingue
`

  it('extrait les coordonnées complètes (email, téléphone, LinkedIn, GitHub)', async () => {
    const result = await runResumePipeline(cv)
    expect(result.personalInfo?.email).toBe('fatou.ndiaye@example.com')
    expect(result.personalInfo?.phone).toMatch(/78 456 78 90/)
    expect(result.personalInfo?.linkedinUrl).toMatch(/linkedin\.com\/in\/fatou-ndiaye/i)
    expect(result.personalInfo?.websiteUrl).toMatch(/github\.com\/fatoun/i)
  })

  it('isole trois expériences distinctes sans les fusionner', async () => {
    const result = await runResumePipeline(cv)
    const exps = result.experiences ?? []
    expect(exps.length).toBe(3)
    expect(exps.map((e) => e.position).join(' | ')).toMatch(/Cheffe de projet/i)
    expect(exps.map((e) => e.company).join(' | ')).toMatch(/Orange/i)
  })

  it('sépare ville et pays sur chaque expérience', async () => {
    const result = await runResumePipeline(cv)
    const [first, second] = result.experiences ?? []
    expect(first?.location).toBe('Dakar')
    expect(first?.country).toBe('Sénégal')
    expect(second?.location).toBe('Abidjan')
    expect(second?.country).toMatch(/Côte d'Ivoire/i)
  })

  it('capte les compétences utilisées par expérience', async () => {
    const result = await runResumePipeline(cv)
    const [first, second] = result.experiences ?? []
    expect(first?.skillsUsed).toEqual(expect.arrayContaining(['Jira', 'Scrum', 'Figma']))
    expect(second?.skillsUsed).toEqual(expect.arrayContaining(['Notion', 'SQL', 'Mixpanel']))
  })

  it('extrait plusieurs formations indépendantes', async () => {
    const result = await runResumePipeline(cv)
    const edus = result.educations ?? []
    expect(edus.length).toBeGreaterThanOrEqual(2)
    expect(edus.map((e) => e.degree).join(' | ')).toMatch(/Master/i)
  })

  it('extrait les langues avec leur niveau', async () => {
    const result = await runResumePipeline(cv)
    const names = (result.languages ?? []).map((l) => l.name.toLowerCase())
    expect(names).toEqual(expect.arrayContaining(['français', 'anglais', 'wolof']))
  })

  it('détecte toutes les sections clés et reste en moteur heuristique', async () => {
    const result = await runResumePipeline(cv)
    const sections = result._extraction.detectedSections
    expect(sections).toEqual(
      expect.arrayContaining(['profile', 'experience', 'education', 'skills', 'languages']),
    )
    expect(result._extraction.engine).toBe('heuristic')
    expect(result._extraction.confidence.overall).toBeGreaterThan(0.5)
  })
})

describe('runResumePipeline — format « date d’abord » (CV aide-soignante)', () => {
  // Expériences au format « <plage de dates>  <poste> » puis « <employeur>, <ville> »,
  // avec plages mois→mois et préfixes « de »/« d' » (cas réel problématique).
  const cv = `
Dieynaba CAMARA
Aide-Soignante

77 942 15 67
dieynacamara@icloud.com

Expériences
Mars 2024 à Avril 2024  Aide Soignante
Poste de Santé de Baegny, Rufisque
- Assister les patients dans les activités quotidiennes
- Préparer et entretenir le matériel médical
de Mai 2024 à Juin 2024    Aide Soignante
Clinique Kissy Santé, Dakar
d'Août 2024 à Sept 2024    Aide Soignante
Poste de Santé Aïnoumadi Bène barak, Dakar
de Mai 2025 à Juin 2025    Aide Soignante
Centre de Yeumbeul, Dakar

Formations
de Oct 2024 à Août 2025   En Santé
Centre Polyvalent de formation Professionnelle CFFP Keur Massar
`

  it('isole chaque expérience datée (poste + employeur + ville), sans fusion ni perte', async () => {
    const result = await runResumePipeline(cv)
    const exps = result.experiences ?? []
    expect(exps.length).toBe(4)
    // Toutes ont le bon poste, jamais la date dans le poste.
    for (const exp of exps) {
      expect(exp.position).toMatch(/Aide Soignante/i)
      expect(exp.position).not.toMatch(/\d{4}/)
    }
    // Première entrée entièrement reconstituée.
    expect(exps[0]!.company).toBe('Poste de Santé de Baegny')
    expect(exps[0]!.location).toBe('Rufisque')
    expect(exps[0]!.startDate).toMatch(/Mars 2024/i)
    expect(exps[0]!.endDate).toMatch(/Avril 2024/i)
    expect(exps[0]!.description).toMatch(/Assister les patients/i)
    // L'employeur n'est jamais transformé en entrée séparée.
    expect(exps[1]!.company).toBe('Clinique Kissy Santé')
    expect(exps[2]!.company).toBe('Poste de Santé Aïnoumadi Bène barak')
    expect(exps[2]!.location).toBe('Dakar')
  })

  it('ne coupe pas une ligne « employeur, ville » en pays', async () => {
    const result = await runResumePipeline(cv)
    for (const exp of result.experiences ?? []) {
      expect(exp.country).toBeUndefined()
    }
  })

  it('reconstitue la formation au format date-d’abord', async () => {
    const result = await runResumePipeline(cv)
    const edus = result.educations ?? []
    expect(edus.length).toBe(1)
    expect(edus[0]!.degree).toMatch(/Santé/i)
    expect(edus[0]!.institution).toMatch(/Centre Polyvalent/i)
    expect(edus[0]!.startDate).toBe('2024')
    expect(edus[0]!.endDate).toBe('2025')
  })
})

describe('runResumePipeline — texte reconstruit d’un PDF deux colonnes', () => {
  // Reproduit la sortie réelle de l'extraction PDF après séparation des colonnes :
  // - nom éclaté sur deux lignes (« Dieynaba » / « CAMARA »),
  // - en-têtes surimprimés/triplés (« ExpériencesExpériencesExpériences »),
  // - lignes de mission (puces sans marqueur) entre deux expériences,
  // - bloc « adresse » sans en-tête (« Zac Mbao », « Mbao » contient « mba »).
  const cv = `
Dieynaba
CAMARA
Aide-Soignante
ExpériencesExpériencesExpériences
Mars 2024 à Avril 2024 Aide Soignante
Poste de Santé de Baegny, Rufisque
Assister les patients dans les activités
Préparer et entretenir le matériel médical
de Mai 2024 à Juin 2024 Aide Soignante
Clinique Kissy Santé, Dakar
d'Août 2024 à Sept 2024 Aide Soignante
Poste de Santé Aïnoumadi Bène barak, Dakar
FormationsFormationsFormations
de Oct 2024 à Août 2025 En Santé
Centre Polyvalent de formation
77 942 15 67
dieynacamara@icloud.com
Zac Mbao
LanguesLanguesLangues
Français
Anglais moyen
Wolof
`

  it('détecte le nom éclaté sur deux lignes et le poste', async () => {
    const result = await runResumePipeline(cv)
    expect(result.personalInfo?.fullName).toBe('Dieynaba CAMARA')
    expect(result.personalInfo?.jobTitle).toMatch(/Aide-?Soignante/i)
  })

  it('ne crée pas de fausses expériences à partir des lignes de mission', async () => {
    const result = await runResumePipeline(cv)
    const exps = result.experiences ?? []
    expect(exps.length).toBe(3)
    expect(exps[0]!.company).toBe('Poste de Santé de Baegny')
    expect(exps[0]!.description).toMatch(/Assister les patients/i)
    expect(exps[0]!.description).toMatch(/Préparer et entretenir/i)
    for (const exp of exps) {
      expect(exp.position).not.toMatch(/^(Assister|Préparer)/i)
    }
  })

  it('ne confond pas « Mbao » avec un diplôme (mba) ni l’adresse avec une formation', async () => {
    const result = await runResumePipeline(cv)
    const edus = result.educations ?? []
    expect(edus.length).toBe(1)
    expect(edus.some((e) => /Zac Mbao/i.test(e.degree ?? ''))).toBe(false)
  })
})

describe('runResumePipeline — layout 2 colonnes EXPÉRIENCE | FORMATION', () => {
  const cv = `
KINÉ BABA DIENG
COMPTABLE
diengdkine@gmail.com
77-585-30-32
Ouakam – Dakar

EXPÉRIENCE                      FORMATION
Chargée des relations externes  Formation accélérée
Rajab Business                  British
Ouakam – Dakar                  Langue Allemande et Anglaise
2023 – 2024                     2021 – 2022
Assistante de Direction        2ème année de Formation
Immo-Négoce                     ENSUP AFRIQUE
Ouakam – Dakar                  Banque Finance et Assurance
2022 – 2023                     2020 – 2021
Conseillère clientèle           Baccalauréat L2
PCCI Dakar                      Lycée Mixte Maurice Delafosse
2021 – 2022                     2018 – 2019
  `.trim()

  it('sépare expériences et formations (pas de mélange)', async () => {
    const result = await runResumePipeline(cv)
    const exps = result.experiences ?? []
    const edus = result.educations ?? []
    const skills = (result.skills ?? []).map((s) => s.name.toLowerCase())

    expect(exps.some((exp) => /rajab/i.test(exp.company ?? ''))).toBe(true)
    expect(exps.some((exp) => /immo/i.test(exp.company ?? ''))).toBe(true)
    expect(edus.some((edu) => /formation accélérée|formation acceleree/i.test(edu.degree ?? ''))).toBe(true)
    expect(edus.some((edu) => /ensup/i.test(`${edu.institution ?? ''} ${edu.degree ?? ''}`))).toBe(true)

    expect(exps.some((exp) => /baccalauréat|formation accélérée|ensup/i.test(exp.position ?? ''))).toBe(false)
    expect(exps.some((exp) => /baccalauréat|ensup/i.test(exp.company ?? ''))).toBe(false)
    expect(skills.some((name) => /rajab|ensup|baccalauréat|formation accélérée/i.test(name))).toBe(false)
  })
})

describe('runResumePipeline — layout Adobe 4 colonnes (en-têtes en fin)', () => {
  const cv = `
Plombier expérimenté avec plus de 10 ans d'expérience sur des
chantiers variés (bâtiments, industries et hôtellerie).
Modou Fall
Plombier
modou.fall@example.com
(+221) 70 000 00 00
Diorga Montagne, Rufisque - Dakar
COMPÉTENCES
LANGUES
Installation de réseaux de plomberie
Détection et réparation de fuites
Français : lu, parlé et écrit
Anglais : lu, parlé et écrit
Wolof : parlé
2025 à nos jours : Plombier Sous-Traitant
2024 - 2025 : Plombier
2020 - 2021 : Plombier
INDÉPENDANT
ENTREPRISE ESPAGNOLE KALIA, DAKAR
BATILUX, DAKAR
2012 - 2013 : BFEM
EXPÉRIENCES PROFESSIONNELLES
ETUDES ET FORMATIONS
  `.trim()

  it('ne mélange pas expériences dans compétences', async () => {
    const result = await runResumePipeline(cv)
    const skills = (result.skills ?? []).map((s) => s.name.toLowerCase())
    const exps = result.experiences ?? []

    expect(exps.length).toBeGreaterThanOrEqual(3)
    expect(skills.some((name) => /plombier sous-traitant|ind[ée]pendant|kalia|batilux/i.test(name))).toBe(false)
    expect(skills.some((name) => /installation de réseaux|fuites/i.test(name))).toBe(true)
  })
})
