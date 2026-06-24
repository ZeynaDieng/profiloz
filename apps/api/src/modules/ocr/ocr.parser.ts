import type { ResumeSnapshot } from '@profiloz/shared'

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/i
const PHONE_RE = /(?:\+?\d[\d\s().-]{7,}\d)/

export function parseResumeText(rawText: string): Partial<ResumeSnapshot> {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  const email = rawText.match(EMAIL_RE)?.[0]
  const phone = rawText.match(PHONE_RE)?.[0]?.trim()

  const personalInfo = {
    fullName: lines[0] && !EMAIL_RE.test(lines[0]) ? lines[0] : undefined,
    email,
    phone,
    location: lines.find((l) => /,\s*[A-Za-zÀ-ÿ]/.test(l) && l.length < 80),
  }

  const experiences: ResumeSnapshot['experiences'] = []
  const educations: ResumeSnapshot['educations'] = []
  const skills: ResumeSnapshot['skills'] = []

  let section = ''
  for (const line of lines) {
    const lower = line.toLowerCase()
    if (/expérience|experience|employment|work/i.test(lower)) {
      section = 'experience'
      continue
    }
    if (/formation|education|diplôme|diplome/i.test(lower)) {
      section = 'education'
      continue
    }
    if (/compétence|competence|skills/i.test(lower)) {
      section = 'skills'
      continue
    }

    if (section === 'experience' && line.length > 5 && line.length < 120) {
      const parts = line.split(/[|•–-]/).map((p) => p.trim())
      if (parts.length >= 2) {
        experiences.push({
          position: parts[0] ?? line,
          company: parts[1] ?? '',
          startDate: parts[2],
        })
      }
    }

    if (section === 'education' && line.length > 5 && line.length < 120) {
      educations.push({
        degree: line,
        institution: '',
      })
    }

    if (section === 'skills' && line.includes(',')) {
      line.split(',').forEach((s) => {
        const name = s.trim()
        if (name) skills.push({ name })
      })
    }
  }

  return {
    personalInfo,
    experiences: experiences.slice(0, 10),
    educations: educations.slice(0, 10),
    skills: skills.slice(0, 20),
  }
}
