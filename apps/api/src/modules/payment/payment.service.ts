import { randomUUID } from 'crypto'
import type { Prisma } from '@prisma/client'
import {
  getPlan,
  isSubscriptionPlanSlug,
  mergeSubscriptionPlanSlug,
  resolveEntitlements,
  type PlanFeatures,
  type ResolvedEntitlements,
  type SubscriptionPlanSlug,
} from '@profiloz/shared'
import { AppError } from '@/lib/errors'
import { buildPublicAppPathForRequest } from '@/lib/pdf/app-url'
import { prisma } from '@/lib/prisma'
import { paytechProvider } from './paytech.provider'
import type { PaymentProvider } from './payment.provider'
import { organizationRepository } from '@/modules/organization/organization.repository'
import { organizationService } from '@/modules/organization/organization.service'
import { getResolvedPlan } from '@/modules/plan/plan-catalog.service'
import { sendEmailTemplate } from '@/lib/email/mail.service'

/** Propriétaire des droits : un utilisateur connecté OU une session invitée. */
export interface EntitlementOwner {
  userId?: string
  guestSessionDbId?: string
}

function requireOwner(owner: EntitlementOwner): EntitlementOwner {
  if (!owner.userId && !owner.guestSessionDbId) {
    throw new AppError(401, 'Unauthorized', 'Authentification ou session invité requise')
  }
  return owner
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function isUnlimitedActive(unlimitedUntil: Date | null | undefined): boolean {
  return Boolean(unlimitedUntil && unlimitedUntil.getTime() > Date.now())
}

type PaidPaymentRecord = {
  id: string
  userId: string | null
  guestSessionId: string | null
  planSlug: string
  credits: number
  providerToken: string | null
}

function assertPaymentOwner(
  payment: { userId: string | null; guestSessionId: string | null },
  owner: EntitlementOwner,
) {
  if (owner.userId) {
    if (payment.userId !== owner.userId) {
      throw new AppError(403, 'Forbidden', 'Cette commande ne correspond pas à votre compte.')
    }
    return
  }
  if (payment.guestSessionId !== owner.guestSessionDbId) {
    throw new AppError(403, 'Forbidden', 'Cette commande ne correspond pas à votre session.')
  }
}

type GuestSessionMeta = {
  snapshotUnlockedAt?: string
  downloadedDocIds?: string[]
}

function readGuestSessionMeta(data: unknown): GuestSessionMeta {
  if (!data || typeof data !== 'object') return {}
  const raw = data as any
  return {
    snapshotUnlockedAt: typeof raw.snapshotUnlockedAt === 'string' ? raw.snapshotUnlockedAt : undefined,
    downloadedDocIds: Array.isArray(raw.downloadedDocIds) ? raw.downloadedDocIds : undefined,
  }
}

/** Un dossier payé = 2 documents au choix (CV + lettre, 2 CV ou 2 lettres). */
export const DOSSIER_DOCUMENT_LIMIT = 2

/**
 * Clé d'un document du dossier : `cv:<id>` / `letter:<id>` (anciennes sessions : `cv` / `letter` sans id).
 * Un document du dossier reste modifiable et retéléchargeable gratuitement.
 */
export function snapshotDocKey(type: 'cv' | 'letter', id?: unknown): string {
  return typeof id === 'string' && id.trim() ? `${type}:${id.trim()}` : type
}

function docKeyType(key: string): string {
  return key.split(':')[0] ?? key
}

type DossierSlotDecision = 'known' | 'free-slot' | 'adopt-legacy' | 'slot-taken'

/** Place du document dans le dossier courant : déjà dedans, place libre (moins de 2 documents), ou dossier complet. */
export function decideDossierSlot(downloadedIds: string[], docId: string): DossierSlotDecision {
  if (downloadedIds.includes(docId)) return 'known'
  // Ancien format sans id (`cv` / `letter`) : le premier document identifié de ce type le remplace
  if (docId !== docKeyType(docId) && downloadedIds.includes(docKeyType(docId))) return 'adopt-legacy'
  return downloadedIds.length < DOSSIER_DOCUMENT_LIMIT ? 'free-slot' : 'slot-taken'
}

/**
 * Compte connecté : réserve la place du document dans le dossier en cours (2 documents au choix par crédit).
 * Document déjà dans le dossier ou place libre → gratuit ; sinon consomme 1 crédit et ouvre un nouveau dossier.
 */
async function claimUserDossierSlot(
  tx: Prisma.TransactionClient,
  userId: string,
  docKey: string,
): Promise<'free' | 'consumed'> {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { dossierDocIds: true, dossierUnlockedAt: true },
  })
  // Dossier payé avant le suivi par document : on le considère entamé (1 document utilisé)
  const docIds = user?.dossierDocIds.length ? user.dossierDocIds : user?.dossierUnlockedAt ? ['legacy'] : []
  const decision = decideDossierSlot(docIds, docKey)

  if (decision === 'known') return 'free'
  if (docIds.length > 0 && (decision === 'free-slot' || decision === 'adopt-legacy')) {
    await tx.user.update({
      where: { id: userId },
      data: { dossierDocIds: [...docIds, docKey] },
    })
    return 'free'
  }

  const decremented = await tx.user.updateMany({
    where: { id: userId, creditsBalance: { gt: 0 } },
    data: { creditsBalance: { decrement: 1 }, dossierUnlockedAt: new Date(), dossierDocIds: [docKey] },
  })
  if (decremented.count === 0) {
    throw new AppError(
      402,
      'Payment Required',
      docIds.length >= DOSSIER_DOCUMENT_LIMIT
        ? 'Votre dossier payé contient déjà ses 2 documents. Choisissez une offre pour télécharger ce nouveau document.'
        : 'Aucun crédit disponible. Choisissez une offre pour télécharger votre dossier.',
    )
  }
  return 'consumed'
}

function readPaidDocuments(raw: unknown, downloadedDocIds: string[] = []) {
  if (!raw || typeof raw !== 'object') return []
  return Object.entries(raw as Record<string, unknown>)
    .filter(([key]) => downloadedDocIds.includes(key))
    .map(([key, snapshot]) => ({ key, kind: (key.startsWith('letter') ? 'letter' : 'cv') as 'cv' | 'letter', snapshot }))
}

async function isGuestSnapshotDossierUnlocked(guestSessionDbId: string, docId?: string): Promise<boolean> {
  const guest = await prisma.guestSession.findUnique({
    where: { id: guestSessionDbId },
    select: { dossierUnlockedAt: true, data: true },
  })
  if (!guest) return false

  const meta = readGuestSessionMeta(guest.data)
  const unlocked = Boolean(guest.dossierUnlockedAt || meta.snapshotUnlockedAt)

  // Sans docId : vérification globale d'accès au dossier
  if (!docId) return unlocked

  const decision = decideDossierSlot(meta.downloadedDocIds || [], docId)
  if (decision === 'known') return true
  return unlocked && decision !== 'slot-taken'
}

async function isUserSnapshotDossierUnlocked(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { dossierUnlockedAt: true },
  })
  return Boolean(user?.dossierUnlockedAt)
}

function asSubscriptionPlanSlug(value: string | null | undefined): SubscriptionPlanSlug | null {
  return value && isSubscriptionPlanSlug(value) ? value : null
}

type EntitlementsWithSnapshot = ResolvedEntitlements & {
  canDownloadSnapshot: boolean
  downloadedDocIds?: string[]
  paidDraftSnapshot?: unknown
  /** Dernières versions du CV / de la lettre du dossier payé (reprise sur un autre appareil). */
  paidResumeSnapshot?: unknown
  paidLetterSnapshot?: unknown
  /** Documents du dossier payé en cours, clé `cv:<id>` / `letter:<id>`. */
  paidDocuments?: Array<{ key: string; kind: 'cv' | 'letter'; snapshot: unknown }>
}

function mergeEntitlementResults(
  primary: EntitlementsWithSnapshot,
  secondary: EntitlementsWithSnapshot,
): EntitlementsWithSnapshot {
  const unlimitedUntil = [primary.unlimitedUntil, secondary.unlimitedUntil]
    .filter((date): date is Date => Boolean(date))
    .sort((a, b) => b.getTime() - a.getTime())[0] ?? null
  let activePlanSlug = primary.activePlanSlug
  if (secondary.activePlanSlug) {
    activePlanSlug = mergeSubscriptionPlanSlug(activePlanSlug, secondary.activePlanSlug)
  }
  const merged = resolveEntitlements({
    creditsBalance: primary.creditsBalance + secondary.creditsBalance,
    unlimitedUntil,
    subscriptionPlanSlug: isUnlimitedActive(unlimitedUntil) ? activePlanSlug : null,
  })

  return {
    ...merged,
    canDownloadSnapshot: primary.canDownloadSnapshot || secondary.canDownloadSnapshot,
    downloadedDocIds: primary.downloadedDocIds || secondary.downloadedDocIds,
    paidDraftSnapshot: primary.paidDraftSnapshot || secondary.paidDraftSnapshot,
    paidResumeSnapshot: primary.paidResumeSnapshot || secondary.paidResumeSnapshot,
    paidLetterSnapshot: primary.paidLetterSnapshot || secondary.paidLetterSnapshot,
    paidDocuments: primary.paidDocuments || secondary.paidDocuments,
  }
}

function serializeEntitlementsForClient(result: EntitlementsWithSnapshot) {
  return {
    creditsBalance: result.creditsBalance,
    unlimitedUntil: result.unlimitedUntil ? result.unlimitedUntil.toISOString() : null,
    unlimitedActive: result.unlimitedActive,
    activePlanSlug: result.activePlanSlug,
    features: result.features,
    canDownloadSnapshot: result.canDownloadSnapshot,
    downloadedDocIds: result.downloadedDocIds,
    paidDraftSnapshot: result.paidDraftSnapshot,
    paidResumeSnapshot: result.paidResumeSnapshot,
    paidLetterSnapshot: result.paidLetterSnapshot,
    paidDocuments: result.paidDocuments,
  }
}

export class PaymentService {
  constructor(private readonly provider: PaymentProvider = paytechProvider) {}

  private async buildPurchasedPlanSummary(payment: {
    planSlug: string
    credits: number
    amountXof: number
  }) {
    const plan = await getResolvedPlan(payment.planSlug)
    return {
      slug: plan?.slug ?? payment.planSlug,
      name: plan?.name ?? payment.planSlug,
      kind: (plan?.kind ?? 'credits') as 'credits' | 'subscription',
      credits: payment.credits,
      amountXof: payment.amountXof,
      durationDays: plan?.durationDays ?? null,
      description: plan?.description ?? '',
      features: plan?.features ?? [],
    }
  }

  private async buildConfirmReturnResponse(
    status: 'paid' | 'already_paid' | 'pending',
    entitlements: EntitlementsWithSnapshot,
    payment: { planSlug: string; credits: number; amountXof: number },
    guestSessionClientId?: string,
  ) {
    return {
      status,
      entitlements: serializeEntitlementsForClient(entitlements),
      purchasedPlan: await this.buildPurchasedPlanSummary(payment),
      ...(guestSessionClientId ? { guestSessionClientId } : {}),
    }
  }

  private async creditPaidPayment(
    payment: PaidPaymentRecord,
    meta: { paymentMethod?: string; providerToken?: string | null },
  ) {
    const plan = getPlan(payment.planSlug)
    const isSubscription = plan?.kind === 'subscription'
    let businessUserId: string | null = null

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          paymentMethod: meta.paymentMethod,
          providerToken: meta.providerToken ?? payment.providerToken,
        },
      })

      if (payment.userId) {
        if (isSubscription) {
          const user = await tx.user.findUnique({
            where: { id: payment.userId },
            select: { unlimitedUntil: true, subscriptionPlanSlug: true },
          })
          const start = isUnlimitedActive(user?.unlimitedUntil) ? user!.unlimitedUntil! : new Date()
          const incomingSlug = asSubscriptionPlanSlug(payment.planSlug)
          if (!incomingSlug) {
            throw new AppError(400, 'Bad Request', 'Offre abonnement invalide')
          }
          const mergedSlug = mergeSubscriptionPlanSlug(
            asSubscriptionPlanSlug(user?.subscriptionPlanSlug),
            incomingSlug,
          )
          await tx.user.update({
            where: { id: payment.userId },
            data: {
              unlimitedUntil: addDays(start, plan!.durationDays ?? 30),
              subscriptionPlanSlug: mergedSlug,
            },
          })
          if (incomingSlug === 'business') {
            businessUserId = payment.userId
          }
        } else {
          await tx.user.update({
            where: { id: payment.userId },
            data: { creditsBalance: { increment: payment.credits } },
          })
        }
      } else if (payment.guestSessionId) {
        if (isSubscription) {
          const guest = await tx.guestSession.findUnique({
            where: { id: payment.guestSessionId },
            select: { unlimitedUntil: true, subscriptionPlanSlug: true },
          })
          const start = isUnlimitedActive(guest?.unlimitedUntil) ? guest!.unlimitedUntil! : new Date()
          const incomingSlug = asSubscriptionPlanSlug(payment.planSlug)
          if (!incomingSlug) {
            throw new AppError(400, 'Bad Request', 'Offre abonnement invalide')
          }
          const mergedSlug = mergeSubscriptionPlanSlug(
            asSubscriptionPlanSlug(guest?.subscriptionPlanSlug),
            incomingSlug,
          )
          await tx.guestSession.update({
            where: { id: payment.guestSessionId },
            data: {
              unlimitedUntil: addDays(start, plan!.durationDays ?? 30),
              subscriptionPlanSlug: mergedSlug,
            },
          })
        } else {
          await tx.guestSession.update({
            where: { id: payment.guestSessionId },
            data: { creditsBalance: { increment: payment.credits } },
          })
        }
      }
    })

    if (businessUserId) {
      await organizationService.ensureBusinessOrganization(
        businessUserId,
        plan!.durationDays ?? 30,
      )
    }

    if (payment.userId) {
      const [user, paid] = await Promise.all([
        prisma.user.findUnique({
          where: { id: payment.userId },
          select: { email: true, firstName: true },
        }),
        prisma.payment.findUnique({
          where: { id: payment.id },
          select: { amountXof: true },
        }),
      ])
      const resolvedPlan = (await getResolvedPlan(payment.planSlug)) ?? plan
      if (user?.email && resolvedPlan && paid) {
        void sendEmailTemplate('payment_receipt', user.email, {
          email: user.email,
          firstName: user.firstName ?? user.email.split('@')[0] ?? 'Client',
          amount: `${paid.amountXof.toLocaleString('fr-FR')} FCFA`,
          planName: resolvedPlan.name,
        }).catch((error) => console.warn('[mail] payment_receipt failed:', error))
      }
    }
  }

  /**
   * Confirme un paiement au retour PayTech (success_url) quand l'IPN n'a pas encore crédité.
   * Sécurisé : la commande doit appartenir à la session invitée / au compte courant.
   */
  async confirmReturn(owner: EntitlementOwner, refCommand: string) {
    requireOwner(owner)
    const normalized = refCommand.trim()
    if (!normalized.startsWith('pz_')) {
      throw new AppError(400, 'Bad Request', 'Référence de paiement invalide')
    }

    const payment = await prisma.payment.findUnique({
      where: { providerRef: normalized },
      select: {
        id: true,
        userId: true,
        guestSessionId: true,
        planSlug: true,
        credits: true,
        status: true,
        amountXof: true,
        providerToken: true,
        guestSession: { select: { id: true, sessionId: true } },
      },
    })
    if (!payment) throw new AppError(404, 'Not Found', 'Commande introuvable')

    const guestSessionClientId = payment.guestSession?.sessionId
    const paymentGuestOwner: EntitlementOwner | null = payment.guestSessionId
      ? { guestSessionDbId: payment.guestSessionId }
      : null

    let ownerMatches = true
    try {
      assertPaymentOwner(payment, owner)
    } catch {
      ownerMatches = false
    }

    const planPayment = {
      planSlug: payment.planSlug,
      credits: payment.credits,
      amountXof: payment.amountXof,
    }

    // Compte connecté : la commande doit correspondre au compte.
    if (payment.userId) {
      if (!ownerMatches) {
        throw new AppError(403, 'Forbidden', 'Cette commande ne correspond pas à votre compte.')
      }
      if (payment.status === 'PAID') {
        return this.buildConfirmReturnResponse(
          'already_paid',
          await this.getEntitlements(owner),
          planPayment,
        )
      }
      if (payment.status === 'PENDING') {
        return this.buildConfirmReturnResponse(
          'pending',
          await this.getEntitlements(owner),
          planPayment,
        )
      }
      throw new AppError(400, 'Bad Request', 'Cette commande ne peut pas être confirmée')
    }

    // Invité : la ref PayTech suffit — créditer la session liée au paiement même si le navigateur a basculé.
    if (!paymentGuestOwner) {
      if (payment.status === 'PAID') {
        return this.buildConfirmReturnResponse(
          'already_paid',
          await this.getEntitlements(owner),
          planPayment,
        )
      }
      if (payment.status === 'PENDING') {
        return this.buildConfirmReturnResponse(
          'pending',
          await this.getEntitlements(owner),
          planPayment,
        )
      }
      throw new AppError(400, 'Bad Request', 'Commande invité invalide')
    }

    if (payment.status === 'PAID') {
      const paymentEntitlements = await this.getEntitlements(paymentGuestOwner)

      // Ne pas écraser une session navigateur déjà créditée par une session paiement orpheline à 0.
      if (
        owner.guestSessionDbId &&
        owner.guestSessionDbId !== payment.guestSessionId &&
        paymentEntitlements.creditsBalance <= 0 &&
        !paymentEntitlements.canDownloadSnapshot
      ) {
        const currentEntitlements = await this.getEntitlements(owner)
        if (
          currentEntitlements.creditsBalance > 0
          || currentEntitlements.canDownloadSnapshot
          || currentEntitlements.unlimitedActive
        ) {
          return this.buildConfirmReturnResponse(
            'already_paid',
            currentEntitlements,
            planPayment,
            guestSessionClientId,
          )
        }
      }

      return this.buildConfirmReturnResponse(
        'already_paid',
        paymentEntitlements,
        planPayment,
        guestSessionClientId,
      )
    }

    if (payment.status === 'PENDING') {
      return this.buildConfirmReturnResponse(
        'pending',
        await this.getEntitlements(paymentGuestOwner),
        planPayment,
        guestSessionClientId,
      )
    }
  }

  /**
   * Vérifie qu'un propriétaire peut télécharger depuis un snapshot (sans consommer le crédit).
   */
  async assertSnapshotDownload(owner: EntitlementOwner) {
    requireOwner(owner)
    const entitlements = await this.getEntitlements(owner)
    if (entitlements.unlimitedActive) return
    if (owner.guestSessionDbId && (await isGuestSnapshotDossierUnlocked(owner.guestSessionDbId))) return
    if (owner.userId && (await isUserSnapshotDossierUnlocked(owner.userId))) return
    if (entitlements.creditsBalance <= 0) {
      throw new AppError(
        402,
        'Payment Required',
        'Aucun crédit disponible. Choisissez une offre pour télécharger votre dossier (CV + lettre).',
      )
    }
  }

  /** @deprecated Utiliser assertSnapshotDownload */
  async assertGuestSnapshotDownload(owner: EntitlementOwner) {
    return this.assertSnapshotDownload(owner)
  }

  /**
   * Débloque le dossier snapshot (1 crédit = CV + lettre, retéléchargements gratuits).
   */
  async consumeSnapshotDownload(owner: EntitlementOwner, docId?: string) {
    requireOwner(owner)
    const entitlements = await this.getEntitlements(owner)
    if (entitlements.unlimitedActive) return { consumed: false }

    // Compte avec document identifié : même règle des 2 documents par dossier
    if (owner.userId && docId && docId.includes(':')) {
      const claimed = await prisma.$transaction((tx) => claimUserDossierSlot(tx, owner.userId!, docId))
      return { consumed: claimed === 'consumed' }
    }
    if (owner.userId && (await isUserSnapshotDossierUnlocked(owner.userId))) {
      return { consumed: false }
    }
    // Avec docId, le document doit être enregistré dans le dossier : la transaction ci-dessous s'en charge
    if (owner.guestSessionDbId && !docId && (await isGuestSnapshotDossierUnlocked(owner.guestSessionDbId))) {
      return { consumed: false }
    }

    if (owner.userId) {
      const userResult = await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: owner.userId },
          select: { dossierUnlockedAt: true, creditsBalance: true },
        })
        if (user?.dossierUnlockedAt) return 'already' as const

        const decremented = await tx.user.updateMany({
          where: { id: owner.userId, creditsBalance: { gt: 0 } },
          data: { creditsBalance: { decrement: 1 }, dossierUnlockedAt: new Date() },
        })
        return decremented.count > 0 ? ('consumed' as const) : ('failed' as const)
      })

      if (userResult === 'already') return { consumed: false }
      if (userResult === 'consumed') return { consumed: true }
      if (!owner.guestSessionDbId) {
        throw new AppError(
          402,
          'Payment Required',
          'Aucun crédit disponible. Choisissez une offre pour télécharger votre dossier (CV + lettre).',
        )
      }
    }

    if (!owner.guestSessionDbId) {
      throw new AppError(
        402,
        'Payment Required',
        'Aucun crédit disponible. Choisissez une offre pour télécharger votre dossier (CV + lettre).',
      )
    }

    return prisma.$transaction(async (tx) => {
      const guest = await tx.guestSession.findUnique({
        where: { id: owner.guestSessionDbId },
        select: { data: true, creditsBalance: true, dossierUnlockedAt: true },
      })
      if (!guest) throw new AppError(404, 'Not Found', 'Session invité introuvable')

      const meta = readGuestSessionMeta(guest.data)
      const downloadedIds = meta.downloadedDocIds || []

      // Préserver le reste de guest.data (ne pas écraser avec uniquement meta).
      const baseData =
        guest.data && typeof guest.data === 'object' && !Array.isArray(guest.data)
          ? (guest.data as Record<string, unknown>)
          : {}

      const unlocked = Boolean(guest.dossierUnlockedAt || meta.snapshotUnlockedAt)
      const decision: DossierSlotDecision = docId ? decideDossierSlot(downloadedIds, docId) : 'known'

      if (decision === 'known' && (unlocked || !docId)) {
        if (!unlocked) {
          // Pas de docId et dossier non débloqué : premier téléchargement, consomme 1 crédit
          const decremented = await tx.guestSession.updateMany({
            where: { id: owner.guestSessionDbId, creditsBalance: { gt: 0 } },
            data: {
              creditsBalance: { decrement: 1 },
              dossierUnlockedAt: new Date(),
              data: { ...baseData, snapshotUnlockedAt: new Date().toISOString() } as Prisma.InputJsonValue,
            },
          })
          if (decremented.count === 0) {
            throw new AppError(
              402,
              'Payment Required',
              'Aucun crédit disponible. Choisissez une offre pour télécharger votre dossier (CV + lettre).',
            )
          }
          return { consumed: true }
        }
        return { consumed: false }
      }

      // Dossier déjà payé et moins de 2 documents : celui-ci rejoint le dossier gratuitement
      if (unlocked && (decision === 'free-slot' || decision === 'adopt-legacy')) {
        const kept = decision === 'adopt-legacy'
          ? downloadedIds.filter((key) => key !== docKeyType(docId!))
          : downloadedIds
        await tx.guestSession.update({
          where: { id: owner.guestSessionDbId },
          data: { data: { ...baseData, downloadedDocIds: [...kept, docId!] } as Prisma.InputJsonValue },
        })
        return { consumed: false }
      }

      // Premier dossier, ou document différent de celui déjà payé (autre CV / autre lettre) : nouveau crédit
      const decremented = await tx.guestSession.updateMany({
        where: { id: owner.guestSessionDbId, creditsBalance: { gt: 0 } },
        data: {
          creditsBalance: { decrement: 1 },
          dossierUnlockedAt: new Date(),
          data: {
            ...baseData,
            snapshotUnlockedAt: new Date().toISOString(),
            downloadedDocIds: docId ? [docId] : [],
            // Nouveau dossier : les versions reprises de l'ancien ne doivent plus être proposées
            paidResumeSnapshot: undefined,
            paidLetterSnapshot: undefined,
            paidSnapshots: undefined,
          } as Prisma.InputJsonValue,
        },
      })
      if (decremented.count === 0) {
        throw new AppError(
          402,
          'Payment Required',
          unlocked
            ? 'Votre dossier payé contient déjà ses 2 documents. Choisissez une offre pour télécharger ce nouveau document.'
            : 'Aucun crédit disponible. Choisissez une offre pour télécharger votre dossier (CV + lettre).',
        )
      }
      return { consumed: true }
    })
  }

  /**
   * Garde côté serveur la dernière version téléchargée du CV / de la lettre d'un invité,
   * pour reprendre le dossier payé sur un autre appareil (lien « Reprendre mon dossier »).
   */
  async savePaidGuestSnapshot(owner: EntitlementOwner, kind: 'resume' | 'letter', snapshot: unknown) {
    if (owner.userId || !owner.guestSessionDbId || !snapshot || typeof snapshot !== 'object') return
    const key = kind === 'resume' ? 'paidResumeSnapshot' : 'paidLetterSnapshot'
    const docKey = snapshotDocKey(kind === 'resume' ? 'cv' : 'letter', (snapshot as { id?: unknown }).id)
    await prisma.$transaction(async (tx) => {
      const guest = await tx.guestSession.findUnique({ where: { id: owner.guestSessionDbId }, select: { data: true } })
      const baseData =
        guest?.data && typeof guest.data === 'object' && !Array.isArray(guest.data)
          ? (guest.data as Record<string, unknown>)
          : {}
      await tx.guestSession.update({
        where: { id: owner.guestSessionDbId },
        data: {
          data: {
            ...baseData,
            [key]: JSON.parse(JSON.stringify(snapshot)),
            // Chaque document du dossier (jusqu'à 2), pour les reprendre tous sur un autre appareil
            paidSnapshots: {
              ...((baseData.paidSnapshots as Record<string, unknown> | undefined) ?? {}),
              [docKey]: JSON.parse(JSON.stringify(snapshot)),
            },
          } as Prisma.InputJsonValue,
        },
      })
    })
  }

  /** @deprecated Utiliser consumeSnapshotDownload */
  async consumeGuestSnapshotDownload(owner: EntitlementOwner) {
    return this.consumeSnapshotDownload(owner)
  }

  /**
   * Réinitialise le cycle dossier en cours (CV + lettre) pour consommer un nouveau crédit.
   * À appeler au démarrage d'un nouveau dossier après un dossier complet (pack multi-crédits).
   */
  async resetDossierCycle(owner: EntitlementOwner) {
    requireOwner(owner)

    if (owner.userId) {
      await prisma.user.updateMany({
        where: { id: owner.userId, dossierUnlockedAt: { not: null } },
        data: { dossierUnlockedAt: null },
      })
    }

    if (owner.guestSessionDbId) {
      const guest = await prisma.guestSession.findUnique({
        where: { id: owner.guestSessionDbId },
        select: { data: true, dossierUnlockedAt: true },
      })
      const meta = readGuestSessionMeta(guest?.data)
      if (meta.snapshotUnlockedAt || guest?.dossierUnlockedAt) {
        const baseData =
          guest?.data && typeof guest.data === 'object' && !Array.isArray(guest.data)
            ? (guest.data as Record<string, unknown>)
            : {}
        const { snapshotUnlockedAt: _removed, ...rest } = baseData
        await prisma.guestSession.update({
          where: { id: owner.guestSessionDbId },
          data: {
            dossierUnlockedAt: null,
            data: rest as Prisma.InputJsonValue,
          },
        })
      }
    }
  }

  /** Vérifie l'accès à une fonctionnalité incluse dans les offres. */
  async assertFeature(owner: EntitlementOwner, feature: keyof PlanFeatures) {
    requireOwner(owner)
    const entitlements = await this.getEntitlements(owner)
    if (entitlements.features[feature]) return

    const messages: Partial<Record<keyof PlanFeatures, string>> = {
      historique: "L'historique de vos documents est inclus dans les offres Illimité et Business.",
      importScan: "L'import & scan depuis votre espace est inclus dans les offres Illimité et Business.",
      unlimitedUnlocks: 'Les dossiers illimités sont inclus dans les offres Illimité et Business.',
      businessOrg: "L'espace organisation est réservé à l'offre Business.",
      multiCollaborators: 'Le multi-collaborateurs est réservé à l\'offre Business.',
    }

    throw new AppError(
      402,
      'Payment Required',
      messages[feature] ?? 'Cette fonctionnalité nécessite une offre supérieure.',
    )
  }

  /** Démarre un paiement : crée la commande PENDING et renvoie l'URL de redirection PayTech. */
  async createCheckout(
    owner: EntitlementOwner,
    planSlug: string,
    returnTo?: string,
    requestOrigin?: string | null,
    guestSessionClientId?: string | null,
    draftSnapshot?: unknown,
  ) {
    requireOwner(owner)
    const plan = await getResolvedPlan(planSlug)
    if (!plan) throw new AppError(400, 'Bad Request', 'Offre inconnue ou inactive')

    const refCommand = `pz_${randomUUID().replace(/-/g, '')}`
    const credits = Number.isFinite(plan.credits) ? plan.credits : 0

function isDraftSnapshotValid(snap: any): boolean {
  if (!snap || typeof snap !== 'object') return false
  const p = snap.personalInfo || {}
  const hasName = Boolean((p.firstName || p.lastName || p.fullName)?.trim())
  const hasExp = Boolean(snap.experiences?.length)
  const hasSkills = Boolean(snap.skills?.length)
  const hasSummary = Boolean(snap.summary?.trim())
  const hasLetter = Boolean(snap.content?.trim() || snap.senderName?.trim())
  return hasName || hasExp || hasSkills || hasSummary || hasLetter
}

    if (owner.guestSessionDbId && isDraftSnapshotValid(draftSnapshot)) {
      try {
        const guest = await prisma.guestSession.findUnique({ where: { id: owner.guestSessionDbId }, select: { data: true } })
        const currentData = (guest?.data && typeof guest.data === 'object') ? (guest.data as Record<string, unknown>) : {}
        await prisma.guestSession.update({
          where: { id: owner.guestSessionDbId },
          data: {
            data: {
              ...currentData,
              draftSnapshot: JSON.parse(JSON.stringify(draftSnapshot)),
            },
          },
        })
      } catch {
        // ignore
      }
    }

    const payment = await prisma.payment.create({
      data: {
        userId: owner.userId ?? null,
        guestSessionId: owner.userId ? null : owner.guestSessionDbId ?? null,
        planSlug: plan.slug,
        amountXof: plan.priceXof,
        credits,
        status: 'PENDING',
        provider: this.provider.name,
        providerRef: refCommand,
      },
    })

    const safeReturnTo =
      returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : undefined

    const { token, redirectUrl } = await this.provider.initiatePayment({
      itemName: plan.name,
      amountXof: plan.priceXof,
      refCommand,
      commandName: `Profilo'Z — ${plan.name}`,
      customField: { ...owner, planSlug: plan.slug, paymentId: payment.id, returnTo: safeReturnTo },
      ipnUrl: process.env.PAYTECH_IPN_URL ?? '',
      successUrl: buildPublicAppPathForRequest(requestOrigin, '/paiement/succes', {
        ref: refCommand,
        ...(safeReturnTo ? { returnTo: safeReturnTo } : {}),
        ...(guestSessionClientId ? { gs: guestSessionClientId } : {}),
      }),
      cancelUrl: buildPublicAppPathForRequest(requestOrigin, '/paiement/annule', { ref: refCommand }),
    })

    await prisma.payment.update({ where: { id: payment.id }, data: { providerToken: token } })

    return { ref: refCommand, token, redirectUrl }
  }

  /** Traite une notification IPN PayTech (idempotent) : crédite l'utilisateur ou l'invité. */
  async handleIpn(payload: Record<string, unknown>) {
    const verified = this.provider.verifyIpn(payload)
    if (!verified) throw new AppError(400, 'Bad Request', 'Notification non authentifiée')

    const payment = await prisma.payment.findUnique({ where: { providerRef: verified.refCommand } })
    if (!payment) throw new AppError(404, 'Not Found', 'Commande introuvable')
    if (payment.status === 'PAID') return { status: 'already_paid' as const }

    if (verified.amountXof && verified.amountXof !== payment.amountXof) {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } })
      throw new AppError(400, 'Bad Request', 'Montant de paiement incohérent')
    }

    await this.creditPaidPayment(
      {
        id: payment.id,
        userId: payment.userId,
        guestSessionId: payment.guestSessionId,
        planSlug: payment.planSlug,
        credits: payment.credits,
        providerToken: payment.providerToken,
      },
      {
        paymentMethod: verified.paymentMethod,
        providerToken: verified.token ?? payment.providerToken,
      },
    )

    return { status: 'paid' as const }
  }

  /** État des droits du propriétaire (crédits + abonnement + fonctionnalités par pack). */
  async getEntitlements(owner: EntitlementOwner) {
    requireOwner(owner)

    if (owner.userId) {
      const userEntitlements = await this.getUserEntitlements(owner.userId)
      if (!owner.guestSessionDbId) {
        return userEntitlements
      }
      const guestEntitlements = await this.getGuestEntitlements(owner.guestSessionDbId)
      return mergeEntitlementResults(userEntitlements, guestEntitlements)
    }

    return this.getGuestEntitlements(owner.guestSessionDbId!)
  }

  private async getUserEntitlements(userId: string): Promise<EntitlementsWithSnapshot> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { creditsBalance: true, unlimitedUntil: true, subscriptionPlanSlug: true },
    })

    let unlimitedUntil = user?.unlimitedUntil ?? null
    let subscriptionPlanSlug = asSubscriptionPlanSlug(user?.subscriptionPlanSlug)
    const membership = await organizationRepository.findMembershipByUserId(userId)

    if (membership?.organization && isUnlimitedActive(membership.organization.unlimitedUntil)) {
      const orgUntil = membership.organization.unlimitedUntil!
      if (!unlimitedUntil || orgUntil.getTime() > unlimitedUntil.getTime()) {
        unlimitedUntil = orgUntil
      }
      const orgSlug =
        asSubscriptionPlanSlug(membership.organization.subscriptionPlanSlug) ?? 'business'
      subscriptionPlanSlug = mergeSubscriptionPlanSlug(subscriptionPlanSlug, orgSlug)
    }

    const resolved = resolveEntitlements({
      creditsBalance: user?.creditsBalance ?? 0,
      unlimitedUntil,
      subscriptionPlanSlug,
    })
    
    // Tout utilisateur inscrit a accès à son historique et à l'import/scan de documents
    resolved.features.historique = true
    resolved.features.importScan = true

    const canDownloadSnapshot = await isUserSnapshotDossierUnlocked(userId)
    return { ...resolved, canDownloadSnapshot }
  }

  private async getGuestEntitlements(guestSessionDbId: string): Promise<EntitlementsWithSnapshot> {
    const guest = await prisma.guestSession.findUnique({
      where: { id: guestSessionDbId },
      select: { creditsBalance: true, unlimitedUntil: true, subscriptionPlanSlug: true, data: true },
    })
    const resolved = resolveEntitlements({
      creditsBalance: guest?.creditsBalance ?? 0,
      unlimitedUntil: guest?.unlimitedUntil ?? null,
      subscriptionPlanSlug: asSubscriptionPlanSlug(guest?.subscriptionPlanSlug),
    })
    resolved.features.historique = true
    resolved.features.importScan = true
    const canDownloadSnapshot = await isGuestSnapshotDossierUnlocked(guestSessionDbId)
    const meta = readGuestSessionMeta(guest?.data)
    const rawData = (guest?.data && typeof guest.data === 'object') ? (guest.data as Record<string, unknown>) : {}
    const hasPaidAccess = canDownloadSnapshot || (guest?.creditsBalance ?? 0) > 0 || isUnlimitedActive(guest?.unlimitedUntil)
    const paidDraftSnapshot = hasPaidAccess ? rawData.draftSnapshot : undefined

    return {
      ...resolved,
      canDownloadSnapshot,
      downloadedDocIds: meta.downloadedDocIds,
      paidDraftSnapshot,
      paidResumeSnapshot: hasPaidAccess ? rawData.paidResumeSnapshot : undefined,
      paidLetterSnapshot: hasPaidAccess ? rawData.paidLetterSnapshot : undefined,
      paidDocuments: hasPaidAccess ? readPaidDocuments(rawData.paidSnapshots, meta.downloadedDocIds) : undefined,
    }
  }

  /**
   * Débloque un dossier pour le téléchargement (utilisateur ou invité).
   * - Déjà débloqué → no-op.
   * - Abonnement illimité actif → débloque sans consommer de crédit.
   * - Sinon consomme 1 crédit (transaction anti double-consommation).
   * - Aucun droit → AppError 402.
   */
  /** Lettre d'un compte : un des 2 documents du dossier (rattachée ou non à un CV). */
  async unlockLetter(owner: EntitlementOwner, letterId: string) {
    requireOwner(owner)
    if (!owner.userId) throw new AppError(401, 'Unauthorized', 'Authentification requise')

    const letter = await prisma.coverLetter.findFirst({
      where: { id: letterId, userId: owner.userId },
      select: { unlockedAt: true },
    })
    if (!letter) throw new AppError(404, 'Not Found', 'Lettre introuvable')
    return this.unlockUserDocument(owner.userId, snapshotDocKey('letter', letterId), letter.unlockedAt, (tx) =>
      tx.coverLetter.update({ where: { id: letterId }, data: { unlockedAt: new Date() } }),
    )
  }

  /** Débloque un CV ou une lettre d'un compte (déjà débloqué, abonnement, ou place dans le dossier). */
  private async unlockUserDocument(
    userId: string,
    docKey: string,
    unlockedAt: Date | null,
    markUnlocked: (tx: Prisma.TransactionClient) => Promise<unknown>,
  ) {
    if (unlockedAt) return { unlocked: true, consumedCredit: false }

    const entitlements = await this.getEntitlements({ userId })
    if (entitlements.unlimitedActive) {
      await prisma.$transaction(async (tx) => { await markUnlocked(tx) })
      return { unlocked: true, consumedCredit: false }
    }

    const result = await prisma.$transaction(async (tx) => {
      const claimed = await claimUserDossierSlot(tx, userId, docKey)
      await markUnlocked(tx)
      return claimed
    })
    return { unlocked: true, consumedCredit: result === 'consumed' }
  }

  async unlockResume(owner: EntitlementOwner, resumeId: string) {
    requireOwner(owner)

    if (owner.userId) {
      await organizationService.assertResumeAccess(owner.userId, resumeId)
    }

    const ownerWhere = owner.userId
      ? { id: resumeId }
      : { id: resumeId, guestSessionId: owner.guestSessionDbId }

    const resume = await prisma.resume.findFirst({
      where: ownerWhere,
      select: { id: true, unlockedAt: true },
    })
    if (!resume) throw new AppError(404, 'Not Found', 'Dossier introuvable')

    // Compte : le CV est un des 2 documents du dossier (plus de déblocage global du compte)
    if (owner.userId) {
      return this.unlockUserDocument(owner.userId, snapshotDocKey('cv', resumeId), resume.unlockedAt, (tx) =>
        tx.resume.update({ where: { id: resumeId }, data: { unlockedAt: new Date() } }),
      )
    }

    // Si le CV est déjà débloqué (unlockedAt), alors le dossier de candidature (CV+lettre)
    // doit aussi être considéré comme débloqué. On synchronise l'état dossier sans consommer.
    if (resume.unlockedAt) {
      if (owner.userId) {
        await prisma.user.updateMany({
          where: { id: owner.userId, dossierUnlockedAt: null },
          data: { dossierUnlockedAt: new Date() },
        })
      }

      if (owner.guestSessionDbId) {
        const guest = await prisma.guestSession.findUnique({
          where: { id: owner.guestSessionDbId },
          select: { data: true, dossierUnlockedAt: true },
        })
        const meta = readGuestSessionMeta(guest?.data)
        if (!guest?.dossierUnlockedAt && !meta.snapshotUnlockedAt) {
          const baseData =
            guest?.data && typeof guest.data === 'object' && !Array.isArray(guest.data)
              ? (guest.data as Record<string, unknown>)
              : {}

          await prisma.guestSession.update({
            where: { id: owner.guestSessionDbId },
            data: {
              dossierUnlockedAt: new Date(),
              data: {
                ...baseData,
                snapshotUnlockedAt: new Date().toISOString(),
              } as Prisma.InputJsonValue,
            },
          })
        }
      }

      return { unlocked: true, consumedCredit: false }
    }

    const entitlements = await this.getEntitlements(owner)
    if (entitlements.unlimitedActive) {
      await prisma.resume.update({ where: { id: resumeId }, data: { unlockedAt: new Date() } })
      return { unlocked: true, consumedCredit: false }
    }

    // Si le dossier (CV+lettre) est déjà débloqué via un crédit snapshot
    // (dossierUnlockedAt côté user ou snapshotUnlockedAt côté invité),
    // alors on doit pouvoir débloquer le CV sans reconsommer un 2e crédit.
    if (entitlements.canDownloadSnapshot) {
      await prisma.resume.update({ where: { id: resumeId }, data: { unlockedAt: new Date() } })
      return { unlocked: true, consumedCredit: false }
    }

    return prisma.$transaction(async (tx) => {
      const fresh = await tx.resume.findFirst({
        where: ownerWhere,
        select: { unlockedAt: true },
      })
      if (fresh?.unlockedAt) return { unlocked: true, consumedCredit: false }

      const decremented = owner.userId
        ? await tx.user.updateMany({
            where: { id: owner.userId, creditsBalance: { gt: 0 } },
            data: { creditsBalance: { decrement: 1 } },
          })
        : { count: 0 }

      const guestDecremented =
        decremented.count === 0 && owner.guestSessionDbId
          ? await tx.guestSession.updateMany({
              where: { id: owner.guestSessionDbId, creditsBalance: { gt: 0 } },
              data: { creditsBalance: { decrement: 1 } },
            })
          : decremented

      if (guestDecremented.count === 0) {
        throw new AppError(
          402,
          'Payment Required',
          'Aucun crédit disponible. Choisissez une offre pour débloquer ce dossier.',
        )
      }

      if (owner.userId && decremented.count > 0) {
        await tx.user.updateMany({
          where: { id: owner.userId, dossierUnlockedAt: null },
          data: { dossierUnlockedAt: new Date() },
        })
      }

      if (
        owner.guestSessionDbId
        && decremented.count === 0
        && guestDecremented.count > 0
      ) {
        const guest = await tx.guestSession.findUnique({
          where: { id: owner.guestSessionDbId },
          select: { data: true, dossierUnlockedAt: true },
        })
        const meta = readGuestSessionMeta(guest?.data)
        if (!guest?.dossierUnlockedAt && !meta.snapshotUnlockedAt) {
          const baseData =
            guest?.data && typeof guest.data === 'object' && !Array.isArray(guest.data)
              ? (guest.data as Record<string, unknown>)
              : {}
          await tx.guestSession.update({
            where: { id: owner.guestSessionDbId },
            data: {
              dossierUnlockedAt: new Date(),
              data: {
                ...baseData,
                snapshotUnlockedAt: new Date().toISOString(),
              } as Prisma.InputJsonValue,
            },
          })
        }
      }

      await tx.resume.update({ where: { id: resumeId }, data: { unlockedAt: new Date() } })
      return { unlocked: true, consumedCredit: true }
    })
  }

  /**
   * Migre les droits et données d'une session invitée vers un utilisateur
   * (à la création du compte) : crédits, abonnement, dossiers et paiements.
   */
  async migrateGuestToUser(userId: string, guestSessionDbId: string) {
    const guest = await prisma.guestSession.findUnique({
      where: { id: guestSessionDbId },
      select: {
        creditsBalance: true,
        unlimitedUntil: true,
        subscriptionPlanSlug: true,
        dossierUnlockedAt: true,
        data: true,
      },
    })
    if (!guest) return

    const guestSnapshotUnlocked =
      guest.dossierUnlockedAt?.toISOString()
      ?? readGuestSessionMeta(guest.data).snapshotUnlockedAt

    await prisma.$transaction(async (tx) => {
      await tx.resume.updateMany({
        where: { guestSessionId: guestSessionDbId },
        data: { userId, guestSessionId: null },
      })
      await tx.payment.updateMany({
        where: { guestSessionId: guestSessionDbId },
        data: { userId, guestSessionId: null },
      })

      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { unlimitedUntil: true, subscriptionPlanSlug: true, dossierUnlockedAt: true },
      })
      const mergedUntil = [guest.unlimitedUntil, user?.unlimitedUntil]
        .filter((d): d is Date => Boolean(d))
        .sort((a, b) => b.getTime() - a.getTime())[0]

      const guestSlug = asSubscriptionPlanSlug(guest.subscriptionPlanSlug)
      const mergedSlug = guestSlug
        ? mergeSubscriptionPlanSlug(asSubscriptionPlanSlug(user?.subscriptionPlanSlug), guestSlug)
        : asSubscriptionPlanSlug(user?.subscriptionPlanSlug)

      const dossierUnlockedAt =
        user?.dossierUnlockedAt ??
        (guestSnapshotUnlocked ? new Date(guestSnapshotUnlocked) : undefined)

      await tx.user.update({
        where: { id: userId },
        data: {
          creditsBalance: { increment: guest.creditsBalance },
          ...(mergedUntil ? { unlimitedUntil: mergedUntil } : {}),
          ...(mergedSlug ? { subscriptionPlanSlug: mergedSlug } : {}),
          ...(dossierUnlockedAt ? { dossierUnlockedAt } : {}),
        },
      })
      await tx.guestSession.update({
        where: { id: guestSessionDbId },
        data: { creditsBalance: 0, unlimitedUntil: null, subscriptionPlanSlug: null },
      })
    })

    const guestHadBusiness =
      asSubscriptionPlanSlug(guest.subscriptionPlanSlug) === 'business' &&
      isUnlimitedActive(guest.unlimitedUntil)
    if (guestHadBusiness) {
      await organizationService.ensureBusinessOrganization(
        userId,
        Math.max(
          1,
          Math.ceil(
            ((guest.unlimitedUntil?.getTime() ?? Date.now()) - Date.now()) / (1000 * 60 * 60 * 24),
          ),
        ),
      )
    }
  }
}

export const paymentService = new PaymentService()
