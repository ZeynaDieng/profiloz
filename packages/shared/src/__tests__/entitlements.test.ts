import { describe, expect, it } from 'vitest'
import { mergeSubscriptionPlanSlug, resolvePlanFeatures } from '../entitlements.js'

describe('resolvePlanFeatures', () => {
  it('accorde les fonctionnalités Illimité aux abonnés illimite', () => {
    const features = resolvePlanFeatures({
      unlimitedActive: true,
      activePlanSlug: 'illimite',
      creditsBalance: 0,
    })

    expect(features.unlimitedUnlocks).toBe(true)
    expect(features.historique).toBe(true)
    expect(features.importScan).toBe(true)
    expect(features.businessOrg).toBe(false)
    expect(features.multiCollaborators).toBe(false)
  })

  it('Business hérite de tout Illimité plus ses extras', () => {
    const illimite = resolvePlanFeatures({
      unlimitedActive: true,
      activePlanSlug: 'illimite',
      creditsBalance: 0,
    })
    const business = resolvePlanFeatures({
      unlimitedActive: true,
      activePlanSlug: 'business',
      creditsBalance: 0,
    })

    expect(business.unlimitedUnlocks).toBe(true)
    expect(business.historique).toBe(true)
    expect(business.importScan).toBe(true)
    expect(business.businessOrg).toBe(true)
    expect(business.multiCollaborators).toBe(true)

    expect(business.unlimitedUnlocks).toBe(illimite.unlimitedUnlocks)
    expect(business.historique).toBe(illimite.historique)
    expect(business.importScan).toBe(illimite.importScan)
  })

  it('les packs crédits ne donnent pas historique ni scan', () => {
    const features = resolvePlanFeatures({
      unlimitedActive: false,
      activePlanSlug: null,
      creditsBalance: 10,
    })

    expect(features.canUnlockWithCredits).toBe(true)
    expect(features.historique).toBe(false)
    expect(features.importScan).toBe(false)
  })
})

describe('mergeSubscriptionPlanSlug', () => {
  it('conserve Business lors d un upgrade depuis Illimité', () => {
    expect(mergeSubscriptionPlanSlug('illimite', 'business')).toBe('business')
  })

  it('ne rétrograde pas Business vers Illimité', () => {
    expect(mergeSubscriptionPlanSlug('business', 'illimite')).toBe('business')
  })
})
