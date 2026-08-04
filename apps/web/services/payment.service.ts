import type { PlanFeatures, PlanSlug, SubscriptionPlanSlug } from '@profiloz/shared'

export interface PlanDto {
  slug: PlanSlug
  name: string
  priceXof: number
  kind: 'credits' | 'subscription'
  credits: number | null
  durationDays?: number
  description: string
  features: string[]
  popular?: boolean
}

export interface Entitlements {
  creditsBalance: number
  unlimitedUntil: string | null
  unlimitedActive: boolean
  activePlanSlug: SubscriptionPlanSlug | null
  features: PlanFeatures
  canDownloadSnapshot?: boolean
  downloadedDocIds?: string[]
  paidDraftSnapshot?: any
}

export interface PurchasedPlanSummary {
  slug: PlanSlug
  name: string
  kind: 'credits' | 'subscription'
  credits: number
  amountXof: number
  durationDays: number | null
  description: string
  features: string[]
}

export interface ConfirmReturnResult {
  status: string
  entitlements?: Entitlements
  purchasedPlan?: PurchasedPlanSummary
  guestSessionClientId?: string
}

function isResumeSnapshotValid(snap: any): boolean {
  if (!snap || typeof snap !== 'object') return false
  const p = snap.personalInfo || {}
  const hasName = Boolean((p.firstName || p.lastName || p.fullName)?.trim())
  const hasExp = Boolean(snap.experiences?.length)
  const hasSkills = Boolean(snap.skills?.length)
  const hasSummary = Boolean(snap.summary?.trim())
  return hasName || hasExp || hasSkills || hasSummary
}

function isLetterSnapshotValid(draft: any): boolean {
  if (!draft || typeof draft !== 'object') return false
  return Boolean(draft.content?.trim() || draft.senderName?.trim() || draft.recipientName?.trim())
}

export function usePaymentService() {
  const { get, post } = useApiClient()

  async function listPlans() {
    return get<{ data: PlanDto[] }>('/plans')
  }

  async function getEntitlements() {
    return get<Entitlements>('/payments/me')
  }

  /** Démarre un paiement et renvoie l'URL de redirection PayTech. */
  async function checkout(planSlug: PlanSlug, returnTo?: string) {
    let draftSnapshot: unknown = undefined
    try {
      if (returnTo?.includes('lettre')) {
        const coverLetterStore = useCoverLetterStore()
        coverLetterStore.rehydrateFromStorage()
        const snap = coverLetterStore.current ? coverLetterStore.toSnapshot() : null
        draftSnapshot = isLetterSnapshotValid(snap) ? snap : findCoverLetterDraftInStorage()
      } else {
        const resumeStore = useResumeStore()
        resumeStore.rehydrateFromStorage()
        const current = resumeStore.current
        const snap = current ? { ...current, templateConfig: { ...current.templateConfig } } : null
        if (isResumeSnapshotValid(snap)) {
          draftSnapshot = snap
        } else {
          const backup = loadPaymentDraftBackup()
          if (backup?.kind === 'resume' && isResumeSnapshotValid(backup.snapshot)) {
            draftSnapshot = backup.snapshot
          } else {
            draftSnapshot = findResumeSnapshotInStorage()
          }
        }
      }
    } catch {
      // ignore Pinia store resolution if unavailable
    }

    return post<{ ref: string; token?: string; redirectUrl: string }>('/payments/checkout', {
      planSlug,
      returnTo,
      draftSnapshot,
    })
  }

  /** Confirme le paiement au retour PayTech (fallback si IPN absent ou lent). */
  async function confirmReturn(ref: string) {
    return post<ConfirmReturnResult>('/payments/confirm-return', { ref })
  }

  /** Démarre un nouveau cycle dossier (pack multi-crédits) après un dossier complet. */
  async function resetDossierCycle() {
    return post<Entitlements>('/payments/reset-dossier-cycle')
  }

  return { listPlans, getEntitlements, checkout, confirmReturn, resetDossierCycle }
}
