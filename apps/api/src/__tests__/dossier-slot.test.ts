import { describe, expect, it } from 'vitest'
import { decideDossierSlot, snapshotDocKey } from '../modules/payment/payment.service'

describe('snapshotDocKey', () => {
  it('identifie le document par son id', () => {
    expect(snapshotDocKey('cv', 'abc')).toBe('cv:abc')
    expect(snapshotDocKey('letter', ' x1 ')).toBe('letter:x1')
  })

  it('retombe sur le type seul sans id', () => {
    expect(snapshotDocKey('cv', undefined)).toBe('cv')
    expect(snapshotDocKey('letter', '')).toBe('letter')
  })
})

describe('decideDossierSlot', () => {
  it('retéléchargement du même CV : déjà dans le dossier', () => {
    expect(decideDossierSlot(['cv:a'], 'cv:a')).toBe('known')
  })

  it('la lettre rejoint un dossier qui ne contient que le CV', () => {
    expect(decideDossierSlot(['cv:a'], 'letter:l1')).toBe('free-slot')
  })

  it('un autre CV ne rentre pas dans le dossier payé', () => {
    expect(decideDossierSlot(['cv:a', 'letter:l1'], 'cv:b')).toBe('slot-taken')
    expect(decideDossierSlot(['cv:a'], 'cv:b')).toBe('slot-taken')
  })

  it('une autre lettre ne rentre pas dans le dossier payé', () => {
    expect(decideDossierSlot(['cv:a', 'letter:l1'], 'letter:l2')).toBe('slot-taken')
  })

  it("ancien format sans id : le premier document identifié adopte l'emplacement", () => {
    expect(decideDossierSlot(['cv'], 'cv:a')).toBe('adopt-legacy')
    expect(decideDossierSlot(['cv', 'letter'], 'letter:l1')).toBe('adopt-legacy')
  })

  it('dossier vide : emplacement libre', () => {
    expect(decideDossierSlot([], 'cv:a')).toBe('free-slot')
  })
})
