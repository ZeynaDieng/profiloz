import { hasDossierDownloadAccess } from '~/utils/dossier-access'
import { alignGuestSessionFromStoredDrafts } from '~/utils/guest-draft-sync'
import { isPaidGuestDossierActive, restorePaidGuestSession } from '~/utils/guest-dossier-state'

/** Restaure la session invité payée et évite de la remplacer par un autre brouillon. */
export async function syncGuestSessionForEditor() {
  const { applyGuestSessionId, ensureSession } = useGuestSession()
  const { fetchEntitlements } = usePaymentEntitlements()

  const paidSessionId = restorePaidGuestSession()
  if (paidSessionId) {
    applyGuestSessionId(paidSessionId)
  }

  await ensureSession().catch(() => {})

  try {
    const entitlements = await fetchEntitlements()
    if (entitlements && hasDossierDownloadAccess(entitlements)) {
      return { paid: true as const, entitlements }
    }
  } catch {
    // continue
  }

  if (!paidSessionId && !isPaidGuestDossierActive()) {
    alignGuestSessionFromStoredDrafts()
    await ensureSession().catch(() => {})
  }

  return { paid: false as const, entitlements: null }
}
