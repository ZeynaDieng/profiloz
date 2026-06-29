import { describe, expect, it } from 'vitest'
import { normalizeResumeSnapshotForPdf } from '../lib/pdf/normalize-resume-snapshot'
import { AppError } from '../lib/errors'

describe('normalizeResumeSnapshotForPdf', () => {
  it('accepts snapshot with minimal personalInfo', () => {
    const snapshot = normalizeResumeSnapshotForPdf({
      personalInfo: { fullName: 'Aminata Diop' },
    })
    expect(snapshot.personalInfo.fullName).toBe('Aminata Diop')
    expect(snapshot.templateSlug).toBe('PROFESSIONNEL')
    expect(snapshot.experiences).toEqual([])
  })

  it('rejects snapshot without fullName', () => {
    expect(() => normalizeResumeSnapshotForPdf({ personalInfo: {} })).toThrow(AppError)
  })

  it('handles missing personalInfo without throwing TypeError', () => {
    expect(() => normalizeResumeSnapshotForPdf({ title: 'CV' })).toThrow(AppError)
  })
})
