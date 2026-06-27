import { describe, expect, it } from 'vitest'
import { MIN_NATIVE_PDF_TEXT, shouldFallbackToPdfOcr } from '../modules/ocr/ocr.service'

describe('shouldFallbackToPdfOcr', () => {
  it('active l’OCR quand le PDF natif contient peu de texte', () => {
    expect(shouldFallbackToPdfOcr('')).toBe(true)
    expect(shouldFallbackToPdfOcr('   ')).toBe(true)
    expect(shouldFallbackToPdfOcr('a'.repeat(MIN_NATIVE_PDF_TEXT - 1))).toBe(true)
  })

  it('conserve l’extraction native pour un PDF texte suffisant', () => {
    expect(shouldFallbackToPdfOcr('a'.repeat(MIN_NATIVE_PDF_TEXT))).toBe(false)
    expect(
      shouldFallbackToPdfOcr(
        'Master Marketing Digital et Communication\nUniversité Cheikh Anta Diop de Dakar\n2020 - 2022',
      ),
    ).toBe(false)
  })
})
