import type { Entitlements } from '~/services/payment.service'
import { hasDossierDownloadAccess } from '~/utils/dossier-access'

export function usePaymentEntitlements() {
  const paymentService = usePaymentService()
  const { ensureSession, resetGuestSessionSync } = useGuestSession()

  async function fetchEntitlements(): Promise<Entitlements | null> {
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

    const entitlements = await fetchEntitlements()
    if (hasDossierDownloadAccess(entitlements)) {
      return true
    }

    await navigateTo({
      path: '/tarifs',
      query: { reason: 'unlock', returnTo },
    })
    return false
  }

  return { fetchEntitlements, ensureDownloadAccess }
}
