import { hasDossierDownloadAccess } from '~/utils/dossier-access'
import { alignGuestSessionFromStoredDrafts } from '~/utils/guest-draft-sync'
import { restorePaidGuestSession } from '~/utils/guest-dossier-state'

/** Restaure la session invité payée et évite de la remplacer par un autre brouillon. */
export async function syncGuestSessionForEditor() {
  const { applyGuestSessionId, ensureSession } = useGuestSession()
  const paymentService = usePaymentService()

  const paidSessionId = restorePaidGuestSession()
  if (paidSessionId) {
    applyGuestSessionId(paidSessionId)
  }

  await ensureSession().catch(() => {})

  try {
    const entitlements = await paymentService.getEntitlements()
    if (hasDossierDownloadAccess(entitlements)) {
      return { paid: true as const, entitlements }
    }
  } catch {
    // continue
  }

  if (!paidSessionId) {
    alignGuestSessionFromStoredDrafts()
    await ensureSession().catch(() => {})
  }

  return { paid: false as const, entitlements: null }
}
