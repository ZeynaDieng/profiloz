import type { ResumeSnapshot } from '@profiloz/shared'
import { describe, expect, it } from 'vitest'
import {
  cleanLine,
  collapseRepeatedString,
  parseDateRange,
  parseDocumentText,
  parseExperienceLine,
  parseResumeText,
} from '../modules/ocr/ocr.parser'

describe('cleanLine', () => {
  it('retire une puce Symbol/Wingdings (zone à usage privé) collée au texte', () => {
    // U+F0B7 est la puce « • » dans certaines polices PDF ; .trim() ne la retire pas.
    expect(cleanLine('\uF0B7 Langages : JavaScript')).toBe('Langages : JavaScript')
    expect(cleanLine('Compétences')).toBe('Compétences')
  })

  it('supprime les caractères invisibles (zero-width, BOM)', () => {
    expect(cleanLine('\uFEFFNom\u200B Prénom')).toBe('Nom Prénom')
  })
})

describe('collapseRepeatedString', () => {
  it('replie un en-tête surimprimé (2 ou 3 répétitions exactes)', () => {
    expect(collapseRepeatedString('ExpériencesExpériencesExpériences')).toBe('Expériences')
    expect(collapseRepeatedString('LoisirsLoisirs')).toBe('Loisirs')
  })

  it('laisse intact un texte normal', () => {
    expect(collapseRepeatedString('Assister les patients')).toBe('Assister les patients')
    expect(collapseRepeatedString('Sport Sport')).toBe('Sport Sport')
    expect(collapseRepeatedString('Dakar')).toBe('Dakar')
  })
})

describe('parseDateRange', () => {
  it('reconnaît « Depuis 2022 » comme poste en cours', () => {
    const result = parseDateRange('Depuis 2022 Développeur — TechHub')
    expect(result.startDate).toBe('2022')
    expect(result.isCurrent).toBe(true)
    expect(result.rest).toContain('Développeur')
  })

  it('reconnaît les dates au format MM/YYYY', () => {
    const result = parseDateRange('01/2020 - 06/2023 Chef de projet')
    expect(result.startDate).toBe('01/2020')
    expect(result.endDate).toBe('06/2023')
    expect(result.isCurrent).toBe(false)
  })

  it('reconnaît « Présent » et « Aujourd\'hui »', () => {
    expect(parseDateRange('2020 - Présent').isCurrent).toBe(true)
    expect(parseDateRange('2024 - Aujourd\'hui').isCurrent).toBe(true)
  })

  it('reconnaît « Historique » comme section expérience via detectSection indirect', () => {
    const raw = `
Jean Dupont
Historique
2020 - 2023 Développeur — Acme
`.trim()
    const result = parseResumeText(raw)
    expect(result.experiences?.length).toBeGreaterThanOrEqual(1)
  })
})

describe('parseResumeText', () => {
  it('extrait le nom, le profil et les expériences aux bonnes sections', () => {
    const raw = `
Amadou Diallo
Développeur Full Stack

Profil
Développeur passionné avec 5 ans d'expérience en web et mobile.

Expériences professionnelles
Développeur senior chez Orange Sénégal 2020 - Présent
- Migration de l'application client vers Vue.js

Chef de projet | Sonatel | 2017 - 2020

Formations
Master Informatique — UCAD — 2017
Licence Mathématiques, Université Cheikh Anta Diop

Compétences
JavaScript, Vue.js, Node.js, PostgreSQL

Langues
Français — Courant
Anglais — Professionnel

amadou.diallo@email.com
+221 77 123 45 67
    `.trim()

    const result = parseResumeText(raw)

    expect(result.personalInfo?.fullName).toBe('Amadou Diallo')
    expect(result.personalInfo?.jobTitle).toBe('Développeur Full Stack')
    expect(result.personalInfo?.email).toBe('amadou.diallo@email.com')
    expect(result.summary).toContain('Développeur passionné')
    expect(result.experiences?.[0]).toMatchObject({
      position: 'Développeur senior',
      company: 'Orange Sénégal',
      isCurrent: true,
    })
    expect(result.experiences?.[1]).toMatchObject({
      position: 'Chef de projet',
      company: 'Sonatel',
    })
    expect(result.educations?.[0]?.degree).toContain('Master Informatique')
    expect(result.educations?.[0]?.institution).toBe('UCAD')
    expect(result.skills?.map((s) => s.name)).toEqual(
      expect.arrayContaining(['JavaScript', 'Vue.js', 'Node.js', 'PostgreSQL']),
    )
    expect(result.languages?.map((l) => l.name)).toEqual(expect.arrayContaining(['Français', 'Anglais']))
  })

  it('ignore les titres génériques comme nom', () => {
    const result = parseResumeText('Curriculum Vitae\nJean Dupont\njean@mail.com')
    expect(result.personalInfo?.fullName).toBe('Jean Dupont')
  })

  it('extrait un CV francais avec champs etiquetes', () => {
    const raw = `
CURRICULUM VITAE
Prénom & Nom : Kiné Baba DIENG
Adresse : Ouakam – Dakar
Tel : 77-585-30-32
Email : diengdkine@gmail.com

EXPERIENCES PROFESSIONNELLES
2023-2024 : Chargée des relations externes chez Rajab Business
2022-2023 : Assistante de Direction chez Immo-Négoce
2021-2022 : Stagiaire à l'École Vert Rose

ETUDES ET DIPLOMES
2021-2022 : Formation accélérée en Langue Allemande et Anglaise
2020-2021 : 2ème année de Formation en Banque Finance et Assurance à ENSUP AFRIQUE
2018-2019 : Baccalauréat L2 au Lycée Mixte Maurice Delafosse de Dakar

LANGUES
Français : Lire, Ecrire et Parler
Anglais : Lire, Ecrire et Parler
Wolof : Parler

LOISIRS
✓ Sport : marche
✓ Musique
    `.trim()

    const result = parseResumeText(raw)

    expect(result.personalInfo?.fullName).toBe('Kiné Baba DIENG')
    expect(result.personalInfo?.location).toBe('Ouakam – Dakar')
    expect(result.personalInfo?.email).toBe('diengdkine@gmail.com')
    expect(result.personalInfo?.phone).toContain('77-585-30-32')
    expect(result.personalInfo?.location).not.toMatch(/français/i)
    expect(result.experiences?.length).toBeGreaterThanOrEqual(3)
    expect(result.educations?.some((edu) => edu.institution?.includes('ENSUP'))).toBe(true)
    expect(result.languages?.map((l) => l.name)).toEqual(
      expect.arrayContaining(['Français', 'Anglais', 'Wolof']),
    )
    expect(result.interests?.map((i) => i.name)).toEqual(
      expect.arrayContaining(['Sport — marche', 'Musique']),
    )
  })

  it('dedoublonne les experiences extraites en double depuis un PDF', () => {
    const raw = `
Expériences professionnelles
2023 — 2024 : Chargée des relations externes chez Rajab Business —
Chargée des relations externes — Rajab Business 2023 — 2024
2022 — 2023 : Assistante de Direction chez Immo-Négoce —
Assistante de Direction — Immo-Négoce 2022 — 2023

Etudes et diplomes
Formation accélérée en Langue Allemande et Anglaise
année de Formation en Banque Finance et Assurance
    `.trim()

    const result = parseResumeText(raw)

    expect(result.experiences).toHaveLength(2)
    expect(result.experiences?.[0]).toMatchObject({
      position: 'Chargée des relations externes',
      company: 'Rajab Business',
      startDate: '2023',
      endDate: '2024',
    })
    expect(result.educations?.length).toBeGreaterThan(0)
    expect(result.experiences?.some((exp) => /entreprise/i.test(exp.company))).toBe(false)
    expect(result.experiences?.some((exp) => /etudes et diplomes/i.test(exp.position ?? ''))).toBe(false)
  })

  it('fusionne les lignes coupees et preserve les retours a la ligne', () => {
    const raw = `
EXPERIENCES PROFESSIONNELLES
2023-2024 : Chargée des relations externes chez Rajab Business
Gestion de la communication externe
Organisation d'événements

ETUDES ET DIPLOMES
2020-2021 : 2ème année de Formation en Banque Finance
et Assurance à ENSUP AFRIQUE
    `.trim()

    const result = parseResumeText(raw)

    expect(result.experiences?.[0]?.description).toContain('Gestion de la communication externe')
    expect(result.experiences?.[0]?.description).toContain("Organisation d'événements")
    expect(result.experiences?.[0]?.description).toContain('\n')
    expect(result.educations?.[0]?.institution).toContain('ENSUP')
  })

  it('extrait les expériences même sans en-tête de section (OCR)', () => {
    const raw = `
KINÉ BABA DIENG
Commercial
diengdkine@gmail.com

2023-2024 : Chargée des relations externes chez Rajab Business
2022-2023 : Assistante de Direction chez Immo-Négoce
2021-2022 : Stagiaire à l'École Vert Rose

ETUDES ET DIPLOMES
2021-2022 : Formation accélérée en Langue Allemande et Anglaise
2018-2019 : Baccalauréat L2 au Lycée Mixte Maurice Delafosse de Dakar
    `.trim()

    const result = parseResumeText(raw)

    expect(result.experiences?.length).toBeGreaterThanOrEqual(3)
    expect(result.experiences?.[0]).toMatchObject({
      position: 'Chargée des relations externes',
      company: 'Rajab Business',
    })
    expect(result.educations?.some((edu) => /formation/i.test(edu.degree ?? ''))).toBe(true)
    expect(result.educations?.some((edu) => /chargée|assistante|stagiaire/i.test(edu.degree ?? ''))).toBe(false)
  })

  it('extrait les expériences des modèles Profilo\'Z (blocs multi-lignes)', () => {
    const premium = `
KINÉ BABA DIENG
COMPTABLE
diengdkine@gmail.com
77-585-30-32
Ouakam – Dakar

EXPÉRIENCE
Chargée des relations externes
Rajab Business
Ouakam – Dakar
2023 – 2024
Assistante de Direction
Immo-Négoce
Ouakam – Dakar
2022 – 2023
Conseillère clientèle
PCCI Dakar
Ouakam – Dakar
2021 – 2022

FORMATION
Formation accélérée
2021 – 2022

Premium — Profilo'Z
    `.trim()

    const commercial = `
KINÉ BABA DIENG
Commercial
diengdkine@gmail.com

RÉSULTATS & EXPÉRIENCE
Chargée des relations externes
Rajab Business
Ouakam – Dakar
2023 – 2024
Stage en comptabilité
Ar-Aignée
Ouakam – Dakar
2021 – 2022

FORMATION
BFEM
2015 – 2016

Commercial — Profilo'Z
    `.trim()

    const etudiant = `
KINÉ BABA DIENG
Comptable
diengdkine@gmail.com

FORMATION
Licence
Esup
2024 – 2025

STAGES & EXPÉRIENCES
Stagiaire
l'École Vert Rose
Ouakam – Dakar
2020 – 2021
Gérante
Salam Service
Ouakam – Dakar
2019 – 2020

Étudiant — Profilo'Z
    `.trim()

    for (const [raw, companyPattern] of [
      [premium, /rajab/i],
      [commercial, /rajab|ar-aignée/i],
      [etudiant, /salam|vert rose/i],
    ] as const) {
      const result = parseResumeText(raw)
      expect(result.experiences?.length).toBeGreaterThanOrEqual(2)
      expect(result.experiences?.some((exp) => companyPattern.test(`${exp.company ?? ''} ${exp.position ?? ''}`))).toBe(
        true,
      )
    }

    const premiumResult = parseResumeText(premium)
    expect(premiumResult.experiences?.[0]).toMatchObject({
      position: 'Chargée des relations externes',
      company: 'Rajab Business',
      startDate: '2023',
      endDate: '2024',
    })
  })

  it('extrait les expériences Premium en layout 2 colonnes (OCR entrelacé)', () => {
    const raw = `
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

Premium — Profilo'Z
    `.trim()

    const result = parseResumeText(raw)

    expect(result.experiences?.length).toBeGreaterThanOrEqual(3)
    expect(result.experiences?.some((exp) => /rajab/i.test(exp.company ?? ''))).toBe(true)
    expect(result.experiences?.some((exp) => /immo/i.test(exp.company ?? ''))).toBe(true)
    expect(result.educations?.some((edu) => /formation accélérée|formation acceleree/i.test(edu.degree ?? ''))).toBe(
      true,
    )
    expect(
      result.educations?.some((edu) => /ensup/i.test(`${edu.institution ?? ''} ${edu.degree ?? ''}`)),
    ).toBe(true)
    expect(result.experiences?.some((exp) => /baccalauréat|formation accélérée/i.test(exp.position ?? ''))).toBe(
      false,
    )
  })

  it('reconnaît les en-têtes de tous les modèles Profilo\'Z', () => {
    const headers = [
      ['// Expérience', 'Développeur senior', 'Acme Corp', '2020 – Présent'],
      ['Parcours exécutif', 'Directeur général', 'Groupe XYZ', '2019 – 2024'],
      ['Expérience internationale', 'Consultant', 'Deloitte', '2021 – 2023'],
      ['Résultats & expérience', 'Commercial', 'Orange', '2022 – 2024'],
      ['Stages & expériences', 'Stagiaire', 'Startup', '2020 – 2021'],
      ['Expertises', 'Négociation, CRM, prospection'],
      ['Vision & leadership', 'Leader orienté résultats avec 10 ans d\'expérience.'],
    ] as const

    for (const lines of headers) {
      const raw = `Jean Dupont\n${lines.join('\n')}`
      const result = parseResumeText(raw)
      if (/expertises/i.test(lines[0]!)) {
        expect(result.skills?.length).toBeGreaterThan(0)
      } else if (/vision/i.test(lines[0]!)) {
        expect(result.summary?.length).toBeGreaterThan(10)
      } else {
        expect(result.experiences?.length).toBeGreaterThan(0)
      }
    }
  })

  it('recompose les formations multi-lignes du CV Kiné sans fragmenter', () => {
    const raw = `
ETUDES ET DIPLOMES
2021-2022 : Formation accélérée en Langue Allemande et Anglaise
2020-2021 : 2
ème année de Formation en Banque Finance et
Assurance à ENSUP AFRIQUE
2019-2020 : 1
ère année de Formation en Banque Finance et
Assurance à ENSUP AFRIQUE
2018-2019 : Baccalauréat L2 au Lycée Mixte Maurice Delafosse de
Dakar
2015-2016 : BFEM au Matar Seck de Rufisque
    `.trim()

    const result = parseResumeText(raw)

    expect(result.educations).toHaveLength(5)
    expect(result.educations?.[0]).toMatchObject({
      degree: 'Formation accélérée',
      field: 'Langue Allemande et Anglaise',
      startDate: '2021',
      endDate: '2022',
    })
    expect(result.educations?.[1]).toMatchObject({
      degree: '2ème année de Formation',
      field: 'Banque Finance et Assurance',
      institution: 'ENSUP AFRIQUE',
      startDate: '2020',
      endDate: '2021',
    })
    expect(result.educations?.[2]).toMatchObject({
      degree: '1ère année de Formation',
      field: 'Banque Finance et Assurance',
      institution: 'ENSUP AFRIQUE',
      startDate: '2019',
      endDate: '2020',
    })
    expect(result.educations?.[3]).toMatchObject({
      degree: 'Baccalauréat L2',
      field: 'L2',
      institution: 'Lycée Mixte Maurice Delafosse de Dakar',
      startDate: '2018',
      endDate: '2019',
    })
    expect(result.educations?.[4]).toMatchObject({
      degree: 'BFEM',
      field: 'Secondaire',
      institution: 'Matar Seck de Rufisque',
      startDate: '2015',
      endDate: '2016',
    })
  })

  it('recompose un CV Profilo\'Z réimporté (diplôme / établissement / domaine / date en dernier)', () => {
    const raw = `Kiné Baba DIENG
FORMATION
Formation accélérée
British
Langue Allemande et Anglaise
2021  2022
2ème année de Formation
ENSUP AFRIQUE
Banque Finance et Assurance
2020  2021
Baccalauréat L2
Lycée Mixte Maurice Delafosse de Dakar
L2
2018  2019
BFEM
Matar Seck de Rufisque
Secondaire
2015  2016
Licence
Esup
Comptabilité et gestion
2024  2025
Moderne — Profilo'Z`

    const result = parseResumeText(raw)

    expect(result.educations).toHaveLength(5)
    expect(result.educations?.[0]).toMatchObject({
      degree: 'Formation accélérée',
      institution: 'British',
      field: 'Langue Allemande et Anglaise',
      startDate: '2021',
      endDate: '2022',
    })
    expect(result.educations?.[1]).toMatchObject({
      degree: '2ème année de Formation',
      institution: 'ENSUP AFRIQUE',
      field: 'Banque Finance et Assurance',
      startDate: '2020',
      endDate: '2021',
    })
    expect(result.educations?.[2]).toMatchObject({
      degree: 'Baccalauréat L2',
      institution: 'Lycée Mixte Maurice Delafosse de Dakar',
      field: 'L2',
      startDate: '2018',
      endDate: '2019',
    })
    expect(result.educations?.[3]).toMatchObject({
      degree: 'BFEM',
      institution: 'Matar Seck de Rufisque',
      field: 'Secondaire',
      startDate: '2015',
      endDate: '2016',
    })
    // "Licence" (singulier) reste une formation et ne bascule pas en certifications
    expect(result.educations?.[4]).toMatchObject({
      degree: 'Licence',
      institution: 'Esup',
      field: 'Comptabilité et gestion',
      startDate: '2024',
      endDate: '2025',
    })
    expect(result.certifications ?? []).toHaveLength(0)
  })
})

describe('détection nom / poste (cas réels anonymisés)', () => {
  it('coupe une ligne « Prénom Nom - Intitulé » (CV moderne une colonne)', () => {
    const raw = `
Awa Sow - Développeuse Full-stack
Ouakam, Dakar (Sénégal) | +221 77 000 00 00 | awa.sow@example.com

Profil Professionnel
Développeuse full-stack avec plus de 4 ans d'expérience.

Compétences Techniques
Langages : JavaScript, TypeScript, PHP, SQL
Frameworks : Nuxt.js, Laravel, NestJS
`.trim()
    const result = parseResumeText(raw)
    expect(result.personalInfo?.fullName).toBe('Awa Sow')
    expect(result.personalInfo?.jobTitle).toBe('Développeuse Full-stack')
    expect(result.personalInfo?.email).toBe('awa.sow@example.com')
  })

  it('ne prend pas une ligne de compétences techniques comme nom', () => {
    const raw = `
Awa Sow - Développeuse Full-stack
awa.sow@example.com

Compétences
Vue.js, Nuxt.js, MySQL, NestJS
`.trim()
    const result = parseResumeText(raw)
    expect(result.personalInfo?.fullName).not.toMatch(/vue\.js|nuxt|mysql/i)
    expect(result.personalInfo?.fullName).toBe('Awa Sow')
  })

  it('ignore « CURRICULUM VITAE » comme intitulé de poste (format à libellés)', () => {
    const raw = `
CURRICULUM VITAE
Prénom & Nom : Fatou Ndiaye
Adresse : Ouakam – Dakar
Email : fatou.ndiaye@example.com

EXPERIENCES PROFESSIONNELLES
2023-2024 : Conseillère clientèle chez PCCI
`.trim()
    const result = parseResumeText(raw)
    expect(result.personalInfo?.fullName).toBe('Fatou Ndiaye')
    expect(result.personalInfo?.jobTitle ?? '').not.toMatch(/curriculum/i)
  })

  it('préfère le vrai intitulé au résumé placé au-dessus du nom', () => {
    const raw = `
Plombier expérimenté avec plus de 10 ans d'expérience sur des
chantiers variés incluant des fonctions de chef d'équipe.
Modou Fall
Plombier
modou.fall@example.com
(+221) 70 000 00 00
`.trim()
    const result = parseResumeText(raw)
    expect(result.personalInfo?.fullName).toBe('Modou Fall')
    expect(result.personalInfo?.jobTitle).toBe('Plombier')
  })

  it('retrouve le nom relégué en pied de page (CV 2 colonnes, expérience en tête)', () => {
    const raw = `
EXPÉRIENCE
Chargée des relations externes
Rajab Business
2023 2024
FORMATION
2ème année de Formation
ENSUP AFRIQUE
2020 2021
Fatou Sarr
Comptable
fatou.sarr@example.com 77 000 00 00 Dakar
`.trim()
    const result = parseResumeText(raw)
    expect(result.personalInfo?.fullName).toBe('Fatou Sarr')
    expect(result.personalInfo?.jobTitle).toMatch(/comptable/i)
    // Ne prend pas une société du haut de page comme nom.
    expect(result.personalInfo?.fullName).not.toMatch(/rajab|pcci|business/i)
  })

  it('ne devine pas un poste au hasard quand le nom vient de libellés sans poste', () => {
    const raw = `
2026 : Licence III En Pharmacie à l'Université Gamal
Abdel Nasser de Conakry

COORDONNEE
Nom : Conde
Prénom : Sogbe
Date de naissance : 13/09/2003
Email : sogbe.conde@example.com
`.trim()
    const result = parseResumeText(raw)
    expect(result.personalInfo?.jobTitle ?? '').not.toMatch(/abdel nasser|conakry/i)
  })
})

describe('reconstruction des formations (lignes coupées)', () => {
  it('fusionne un diplôme coupé par des retours à la ligne (ordinal + « … et »)', () => {
    const raw = `
ETUDES ET DIPLOMES
2020-2021 : 2ème
année de Formation en Banque Finance et
Assurance à ENSUP AFRIQUE
2019-2020 : 1ère
année de Formation en Banque Finance et
Assurance à ENSUP AFRIQUE
`.trim()
    const result = parseResumeText(raw)
    const degrees = result.educations?.map((e) => e.degree ?? '') ?? []
    expect(degrees.some((d) => /2[èe]me ann[ée]e de Formation/i.test(d))).toBe(true)
    expect(degrees.some((d) => /1[èe]re ann[ée]e de Formation/i.test(d))).toBe(true)
    expect(result.educations?.some((e) => /ENSUP AFRIQUE/i.test(e.institution ?? ''))).toBe(true)
    // « Assurance à ENSUP » ne doit pas devenir une expérience fantôme.
    expect(result.experiences?.some((e) => /assurance/i.test(e.position ?? ''))).toBeFalsy()
  })
})

describe('parseExperienceLine — séparation poste / entreprise / dates', () => {
  it('coupe « Poste - Entreprise (mois année - Aujourd\'hui) » (tiret simple + dates entre parenthèses)', () => {
    const e = parseExperienceLine("Développeuse Full-stack - Intech Group (Oct 2021 - Aujourd'hui)")
    expect(e?.position).toBe('Développeuse Full-stack')
    expect(e?.company).toBe('Intech Group')
    expect(e?.isCurrent).toBe(true)
  })

  it('coupe « Poste — Entreprise » (tiret long) sans rien laisser', () => {
    const e = parseExperienceLine('Chef de projet — Sonatel 2016 - 2019')
    expect(e?.position).toBe('Chef de projet')
    expect(e?.company).toBe('Sonatel')
  })

  it('ne traite pas une ligne de date seule comme une expérience', () => {
    expect(parseExperienceLine('Janvier 2021 - Présent')).toBeNull()
    expect(parseExperienceLine('2019 - 2024')).toBeNull()
    expect(parseExperienceLine('Mars 2024 à Avril 2024')).toBeNull()
  })
})

describe('parseDocumentText', () => {
  it('route les diplômes vers la formation uniquement', () => {
    const result = parseDocumentText('Master Marketing\nUniversité Paris Dauphine\n2022', 'DIPLOMA') as Partial<ResumeSnapshot>
    expect(result.educations?.length).toBeGreaterThan(0)
    expect(result.experiences).toBeUndefined()
  })

  it('route les attestations vers les certifications', () => {
    const result = parseDocumentText('Certification AWS Solutions Architect\nAmazon Web Services\n2023', 'CERTIFICATE') as Partial<ResumeSnapshot>
    expect(result.certifications?.length).toBeGreaterThan(0)
    expect(result.experiences).toBeUndefined()
  })

  it('reformate une lettre PDF collée et extrait les bons champs', () => {
    const glued =
      'Kiné Baba DIENG Dakar diengdkine@gmail.com 77-585-30-32 24 juin 2026 Intech group Dakar ouakam Madame, Monsieur, Objet : Candidature au poste de développeur. Fort de mon parcours, je souhaite rejoindre votre équipe. Je vous prie d\'agréer, Madame, Monsieur, mes salutations distinguées. Kiné Baba DIENG'

    const result = parseDocumentText(glued, 'COVER_LETTER') as {
      senderName?: string
      senderEmail?: string
      senderPhone?: string
      companyName?: string
      content: string
      closingText?: string
    }

    expect(result.senderName).toBe('Kiné Baba DIENG')
    expect(result.senderEmail).toBe('diengdkine@gmail.com')
    expect(result.senderPhone).toBe('77-585-30-32')
    expect(result.companyName).toMatch(/Intech group/i)
    expect(result.content).toContain('Fort de mon parcours')
    expect(result.content).not.toMatch(/Madame, Monsieur/i)
    expect(result.content).not.toMatch(/diengdkine@gmail.com/i)
    expect(result.content).not.toMatch(/Objet\s*:/i)
    expect(result.closingText).toMatch(/Je vous prie/i)
  })
})
