import type { Entitlements } from '~/services/payment.service'
import { hasDossierDownloadAccess } from '~/utils/dossier-access'
import { loadGuestDossierState } from '~/utils/guest-dossier-state'

export function usePaymentEntitlements() {
  const paymentService = usePaymentService()
  const { ensureSession, resetGuestSessionSync } = useGuestSession()

  async function fetchEntitlements(): Promise<Entitlements | null> {
    if (import.meta.client) {
      const authStore = useAuthStore()
      authStore.loadFromStorage()
      authStore.syncSession()
    }

    await ensureSession()

    try {
      return await paymentService.getEntitlements()
    } catch (err) {
      const status = (err as { status?: number }).status
      if (status !== 401) {
        return null
      }

      resetGuestSessionSync()
      await ensureSession()

      try {
        return await paymentService.getEntitlements()
      } catch {
        return null
      }
    }
  }

  /** Vérifie crédits / abonnement / dossier déjà débloqué avant un téléchargement. */
  async function ensureDownloadAccess(returnTo: string): Promise<boolean> {
    restorePaidGuestSession()
    await ensureSession().catch(() => {})
    await syncGuestSessionForEditor()

    let entitlements = await fetchEntitlements()
    if (hasDossierDownloadAccess(entitlements)) {
      return true
    }

    // Invité : 1er doc déjà téléchargé → 2e inclus ; re-pin session payée et re-vérifier.
    const dossier = loadGuestDossierState()
    if (dossier?.paidAt && (dossier.cvDownloaded || dossier.letterDownloaded)) {
      restorePaidGuestSession()
      resetGuestSessionSync()
      await ensureSession().catch(() => {})
      entitlements = await fetchEntitlements()
      if (hasDossierDownloadAccess(entitlements)) {
        return true
      }
    }

    await navigateTo({
      path: '/tarifs',
      query: { reason: 'unlock', returnTo },
    })
    return false
  }

  return { fetchEntitlements, ensureDownloadAccess }
}
