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
  if (accentColor) {
    base.templateConfig = { ...base.templateConfig, accentColor }
  }
  if (userSnapshot?.personalInfo.fullName) {
    return {
      ...base,
      personalInfo: userSnapshot.personalInfo,
      experiences: userSnapshot.experiences.length ? userSnapshot.experiences : base.experiences,
      educations: userSnapshot.educations.length ? userSnapshot.educations : base.educations,
      skills: userSnapshot.skills.length ? userSnapshot.skills : base.skills,
      templateConfig: {
        ...base.templateConfig,
        ...userSnapshot.templateConfig,
      },
    }
  }
  return base
}
