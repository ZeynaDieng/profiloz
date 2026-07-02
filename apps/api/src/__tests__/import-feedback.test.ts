import { describe, expect, it } from 'vitest'
import { computeImportFieldDiffs } from '../modules/import-feedback/field-diff'

describe('import field diff', () => {
  it('détecte une correction email', () => {
    const diffs = computeImportFieldDiffs(
      { personalInfo: { email: 'wrong@example.com' } },
      { personalInfo: { email: 'right@example.com' } },
    )
    expect(diffs.some((d) => d.path === 'personalInfo.email' && d.status === 'changed')).toBe(true)
  })

  it('détecte une expérience ajoutée', () => {
    const diffs = computeImportFieldDiffs(
      { experiences: [] },
      { experiences: [{ company: 'Acme', position: 'Dev', startDate: '2020' }] },
    )
    expect(diffs.some((d) => d.category === 'experience' && d.status === 'added')).toBe(true)
  })
})
