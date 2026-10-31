import { describe, expect, it } from 'vitest'
import { stripLetterFormulas } from '../cover-letter.js'

const BODY = 'Vous recherchez un assistant rigoureux.\n\nMon parcours chez Orange Money m’a formée à l’accueil.'

describe('stripLetterFormulas', () => {
  it('laisse intact un corps sans formules', () => {
    expect(stripLetterFormulas(BODY)).toBe(BODY)
  })

  it('retire la formule d’appel', () => {
    expect(stripLetterFormulas(`Madame, Monsieur,\n\n${BODY}`)).toBe(BODY)
    expect(stripLetterFormulas(`Mme Ndiaye,\n${BODY}`)).toBe(BODY)
    expect(stripLetterFormulas(`Madame/Monsieur,\n\n${BODY}`)).toBe(BODY)
  })

  it('retire la formule de politesse et la signature', () => {
    const closing = "Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées."
    expect(stripLetterFormulas(`${BODY}\n\n${closing}\n\nAwa Diop`)).toBe(BODY)
    expect(stripLetterFormulas(`${BODY}\n\nCordialement,`)).toBe(BODY)
  })

  it('retire une politesse collée au dernier paragraphe', () => {
    const last = 'Je serais ravie d’échanger avec vous. Veuillez agréer, Madame, Monsieur, mes salutations distinguées.'
    expect(stripLetterFormulas(`Vous recherchez un assistant.\n\n${last}`)).toBe(
      'Vous recherchez un assistant.\n\nJe serais ravie d’échanger avec vous.',
    )
  })

  it('garde une dernière phrase courte sans point', () => {
    const text = 'Vous recherchez un assistant.\n\nJe suis disponible dès maintenant'
    expect(stripLetterFormulas(text)).toBe(text)
  })

  it('garde un paragraphe de contenu qui commence par « Madame »', () => {
    const text = 'Madame Diallo m’a recommandé votre entreprise pour sa rigueur.\n\nJe souhaite vous rejoindre.'
    expect(stripLetterFormulas(text)).toBe(text)
  })
})
