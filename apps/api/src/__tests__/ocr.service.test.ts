import { describe, expect, it } from 'vitest'
import { MIN_NATIVE_PDF_TEXT, MIN_NATIVE_PDF_SCORE, shouldFallbackToPdfOcr } from '../modules/ocr/ocr.service'
import { scoreExtractedPdfText } from '../modules/ocr/text-repair'
import { runConservativeImport, shouldUseConservativeParsing } from '../modules/ocr/pipeline/conservative'
import { runResumePipeline } from '../modules/ocr/pipeline'

describe('shouldFallbackToPdfOcr', () => {
  it('active l’OCR quand le PDF natif contient peu de texte', () => {
    expect(shouldFallbackToPdfOcr('')).toBe(true)
    expect(shouldFallbackToPdfOcr('   ')).toBe(true)
    expect(shouldFallbackToPdfOcr('a'.repeat(MIN_NATIVE_PDF_TEXT - 1))).toBe(true)
  })

  it('conserve l’extraction native pour un PDF texte de bonne qualité', () => {
    const goodText =
      'Master Marketing Digital et Communication\nUniversité Cheikh Anta Diop de Dakar\n2020 - 2022\nExpériences professionnelles\nDéveloppeur web — Agence Pixel\n2019 - 2024'
    expect(shouldFallbackToPdfOcr('a'.repeat(MIN_NATIVE_PDF_TEXT))).toBe(true)
    expect(shouldFallbackToPdfOcr(goodText)).toBe(false)
    expect(scoreExtractedPdfText(goodText)).toBeGreaterThanOrEqual(MIN_NATIVE_PDF_SCORE)
  })

  it('force l’OCR quand le texte natif est espacé / illisible', () => {
    const spaced = 'E x p é r i e n c e s\nD é v e l o p p e u r\n2 0 2 0 - 2 0 2 4'
    expect(shouldFallbackToPdfOcr(spaced.padEnd(MIN_NATIVE_PDF_TEXT, ' '))).toBe(true)
  })
})

describe('mode conservateur scan faible', () => {
  it('n’extrait pas de sections mélangées quand l’OCR est faible', async () => {
    const garbage = `
M o d o u F a l l
P l o m b i e r
C O M P E T E N C E S
I n s t a l l a t i o n
2 0 2 5 P l o m b i e r
I N D E P E N D A N T
    `.trim()

    expect(shouldUseConservativeParsing(0.3, garbage)).toBe(true)

    const result = await runResumePipeline(garbage, { ocrConfidence: 0.3 })
    expect(result.experiences).toEqual([])
    expect(result.educations).toEqual([])
    expect(result.skills).toEqual([])
    expect(result._extraction.partialImport).toBe(true)
    expect(result._extraction.review).toEqual([])
  })

  it('conserve les coordonnées détectables en mode conservateur', () => {
    const raw = `
Jean Dupont
jean.dupont@example.com
06 12 34 56 78
Lyon
Expériences mélangées OCR bruit
    `.trim()

    const result = runConservativeImport(raw, 0.2)
    expect(result.personalInfo?.email).toMatch(/jean\.dupont@example\.com/i)
    expect(result.experiences).toEqual([])
  })
})
