import type { Entitlements } from '~/services/payment.service'

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

  return { fetchEntitlements }
}
