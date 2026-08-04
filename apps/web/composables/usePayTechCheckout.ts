import { ref } from 'vue'
import { parseApiAuthError } from '~/utils/api-error'
import { savePaymentDraftBackup, savePaymentGuestSession } from '~/utils/payment-draft-backup'
import { savePaymentPlanSlug } from '~/utils/payment-purchase'
import { savePaymentRef, savePaymentReturnTo } from '~/utils/payment-return'
import { withAutoDownloadQuery } from '~/utils/payment-auto-download'
import { MSG } from '@profiloz/shared'

declare global {
  interface Window {
    PayTech?: any
  }
}

export function usePayTechCheckout() {
  const paymentService = usePaymentService()
  const { ensureSession } = useGuestSession()
  const { fetchEntitlements } = usePaymentEntitlements()
  const postPayment = usePostPaymentDownload()

  const checkingOut = ref<string | null>(null)
  const error = ref<string>('')
  const isModalOpen = ref(false)
  const redirectUrl = ref<string | null>(null)
  const activeRef = ref<string | null>(null)

  let pollInterval: ReturnType<typeof setInterval> | null = null

  function stopPolling() {
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
    }
  }

  function closeModal() {
    isModalOpen.value = false
    checkingOut.value = null
    stopPolling()
  }

  async function handleSuccess(refCommand: string, returnTo?: string) {
    stopPolling()
    isModalOpen.value = false
    checkingOut.value = null

    try {
      await fetchEntitlements()
    } catch {
      // ignore
    }

    if (returnTo) {
      try {
        await postPayment.downloadFromReturnPath(returnTo, refCommand)
      } catch {
        await navigateTo(withAutoDownloadQuery(returnTo), { replace: true })
      }
    }
  }

  function startPolling(refCommand: string, returnTo?: string) {
    stopPolling()
    let attempts = 0
    pollInterval = setInterval(async () => {
      attempts++
      if (attempts > 120) { // 5 minutes max
        stopPolling()
        return
      }

      try {
        const result = await paymentService.confirmReturn(refCommand)
        if (result.status === 'paid' || result.status === 'already_paid') {
          await handleSuccess(refCommand, returnTo)
        }
      } catch {
        // ignore interim errors while user is typing in PayTech window
      }
    }, 2500)
  }

  async function startCheckout(planSlug: any, returnTo?: string) {
    if (checkingOut.value) return
    error.value = ''
    checkingOut.value = planSlug

    try {
      await ensureSession()
      if (returnTo) savePaymentReturnTo(returnTo)
      savePaymentPlanSlug(planSlug)
      savePaymentDraftBackup(returnTo)
      savePaymentGuestSession(
        import.meta.client ? localStorage.getItem('profiloz:guest-session') : null,
      )

      const response = await paymentService.checkout(planSlug, returnTo)
      const { ref: refCommand, token, redirectUrl: url } = response
      savePaymentRef(refCommand)
      activeRef.value = refCommand
      redirectUrl.value = url

      if (import.meta.client) {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768
        if (isMobile) {
          // Sur mobile, redirection directe vers PayTech (pas de pop-up)
          window.location.href = url
          return
        }
      }

      // 1. Essayer d'utiliser le SDK PayTech officiel sur desktop s'il est chargé
      if (import.meta.client && window.PayTech && token) {
        try {
          // Garantir qu'aucune modale de fallback n'est ouverte simultanément
          isModalOpen.value = false

          const paytech = new window.PayTech({ token })
          paytech.withOption({
            presentationMode: window.PayTech.OPEN_IN_POPUP || 'OPEN_IN_POPUP',
            didReceiveSuccessResponse: () => {
              handleSuccess(refCommand, returnTo)
            },
            didDismiss: () => {
              checkingOut.value = null
              stopPolling()
            },
            didReceiveError: (err: any) => {
              console.warn('[PayTech SDK error]', err)
              // En cas d'erreur du SDK, basculer proprement vers la modale iFrame
              isModalOpen.value = true
            },
          }).send()

          // Surveillance en arrière-plan (au cas où le webhook/callback tarde)
          startPolling(refCommand, returnTo)
          return
        } catch (e) {
          console.warn('[PayTech SDK init error, fallback to modal]', e)
        }
      }

      // 2. Fallback sans SDK : ouverture propre d'une seule fenêtre pop-up ou modale
      if (import.meta.client) {
        const popup = window.open(
          url,
          'PayTechCheckout',
          'width=520,height=700,top=100,left=100,scrollbars=yes,status=yes',
        )

        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          // Si les pop-ups sont bloqués par le navigateur, afficher la modale iFrame unique
          isModalOpen.value = true
        } else {
          isModalOpen.value = false
        }

        startPolling(refCommand, returnTo)
      } else {
        window.location.href = url
      }
    } catch (err) {
      error.value = parseApiAuthError(err, MSG.payment.error)
      checkingOut.value = null
    }
  }

  return {
    startCheckout,
    checkingOut,
    error,
    isModalOpen,
    redirectUrl,
    activeRef,
    closeModal,
  }
}
