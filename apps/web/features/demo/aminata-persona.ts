import type { ResumeSnapshot } from '@profiloz/shared'
import type { CoverLetterSnapshot } from '~/types/cover-letter'
import { DEFAULT_CLOSING_TEXT } from '~/types/cover-letter'
import { createRandomId } from '~/utils/random-id'
import {
  defaultLetterAccentColor,
  resolveCvAccentColor,
} from '~/utils/template-accent-colors'

/** Persona démo Profilo'Z — alignée sur le hero (Aminata Diallo, marketing, Dakar). */
export const AMINATA_PERSONA = {
  fullName: 'Aminata Diallo',
  email: 'aminata@exemple.com',
  phone: '+221 77 000 00 00',
  location: 'Dakar, Sénégal',
  jobTitle: 'Responsable marketing',
  targetPosition: 'Responsable marketing digital',
  companyName: 'Wave Mobile Money',
  companyAddress: 'Immeuble SDMO, Plateau, Dakar',
  recruiterName: 'Mme Ndiaye',
} as const

export function createAminataDemoResume(
  templateSlug: ResumeSnapshot['templateSlug'] = 'PROFESSIONNEL',
  accentColor = '#0051d5',
): ResumeSnapshot {
  return {
    id: 'demo-aminata',
    title: 'CV Aminata Diallo',
    templateSlug,
    templateConfig: { accentColor },
    personalInfo: {
      fullName: AMINATA_PERSONA.fullName,
      email: AMINATA_PERSONA.email,
      phone: AMINATA_PERSONA.phone,
      location: AMINATA_PERSONA.location,
      jobTitle: AMINATA_PERSONA.jobTitle,
    },
    summary:
      'Professionnelle du marketing digital avec plus de 5 ans d\'expérience en communication, gestion de projet et campagnes multicanales. Orientée résultats, j\'accompagne les marques dans leur croissance sur le marché sénégalais et ouest-africain.',
    experiences: [
      {
        company: 'Orange Sénégal',
        position: 'Chef de projet digital',
        location: 'Dakar',
        startDate: '2021',
        endDate: '',
        isCurrent: true,
        description:
          'Pilotage de campagnes multicanales (digital, réseaux sociaux, email).\nCoordination des équipes créatives et des prestataires externes.\nSuivi des KPIs (trafic, conversion, engagement) et optimisation du ROI.\nLancement de parcours clients mobile-first pour les offres fibre et mobile.',
      },
      {
        company: 'Sonatel',
        position: 'Chargée de communication',
        location: 'Dakar',
        startDate: '2019',
        endDate: '2021',
        description:
          'Rédaction de contenus institutionnels et communiqués de presse.\nAnimation des réseaux sociaux et modération de la communauté.\nOrganisation d\'événements corporate et partenariats médias.',
      },
      {
        company: 'Agence Kër Com',
        position: 'Assistante marketing',
        location: 'Dakar',
        startDate: '2017',
        endDate: '2019',
        description:
          'Support à la conception de campagnes publicitaires locales.\nVeille concurrentielle et reporting hebdomadaire.\nParticipation à la stratégie de contenu pour des clients PME.',
      },
    ],
    educations: [
      {
        institution: 'Université Cheikh Anta Diop (UCAD)',
        degree: 'Master Marketing & Communication',
        field: 'Marketing digital',
        location: 'Dakar',
        startDate: '2017',
        endDate: '2019',
      },
      {
        institution: 'Université Cheikh Anta Diop (UCAD)',
        degree: 'Licence Sciences Économiques',
        field: 'Gestion',
        location: 'Dakar',
        startDate: '2014',
        endDate: '2017',
      },
    ],
    skills: [
      { name: 'Communication' },
      { name: 'Marketing digital' },
      { name: 'Gestion de projet' },
      { name: 'Analytics' },
      { name: 'Réseaux sociaux' },
      { name: 'Canva' },
      { name: 'Google Analytics' },
      { name: 'Stratégie de marque' },
    ],
    certifications: [
      {
        name: 'Google Analytics',
        issuer: 'Google',
        issueDate: '2022',
      },
    ],
    languages: [
      { name: 'Français', level: 'NATIVE' },
      { name: 'Anglais', level: 'PROFESSIONAL' },
      { name: 'Wolof', level: 'CONVERSATIONAL' },
    ],
    interests: [{ name: 'Veille marketing' }, { name: 'Lecture' }, { name: 'Course à pied' }],
    metadata: {
      completeness: 95,
      lastModified: new Date().toISOString(),
      source: 'wizard',
    },
  }
}

export const AMINATA_DEMO_RESUME = createAminataDemoResume()

const AMINATA_LETTER_CONTENT = `Fort(e) de mon expérience en tant que Chef de projet digital chez Orange Sénégal, je me permets de vous adresser ma candidature pour le poste de ${AMINATA_PERSONA.targetPosition} au sein de ${AMINATA_PERSONA.companyName}.

Au cours de ces dernières années, j'ai piloté des campagnes multicanales, coordonné des équipes créatives et optimisé les parcours clients avec des résultats mesurables. Mon Master Marketing obtenu à l'UCAD m'a dotée d'une solide base en stratégie de marque et en analyse de performance.

Rigoureuse, orientée résultats et passionnée par l'innovation digitale, je serais ravie de mettre mes compétences au service de vos ambitions commerciales. Je reste à votre disposition pour un entretien afin d'échanger sur ma candidature.`

export function createAminataDemoLetter(
  templateSlug: CoverLetterSnapshot['templateSlug'] = 'CLASSIQUE',
): CoverLetterSnapshot {
  return {
    templateSlug,
    senderName: AMINATA_PERSONA.fullName,
    senderEmail: AMINATA_PERSONA.email,
    senderPhone: AMINATA_PERSONA.phone,
    senderLocation: AMINATA_PERSONA.location,
    companyName: AMINATA_PERSONA.companyName,
    companyAddress: AMINATA_PERSONA.companyAddress,
    position: AMINATA_PERSONA.targetPosition,
    recruiterName: AMINATA_PERSONA.recruiterName,
    content: AMINATA_LETTER_CONTENT,
    closingText: DEFAULT_CLOSING_TEXT,
  }
}

export function createAminataCoverLetterDraft() {
  const letter = createAminataDemoLetter()
  return {
    id: createRandomId(),
    templateSlug: letter.templateSlug,
    senderName: letter.senderName ?? '',
    senderEmail: letter.senderEmail ?? '',
    senderPhone: letter.senderPhone ?? '',
    senderLocation: letter.senderLocation ?? '',
    companyName: letter.companyName ?? '',
    companyAddress: letter.companyAddress ?? '',
    position: letter.position ?? '',
    recruiterName: letter.recruiterName ?? '',
    content: letter.content,
    closingText: letter.closingText ?? DEFAULT_CLOSING_TEXT,
    accentColor: defaultLetterAccentColor(letter.templateSlug),
    lastModified: new Date().toISOString(),
  }
}

/** Préremplit la lettre à partir du CV de l'utilisateur (ou fallback demo si aucun CV). */
export function coverLetterDraftFromResume(resume: ResumeSnapshot | null | undefined) {
  const personal = resume?.personalInfo
  if (!personal?.fullName?.trim()) {
    return createAminataCoverLetterDraft()
  }

  const base: ReturnType<typeof createAminataCoverLetterDraft> = {
    id: createRandomId(),
    templateSlug: 'CLASSIQUE',
    senderName: personal.fullName || '',
    senderEmail: personal.email || '',
    senderPhone: personal.phone || '',
    senderLocation: personal.location || '',
    companyName: '',
    companyAddress: '',
    position: personal.jobTitle || '',
    recruiterName: '',
    content: '',
    closingText: DEFAULT_CLOSING_TEXT,
    accentColor: defaultLetterAccentColor('CLASSIQUE'),
    lastModified: new Date().toISOString(),
  }

  if (resume?.templateSlug) {
    base.accentColor = resolveCvAccentColor(
      resume.templateSlug,
      resume.templateConfig?.accentColor,
    )
  }

  const latestJob = resume?.experiences?.[0]
  const targetPos = personal.jobTitle || latestJob?.position || ''
  if (latestJob?.company && latestJob.position) {
    base.content = `Fort(e) de mon expérience en tant que ${latestJob.position} chez ${latestJob.company}, je souhaite vous adresser ma candidature pour le poste de ${targetPos || 'votre équipe'}.

Au cours de mes expériences précédentes, j'ai développé des compétences solides en organisation, suivi d'activités et travail en équipe. Mon parcours m'a permis d'acquérir une bonne maîtrise des méthodes de travail et une forte capacité d'adaptation.

Motivé(e) et rigoureux(se), je serais ravi(e) de mettre mes compétences et mon enthousiasme au service de vos projets.`
  }

  base.lastModified = new Date().toISOString()
  return base
}
