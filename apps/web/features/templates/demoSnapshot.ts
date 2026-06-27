import type { ResumeSnapshot } from '@profiloz/shared'

export const DEMO_RESUME: ResumeSnapshot = {
  id: 'demo',
  title: 'Mon CV',
  templateSlug: 'PROFESSIONNEL',
  templateConfig: { accentColor: '#0051d5' },
  personalInfo: {
    fullName: 'Aminata Diallo',
    email: 'aminata@exemple.com',
    phone: '+221 77 000 00 00',
    location: 'Dakar, Sénégal',
    jobTitle: 'Responsable marketing',
  },
  summary: 'Professionnelle expérimentée avec une solide expertise en communication et gestion de projet.',
  experiences: [
    {
      company: 'Orange Sénégal',
      position: 'Chef de projet digital',
      startDate: '2021',
      endDate: '',
      isCurrent: true,
      description: 'Pilotage de campagnes multicanales.',
    },
  ],
  educations: [
    {
      institution: 'UCAD',
      degree: 'Master Marketing',
      endDate: '2019',
    },
  ],
  skills: [{ name: 'Communication' }, { name: 'Gestion de projet' }, { name: 'Analytics' }],
  certifications: [],
  interests: [],
  languages: [],
  metadata: { completeness: 85, lastModified: new Date().toISOString(), source: 'wizard' },
}

export function buildPreviewSnapshot(
  slug: ResumeSnapshot['templateSlug'],
  accentColor?: string,
  userSnapshot?: ResumeSnapshot | null,
): ResumeSnapshot {
  const base = { ...DEMO_RESUME, templateSlug: slug }
  if (slug === 'CADRE') {
    base.templateConfig = { ...base.templateConfig, accentColor: accentColor ?? '#1a3050' }
    base.personalInfo = {
      ...base.personalInfo,
      fullName: userSnapshot?.personalInfo.fullName ?? 'Sacha Dubois',
      jobTitle: userSnapshot?.personalInfo.jobTitle ?? 'Chargée de projet',
      phone: userSnapshot?.personalInfo.phone ?? '123-456-7890',
      email: userSnapshot?.personalInfo.email ?? 'hello@reallygreatsite.com',
      location: userSnapshot?.personalInfo.location ?? '123 Anywhere St., Any City',
    }
    if (!userSnapshot?.experiences?.length) {
      base.experiences = [
        {
          company: 'Borcelle Studio',
          position: 'Chargée de projet',
          location: '123 Anywhere St., Any City',
          startDate: 'Janvier 2020',
          endDate: '',
          isCurrent: true,
          description:
            'Développe et supervise les projets du début à la fin.\nGère les budgets et les calendriers de projet.\nDirige les équipes et les parties prenantes.',
        },
        {
          company: 'Fauget Studio',
          position: 'Chargée de projet',
          location: '123 Anywhere St., Any City',
          startDate: '2018',
          endDate: '2020',
          description:
            'Développe et supervise les projets du début à la fin.\nGère les budgets et les calendriers de projet.\nDirige les équipes et les parties prenantes.',
        },
      ]
    }
    if (!userSnapshot?.educations?.length) {
      base.educations = [
        { degree: 'Master en gestion de projet', institution: 'École de commerce', startDate: '2016', endDate: '2018' },
        { degree: 'Licence en administration des affaires', institution: 'École de commerce', startDate: '2012', endDate: '2016' },
      ]
    }
    if (!userSnapshot?.skills?.length) {
      base.skills = [
        { name: 'Gestion du temps' },
        { name: "Capacités d'organisation" },
        { name: 'Communication' },
        { name: 'Leadership' },
        { name: 'Logiciels de gestion de projet' },
        { name: 'Gestion de budget' },
      ]
    }
    if (!userSnapshot?.languages?.length) {
      base.languages = [
        { name: 'Anglais', level: 'PROFESSIONAL' },
        { name: 'Allemand', level: 'CONVERSATIONAL' },
      ]
    }
    if (!userSnapshot?.interests?.length) {
      base.interests = [{ name: 'Lecture' }, { name: 'Randonnée' }, { name: 'Gymnastique' }, { name: 'Judo' }]
    }
  } else if (slug === 'EXECUTIF') {
    base.templateConfig = { ...base.templateConfig, accentColor: accentColor ?? '#2c3e50' }
    base.personalInfo = {
      ...base.personalInfo,
      fullName: userSnapshot?.personalInfo.fullName ?? 'Thomas Garcia',
      jobTitle: userSnapshot?.personalInfo.jobTitle ?? 'Commercial',
      phone: userSnapshot?.personalInfo.phone ?? '123-456-7890',
      email: userSnapshot?.personalInfo.email ?? 'hello@reallygreatsite.com',
      location: userSnapshot?.personalInfo.location ?? '123 Anywhere St., Any City',
    }
    if (!userSnapshot?.summary?.trim()) {
      base.summary =
        'Professionnel dynamique, orienté résultats, avec une solide expérience en vente et en relation client.'
    }
    if (!userSnapshot?.experiences?.length) {
      base.experiences = [
        {
          company: 'Durance Média',
          position: 'Chargé de communication & marketing',
          startDate: '2023',
          endDate: '',
          isCurrent: true,
          description:
            'Développement de la notoriété de la marque.\nGestion des campagnes publicitaires.\nAnalyse des performances commerciales.',
        },
        {
          company: 'Studio Shodwe',
          position: 'Commercial',
          startDate: '2020',
          endDate: '2023',
          description:
            'Prospection et fidélisation client.\nNégociation et closing.\nSuivi du portefeuille clients.',
        },
      ]
    }
    if (!userSnapshot?.educations?.length) {
      base.educations = [
        { degree: 'Master commerce & marketing', institution: 'École de commerce', endDate: '2019' },
        { degree: 'Licence commerce', institution: 'Université', endDate: '2017' },
      ]
    }
    if (!userSnapshot?.skills?.length) {
      base.skills = [{ name: 'Pack Office' }, { name: 'CRM Salesforce' }, { name: 'Canva' }]
    }
    if (!userSnapshot?.languages?.length) {
      base.languages = [
        { name: 'Arabe', level: 'NATIVE' },
        { name: 'Anglais', level: 'BASIC' },
        { name: 'Espagnol', level: 'BASIC' },
      ]
    }
    if (!userSnapshot?.interests?.length) {
      base.interests = [
        { name: 'Sports : Football, vélo, natation' },
        { name: 'Voyages : Italie, Espagne, Angleterre' },
      ]
    }
  } else if (accentColor) {
    base.templateConfig = { ...base.templateConfig, accentColor }
  }
  if (userSnapshot?.personalInfo.fullName) {
    return {
      ...userSnapshot,
      templateSlug: slug,
      templateConfig: {
        ...userSnapshot.templateConfig,
        accentColor: accentColor ?? userSnapshot.templateConfig.accentColor ?? base.templateConfig.accentColor,
      },
      experiences: userSnapshot.experiences?.length ? userSnapshot.experiences : base.experiences,
      educations: userSnapshot.educations?.length ? userSnapshot.educations : base.educations,
      skills: userSnapshot.skills?.length ? userSnapshot.skills : base.skills,
      languages: userSnapshot.languages?.length ? userSnapshot.languages : base.languages,
      interests: userSnapshot.interests?.length ? userSnapshot.interests : base.interests,
      summary: userSnapshot.summary?.trim() ? userSnapshot.summary : base.summary,
    }
  }
  return base
}
