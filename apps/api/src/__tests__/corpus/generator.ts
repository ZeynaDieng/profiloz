import type { CorpusCase } from './types'

const FIRST_NAMES = [
  'Amadou', 'Fatou', 'Moussa', 'Aïcha', 'Ibrahima', 'Mariama', 'Ousmane', 'Khady', 'Cheikh', 'Awa',
  'Jean', 'Marie', 'Pierre', 'Sophie', 'Lucas', 'Emma', 'Thomas', 'Camille', 'Nicolas', 'Julie',
]

const LAST_NAMES = [
  'Diallo', 'Sow', 'Ba', 'Ndiaye', 'Fall', 'Sy', 'Gueye', 'Camara', 'Diop', 'Kane',
  'Martin', 'Bernard', 'Dubois', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Michel',
]

const JOBS = [
  'Développeur Full Stack', 'Designer UX/UI', 'Chef de projet digital', 'Comptable', 'Infirmier',
  'Commercial B2B', 'Data Analyst', 'Responsable RH', 'Technicien réseau', 'Aide-soignant',
  'Software Engineer', 'Marketing Manager', 'Plombier', 'Électricien', 'Community Manager',
]

const COMPANIES = [
  'Orange Sénégal', 'Sonatel', 'Agence Pixel', 'TechHub Dakar', 'Baobab Consulting',
  'Clinique Pasteur', 'BNP Paribas', 'Capgemini', 'Startup Flow', 'Groupe Sahel',
]

const SCHOOLS = [
  'UCAD', 'Université Lyon 2', 'ESMT Dakar', 'ENSUP', 'HEC Paris', 'Université Cheikh Anta Diop',
  'Institut Supérieur de Management', 'École Polytechnique', 'ISIM', 'Groupe ISCAE',
]

const DEGREES = [
  'Licence Informatique', 'Master Marketing Digital', 'BTS Comptabilité', 'DUT Génie électrique',
  'MBA Management', 'Licence Pro Développement web', 'Doctorat Sciences', 'Bachelor Design',
]

const TECH_SKILLS = [
  'React', 'Vue.js', 'Node.js', 'TypeScript', 'PHP', 'Laravel', 'Docker', 'Git', 'AWS', 'Figma',
  'Excel', 'Power BI', 'Python', 'SQL', 'PostgreSQL', 'Agile', 'Scrum',
]

const LANG_LINES = [
  'Français — Courant',
  'Anglais — Professionnel',
  'Wolof — Maternelle',
  'Espagnol — Intermédiaire',
  'Français, Anglais, Wolof',
  'French (native), English (fluent), Arabic (basic)',
]

const SECTION_HEADERS = {
  experience: ['Expériences professionnelles', 'Historique', 'Parcours', 'Work Experience', 'Employment'],
  education: ['Formations', 'Études et diplômes', 'Education', 'Cursus universitaire'],
  skills: ['Compétences', 'Compétences techniques', 'Skills', 'Expertises'],
  languages: ['Langues', 'Languages'],
  profile: ['Profil', 'À propos', 'Summary', 'Objectif professionnel'],
}

const LAYOUTS = [
  'Canva 1 colonne',
  'Word 2 colonnes',
  'Europass',
  'Adobe 1 colonne',
  'PDF texte',
  'DOCX export',
  'Canva 2 colonnes',
  'Word classique',
]

function pick<T>(arr: T[], index: number): T {
  return arr[index % arr.length]!
}

function buildClassicCv(index: number): { rawText: string; expect: CorpusCase['expect'] } {
  const first = pick(FIRST_NAMES, index)
  const last = pick(LAST_NAMES, index + 3)
  const fullName = `${first} ${last}`
  const job = pick(JOBS, index)
  const email = `${first.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}.${last.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}${index}@example.com`
  const expHeader = pick(SECTION_HEADERS.experience, index)
  const eduHeader = pick(SECTION_HEADERS.education, index)
  const skillsHeader = pick(SECTION_HEADERS.skills, index)
  const langHeader = pick(SECTION_HEADERS.languages, index)
  const profileHeader = pick(SECTION_HEADERS.profile, index)
  const company1 = pick(COMPANIES, index)
  const company2 = pick(COMPANIES, index + 5)
  const school = pick(SCHOOLS, index)
  const degree = pick(DEGREES, index)
  const skills = TECH_SKILLS.slice(index % 5, (index % 5) + 6).join(', ')
  const dateStyle = index % 4

  let date1 = '2019 - 2022'
  let date2 = 'Depuis 2023'
  if (dateStyle === 1) {
    date1 = 'Janvier 2019 - Mars 2022'
    date2 = 'Depuis 2023'
  } else if (dateStyle === 2) {
    date1 = '01/2019 - 06/2022'
    date2 = '07/2023 - Présent'
  } else if (dateStyle === 3) {
    date1 = '2020 - 2023'
    date2 = '2024 - Aujourd\'hui'
  }

  const rawText = `
${fullName}
${job}
${email} — +221 77 ${String(100 + (index % 900)).padStart(3, '0')} ${String(10 + (index % 90)).padStart(2, '0')} ${String(10 + (index % 90)).padStart(2, '0')} — Dakar

${profileHeader}
Professionnel(le) motivé(e) avec expérience en ${job.toLowerCase()} et maîtrise de ${skills.split(', ').slice(0, 3).join(', ')}.

${expHeader}
${job} — ${company1}
${date1}
- Pilotage de projets et coordination d'équipe
- Utilisation de ${skills.split(', ')[0]} et ${skills.split(', ')[1] ?? 'Git'}

Assistant(e) — ${company2}
${date2}
- Support opérationnel et reporting

${eduHeader}
${degree} — ${school}
2015 - 2018

${skillsHeader}
${skills}

${langHeader}
Français — Courant, Anglais — Professionnel, Wolof
`.trim()

  return {
    rawText,
    expect: {
      fullName,
      jobTitle: new RegExp(job.split(/\s+/)[0]!, 'i'),
      email,
      minExperiences: 2,
      maxExperiences: 3,
      minEducations: 1,
      minSkills: 4,
      minLanguages: 2,
      experiencePositions: [new RegExp(job.split(/\s+/)[0]!, 'i')],
    },
  }
}

function buildTwoColumnCv(index: number): { rawText: string; expect: CorpusCase['expect'] } {
  const base = buildClassicCv(index + 100)
  const fullName = base.expect.fullName as string
  const job = pick(JOBS, index + 100)
  const email = base.expect.email!
  const expHeader = pick(SECTION_HEADERS.experience, index)
  const jobHeader = pick(JOBS, index + 100)
  const company1 = pick(COMPANIES, index)
  const company2 = pick(COMPANIES, index + 5)

  const rawText = `
${expHeader}
${jobHeader} — ${company1}, Dakar
2019 - 2022
- Pilotage de projets et coordination d'équipe

Assistant(e) — ${company2}
Depuis 2023
- Support opérationnel et reporting

Formations
${pick(DEGREES, index)} — ${pick(SCHOOLS, index)}

Compétences
${TECH_SKILLS.slice(index % 5, (index % 5) + 6).join(', ')}

Langues
Français, Anglais, Wolof

${fullName}
${job}
${email}
+221 77 000 00 00
Dakar, Sénégal
`.trim()

  return { rawText, expect: { ...base.expect, fullName, jobTitle: new RegExp(job.split(/\s+/)[0]!, 'i') } }
}

function buildDateFirstCv(index: number): { rawText: string; expect: CorpusCase['expect'] } {
  const job = pick(JOBS, index)
  const company1 = pick(COMPANIES, index)
  const company2 = pick(COMPANIES, index + 2)
  const first = pick(FIRST_NAMES, index + 200)
  const last = pick(LAST_NAMES, index + 203)
  const fullName = `${first} ${last}`
  const email = `${first.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}.${last.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}${index + 200}@example.com`
  const rawText = `
${fullName}
${job}
${email}
Historique
2021 - 2023 ${job} — ${company1}, Dakar
Depuis 2024 ${job} — ${company2}
Formations
${pick(DEGREES, index)} — ${pick(SCHOOLS, index)}
Compétences
${TECH_SKILLS.slice(0, 8).join(', ')}
Langues
Français, Anglais
`.trim()
  return {
    rawText,
    expect: {
      fullName,
      jobTitle: new RegExp(job.split(/\s+/)[0]!, 'i'),
      email,
      minExperiences: 2,
      maxExperiences: 3,
      minEducations: 1,
      minSkills: 4,
      minLanguages: 2,
      experiencePositions: [new RegExp(job.split(/\s+/)[0]!, 'i')],
    },
  }
}

function buildEuropassCv(index: number): { rawText: string; expect: CorpusCase['expect'] } {
  const first = pick(FIRST_NAMES, index + 300)
  const last = pick(LAST_NAMES, index + 303)
  const fullName = `${first} ${last}`
  const job = pick(JOBS, index)
  const email = `${first.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}.${last.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}${index + 300}@example.com`
  const rawText = `
Nom : ${last}
Prénom : ${first}
Email : ${email}
Téléphone : +33 6 12 34 56 78
Adresse : Paris, France

Expérience professionnelle
${job} | ${pick(COMPANIES, index)} | 2020 - Présent

Formation
${pick(DEGREES, index)} | ${pick(SCHOOLS, index)} | 2016 - 2019

Compétences informatiques
${TECH_SKILLS.slice(0, 6).join(', ')}

Langues
Français (C2) — Anglais (B2)
`.trim()
  return {
    rawText,
    expect: {
      fullName,
      jobTitle: new RegExp(job.split(/\s+/)[0]!, 'i'),
      email,
      minExperiences: 1,
      maxExperiences: 2,
      minEducations: 1,
      minSkills: 4,
      minLanguages: 2,
      experiencePositions: [new RegExp(job.split(/\s+/)[0]!, 'i')],
    },
  }
}

/** Génère 90 cas synthétiques couvrant mises en page et formats variés. */
export function generateCorpusCases(): CorpusCase[] {
  const builders = [buildClassicCv, buildTwoColumnCv, buildDateFirstCv, buildEuropassCv]
  const cases: CorpusCase[] = []

  for (let i = 0; i < 90; i++) {
    const builder = builders[i % builders.length]!
    const { rawText, expect } = builder(i)
    cases.push({
      name: `gen-${String(i + 1).padStart(3, '0')}-${builders[i % builders.length]!.name.replace('build', '').replace('Cv', '').toLowerCase()}`,
      format: pick(LAYOUTS, i),
      rawText,
      expect,
      strict: false,
    })
  }

  return cases
}
