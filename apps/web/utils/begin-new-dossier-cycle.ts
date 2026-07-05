import {
  isGuestDossierComplete,
  loadGuestDossierState,
  resetGuestDossierCycleFlags,
} from '~/utils/guest-dossier-state'

/** Prépare un nouveau dossier payant après un dossier complet (pack multi-crédits). */
export async function beginNewPaidDossierCycleIfNeeded() {
  if (!import.meta.client) return null

  const state = loadGuestDossierState()
  if (!state?.paidAt || !isGuestDossierComplete(state)) return null

  const paymentService = usePaymentService()
  await useGuestSession().ensureSession().catch(() => {})
  const entitlements = await paymentService.resetDossierCycle()
  resetGuestDossierCycleFlags()
  return entitlements
}
