import { describe, expect, it } from 'vitest'
import { repairSpacedOutText, scoreExtractedPdfText } from '../modules/ocr/text-repair'

describe('repairSpacedOutText', () => {
  it('recolle les lettres espacées caractère par caractère', () => {
    const spaced =
      'K i n é B a b a DIENG D a k a r d i e n g d k i n e @ g m a i l . c o m M a d a m e , M o n s i e u r ,'

    const repaired = repairSpacedOutText(spaced)

    expect(repaired).toContain('Kiné Baba DIENG')
    expect(repaired).toContain('diengdkine@gmail.com')
    expect(repaired).toContain('Madame, Monsieur,')
  })

  it('ne modifie pas le fond d’un texte déjà normal', () => {
    const normal = 'Kiné Baba DIENG\nDakar\ndiengdkine@gmail.com\n\nMadame, Monsieur,'
    const repaired = repairSpacedOutText(normal)
    expect(repaired).toContain('Kiné Baba DIENG')
    expect(repaired).toContain('diengdkine@gmail.com')
    expect(repaired).toContain('Madame, Monsieur,')
  })

  it('sépare un mois collé au titre de poste', () => {
    const glued = 'Chargé des opérations comptables et de trésorerieJanvier 2025 – Présent'
    expect(repairSpacedOutText(glued)).toContain('trésorerie Janvier 2025')
  })
})

describe('scoreExtractedPdfText', () => {
  it('favorise un texte lisible sans espaces entre chaque lettre', () => {
    const glued = 'Kiné Baba DIENG Dakar diengdkine@gmail.com Madame, Monsieur, Objet : Candidature.'
    const spaced = 'K i n é B a b a DIENG D a k a r d i e n g d k i n e @ g m a i l . c o m'

    expect(scoreExtractedPdfText(glued)).toBeGreaterThan(scoreExtractedPdfText(spaced))
  })
})
