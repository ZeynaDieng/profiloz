import { describe, expect, it } from 'vitest'
import { sanitizeJsonForDb, sanitizeTextForDb } from '../lib/text-sanitize'

describe('sanitizeTextForDb', () => {
  it('supprime les octets nuls rejetés par PostgreSQL', () => {
    expect(sanitizeTextForDb('Jean\0Dupont')).toBe('JeanDupont')
    expect(sanitizeTextForDb('\0\0CV\0')).toBe('CV')
  })
})

describe('sanitizeJsonForDb', () => {
  it('nettoie récursivement les chaînes dans un objet', () => {
    expect(
      sanitizeJsonForDb({
        personalInfo: { fullName: 'Jean\0Dupont' },
        experiences: [{ company: 'Acme\0Corp', description: 'ok\0' }],
      }),
    ).toEqual({
      personalInfo: { fullName: 'JeanDupont' },
      experiences: [{ company: 'AcmeCorp', description: 'ok' }],
    })
  })
})
