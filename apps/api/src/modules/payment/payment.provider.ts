export interface InitiatePaymentParams {
  itemName: string
  amountXof: number
  refCommand: string
  commandName: string
  customField?: Record<string, unknown>
  /** URL IPN (HTTPS) ; vide si non configurée (pas de notification automatique). */
  ipnUrl: string
  successUrl: string
  cancelUrl: string
}

export interface InitiatePaymentResult {
  token: string
  redirectUrl: string
}

/** Notification IPN normalisée après vérification. */
export interface VerifiedIpn {
  refCommand: string
  amountXof: number
  paymentMethod?: string
  token?: string
}

/**
 * Abstraction d'un fournisseur de paiement.
 * Permet de brancher PayTech (V1), puis Stripe / Wave / Orange Money / etc.
 * sans toucher au code métier (payment.service).
 */
export interface PaymentProvider {
  readonly name: string
  initiatePayment(params: InitiatePaymentParams): Promise<InitiatePaymentResult>
  /**
   * Vérifie l'authenticité d'une notification entrante et la normalise.
   * Renvoie null si la notification n'est pas authentique.
   */
  verifyIpn(payload: Record<string, unknown>): VerifiedIpn | null
}
