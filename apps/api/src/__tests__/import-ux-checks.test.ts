import { describe, expect, it } from 'vitest'
import {
  educationsSeparated,
  experiencesChronologicallyOrdered,
  runImportUxChecks,
  skillsNoDuplicates,
} from '../modules/ocr/validation/import-ux-checks'

describe('import-ux-checks', () => {
  it('détecte les expériences hors ordre chronologique', () => {
    const check = experiencesChronologicallyOrdered({
      experiences: [
        { company: 'A', position: 'Dev', startDate: '2018', endDate: '2020' },
        { company: 'B', position: 'Lead', startDate: '2022', endDate: '2024' },
      ],
    })
    expect(check.passed).toBe(false)
  })

  it('accepte un ordre décroissant', () => {
    const check = experiencesChronologicallyOrdered({
      experiences: [
        { company: 'B', position: 'Lead', startDate: '2022', endDate: '2024' },
        { company: 'A', position: 'Dev', startDate: '2018', endDate: '2020' },
      ],
    })
    expect(check.passed).toBe(true)
  })

  it('détecte les compétences dupliquées', () => {
    const check = skillsNoDuplicates({
      skills: [{ name: 'React' }, { name: 'react' }],
    })
    expect(check.passed).toBe(false)
  })

  it('détecte formation dupliquée en expérience', () => {
    const check = educationsSeparated({
      experiences: [{ company: 'Université Lyon', position: 'Master Info', startDate: '2015' }],
      educations: [{ institution: 'Université Lyon', degree: 'Master Info' }],
    })
    expect(check.passed).toBe(false)
  })

  it('calcule un score UX global', () => {
    const report = runImportUxChecks({
      personalInfo: { fullName: 'Test User', email: 'a@b.c' },
      summary: 'Profil avec assez de contenu pour passer le seuil minimum.',
      experiences: [{ company: 'Co', position: 'Dev', startDate: '2020' }],
      educations: [{ institution: 'Ecole', degree: 'Licence' }],
      skills: [{ name: 'JS' }],
      languages: [{ name: 'Français' }],
    })
    expect(report.passed).toBe(true)
    expect(report.score).toBe(100)
  })
})
