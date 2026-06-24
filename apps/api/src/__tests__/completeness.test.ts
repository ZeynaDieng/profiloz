import { describe, expect, it } from 'vitest'
import type { ResumeSnapshot } from '@profiloz/shared'
import { calculateCompleteness, getMissingSections } from '../modules/resume/completeness'

const emptyResume: ResumeSnapshot = {
  id: '1',
  title: 'Mon CV',
  templateSlug: 'PROFESSIONNEL',
  templateConfig: {},
  personalInfo: {},
  experiences: [],
  educations: [],
  skills: [],
  certifications: [],
  interests: [],
  languages: [],
  metadata: { completeness: 0, lastModified: '', source: 'wizard' },
}

describe('calculateCompleteness', () => {
  it('returns 0 for empty resume', () => {
    expect(calculateCompleteness(emptyResume)).toBe(0)
  })

  it('returns high score for complete resume', () => {
    const complete: ResumeSnapshot = {
      ...emptyResume,
      personalInfo: { fullName: 'Jean Dupont', email: 'jean@exemple.com' },
      educations: [{ institution: 'Université', degree: 'Master' }],
      experiences: [{ company: 'Acme', position: 'Designer' }],
      skills: [{ name: 'Figma' }, { name: 'Vue' }, { name: 'UX' }],
      summary: 'Designer passionné',
      certifications: [{ name: 'Certification' }],
    }
    expect(calculateCompleteness(complete)).toBeGreaterThanOrEqual(85)
  })
})

describe('getMissingSections', () => {
  it('lists all missing sections for empty resume', () => {
    const missing = getMissingSections(emptyResume)
    expect(missing).toContain('informations')
    expect(missing).toContain('formation')
    expect(missing).toContain('experience')
    expect(missing).toContain('competences')
    expect(missing).toContain('summary')
  })
})
