import type { Entitlements } from '~/services/payment.service'
import { loadGuestDossierState } from '~/utils/guest-dossier-state'

/** Droit de télécharger CV ou lettre (1 crédit = dossier complet, retéléchargements inclus). */
export function hasDossierDownloadAccess(entitlements?: Entitlements | null) {
  const dossier = loadGuestDossierState()
  const guestDuoInProgress =
    Boolean(dossier?.paidAt && (dossier.cvDownloaded || dossier.letterDownloaded))

  if (!entitlements) return guestDuoInProgress

  return entitlements.unlimitedActive
    || entitlements.creditsBalance > 0
    || entitlements.canDownloadSnapshot === true
    || guestDuoInProgress
}
