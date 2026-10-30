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
  it('retéléchargement du même document : déjà dans le dossier', () => {
    expect(decideDossierSlot(['cv:a'], 'cv:a')).toBe('known')
  })

  it('2 documents au choix : CV + lettre, lettre + CV, 2 CV ou 2 lettres', () => {
    expect(decideDossierSlot(['cv:a'], 'letter:l1')).toBe('free-slot')
    expect(decideDossierSlot(['letter:l1'], 'cv:a')).toBe('free-slot')
    expect(decideDossierSlot(['cv:a'], 'cv:b')).toBe('free-slot')
    expect(decideDossierSlot(['letter:l1'], 'letter:l2')).toBe('free-slot')
  })

  it('un 3e document demande une nouvelle offre', () => {
    expect(decideDossierSlot(['cv:a', 'letter:l1'], 'cv:b')).toBe('slot-taken')
    expect(decideDossierSlot(['cv:a', 'cv:b'], 'letter:l1')).toBe('slot-taken')
    expect(decideDossierSlot(['letter:l1', 'letter:l2'], 'letter:l3')).toBe('slot-taken')
  })

  it("ancien format sans id : le premier document identifié de ce type le remplace", () => {
    expect(decideDossierSlot(['cv'], 'cv:a')).toBe('adopt-legacy')
    expect(decideDossierSlot(['cv', 'letter'], 'letter:l1')).toBe('adopt-legacy')
  })

  it('dossier vide : place libre', () => {
    expect(decideDossierSlot([], 'cv:a')).toBe('free-slot')
  })
})
