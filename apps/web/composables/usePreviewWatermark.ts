import { hasDossierDownloadAccess } from '~/utils/dossier-access'

/**
 * Filigrane affiché sur les aperçus tant que l'utilisateur n'a pas d'accès payé au téléchargement.
 * Affiché par défaut (y compris si la vérification échoue), retiré dès qu'un accès est confirmé.
 */
export function usePreviewWatermark() {
  const showWatermark = ref(true)
  const { fetchEntitlements } = usePaymentEntitlements()

  onMounted(async () => {
    try {
      const entitlements = await fetchEntitlements()
      if (hasDossierDownloadAccess(entitlements)) showWatermark.value = false
    } catch {
      // vérification impossible : on garde le filigrane
    }
  })

  return { showWatermark }
}
