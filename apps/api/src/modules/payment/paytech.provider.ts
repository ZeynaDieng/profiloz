import { normalizeAbsoluteUrl } from '@/lib/pdf/app-url'
import { createHash } from 'crypto'
import { PAYMENT_CURRENCY } from '@profiloz/shared'
import type {
  InitiatePaymentParams,
  InitiatePaymentResult,
  PaymentProvider,
  VerifiedIpn,
} from './payment.provider'

const PAYTECH_REQUEST_URL = 'https://paytech.sn/api/payment/request-payment'

interface PayTechConfig {
  apiKey: string
  apiSecret: string
  env: 'test' | 'prod'
}

function readConfig(): PayTechConfig {
  const apiKey = process.env.PAYTECH_API_KEY
  const apiSecret = process.env.PAYTECH_API_SECRET
  if (!apiKey || !apiSecret) {
    throw new Error('PayTech non configuré : définissez PAYTECH_API_KEY et PAYTECH_API_SECRET.')
  }
  const env = process.env.PAYTECH_ENV === 'prod' ? 'prod' : 'test'
  return { apiKey, apiSecret, env }
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

interface PayTechRequestResponse {
  success?: number
  token?: string
  redirect_url?: string
  redirectUrl?: string
  message?: string
}

function assertPayTechRedirectUrl(url: string, label: string) {
  const normalized = normalizeAbsoluteUrl(url)
  if (!normalized) {
    throw new Error(`${label} doit être une URL http(s) valide (reçu : « ${url || '(vide)'} »).`)
  }
}

export class PayTechProvider implements PaymentProvider {
  readonly name = 'paytech'

  async initiatePayment(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    const config = readConfig()

    assertPayTechRedirectUrl(params.successUrl, 'successRedirectUrl')
    assertPayTechRedirectUrl(params.cancelUrl, 'cancelUrl')
    if (params.ipnUrl) {
      const ipn = normalizeAbsoluteUrl(params.ipnUrl)
      if (!ipn || !ipn.startsWith('https://')) {
        throw new Error('ipn_url doit être une URL HTTPS valide.')
      }
    }

    const body: Record<string, unknown> = {
      item_name: params.itemName,
      item_price: params.amountXof,
      currency: PAYMENT_CURRENCY,
      ref_command: params.refCommand,
      command_name: params.commandName,
      env: config.env,
      success_url: normalizeAbsoluteUrl(params.successUrl),
      cancel_url: normalizeAbsoluteUrl(params.cancelUrl),
      custom_field: JSON.stringify(params.customField ?? {}),
    }
    // ipn_url doit être en HTTPS et joignable par PayTech (non envoyé en local sans tunnel).
    if (params.ipnUrl) body.ipn_url = params.ipnUrl

    const response = await fetch(PAYTECH_REQUEST_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        API_KEY: config.apiKey,
        API_SECRET: config.apiSecret,
      },
      body: JSON.stringify(body),
    })

    const data = (await response.json().catch(() => ({}))) as PayTechRequestResponse
    const redirectUrl = data.redirect_url ?? data.redirectUrl
    if (!response.ok || data.success !== 1 || !data.token || !redirectUrl) {
      throw new Error(data.message || 'PayTech a refusé la demande de paiement.')
    }

    return { token: data.token, redirectUrl }
  }

  verifyIpn(payload: Record<string, unknown>): VerifiedIpn | null {
    const config = readConfig()

    const apiKeyHash = String(payload.api_key_sha256 ?? '')
    const apiSecretHash = String(payload.api_secret_sha256 ?? '')
    const refCommand = String(payload.ref_command ?? '')

    if (!apiKeyHash || !apiSecretHash || !refCommand) return null
    if (sha256(config.apiKey) !== apiKeyHash) return null
    if (sha256(config.apiSecret) !== apiSecretHash) return null

    const amountRaw = payload.item_price
    const amountXof = typeof amountRaw === 'number' ? amountRaw : Number.parseInt(String(amountRaw ?? ''), 10)

    return {
      refCommand,
      amountXof: Number.isFinite(amountXof) ? amountXof : 0,
      paymentMethod: payload.payment_method ? String(payload.payment_method) : undefined,
      token: payload.token ? String(payload.token) : undefined,
    }
  }
}

export const paytechProvider = new PayTechProvider()
