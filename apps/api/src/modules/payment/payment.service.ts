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

type GuestSessionMeta = { snapshotUnlockedAt?: string }

function readGuestSessionMeta(data: unknown): GuestSessionMeta {
  if (!data || typeof data !== 'object') return {}
  const raw = data as GuestSessionMeta
  return typeof raw.snapshotUnlockedAt === 'string' ? { snapshotUnlockedAt: raw.snapshotUnlockedAt } : {}
}

async function isGuestSnapshotDossierUnlocked(guestSessionDbId: string): Promise<boolean> {
  const guest = await prisma.guestSession.findUnique({
    where: { id: guestSessionDbId },
    select: { data: true },
  })
  return Boolean(readGuestSessionMeta(guest?.data).snapshotUnlockedAt)
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

type EntitlementsWithSnapshot = ResolvedEntitlements & { canDownloadSnapshot: boolean }

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
  }
}

export class PaymentService {
  constructor(private readonly provider: PaymentProvider = paytechProvider) {}

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

    // Compte connecté : la commande doit correspondre au compte.
    if (payment.userId) {
      if (!ownerMatches) {
        throw new AppError(403, 'Forbidden', 'Cette commande ne correspond pas à votre compte.')
      }
      if (payment.status === 'PAID') {
        return { status: 'already_paid' as const, entitlements: await this.getEntitlements(owner) }
      }
      if (payment.status !== 'PENDING') {
        throw new AppError(400, 'Bad Request', 'Cette commande ne peut pas être confirmée')
      }
      await this.creditPaidPayment(payment, { paymentMethod: 'paytech_return' })
      return { status: 'paid' as const, entitlements: await this.getEntitlements(owner) }
    }

    // Invité : la ref PayTech suffit — créditer la session liée au paiement même si le navigateur a basculé.
    if (!paymentGuestOwner) {
      if (payment.status === 'PAID') {
        return {
          status: 'already_paid' as const,
          entitlements: await this.getEntitlements(owner),
        }
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
          return {
            status: 'already_paid' as const,
            entitlements: currentEntitlements,
          }
        }
      }

      return {
        status: 'already_paid' as const,
        entitlements: paymentEntitlements,
        guestSessionClientId,
      }
    }
    if (payment.status !== 'PENDING') {
      throw new AppError(400, 'Bad Request', 'Cette commande ne peut pas être confirmée')
    }

    await this.creditPaidPayment(payment, { paymentMethod: 'paytech_return' })
    return {
      status: 'paid' as const,
      entitlements: await this.getEntitlements(paymentGuestOwner),
      guestSessionClientId,
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
  async consumeSnapshotDownload(owner: EntitlementOwner) {
    requireOwner(owner)
    const entitlements = await this.getEntitlements(owner)
    if (entitlements.unlimitedActive) return { consumed: false }

    if (owner.userId && (await isUserSnapshotDossierUnlocked(owner.userId))) {
      return { consumed: false }
    }
    if (owner.guestSessionDbId && (await isGuestSnapshotDossierUnlocked(owner.guestSessionDbId))) {
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
        select: { data: true, creditsBalance: true },
      })
      if (!guest) throw new AppError(404, 'Not Found', 'Session invité introuvable')

      const meta = readGuestSessionMeta(guest.data)
      if (meta.snapshotUnlockedAt) return { consumed: false }

      const decremented = await tx.guestSession.updateMany({
        where: { id: owner.guestSessionDbId, creditsBalance: { gt: 0 } },
        data: {
          creditsBalance: { decrement: 1 },
          data: {
            ...meta,
            snapshotUnlockedAt: new Date().toISOString(),
          },
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
        select: { data: true },
      })
      const meta = readGuestSessionMeta(guest?.data)
      if (meta.snapshotUnlockedAt) {
        const baseData =
          guest?.data && typeof guest.data === 'object' && !Array.isArray(guest.data)
            ? (guest.data as Record<string, unknown>)
            : {}
        const { snapshotUnlockedAt: _removed, ...rest } = baseData
        await prisma.guestSession.update({
          where: { id: owner.guestSessionDbId },
          data: { data: rest as Prisma.InputJsonValue },
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
  ) {
    requireOwner(owner)
    const plan = await getResolvedPlan(planSlug)
    if (!plan) throw new AppError(400, 'Bad Request', 'Offre inconnue ou inactive')

    const refCommand = `pz_${randomUUID().replace(/-/g, '')}`
    const credits = Number.isFinite(plan.credits) ? plan.credits : 0

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

    return { ref: refCommand, redirectUrl }
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
    const canDownloadSnapshot = await isUserSnapshotDossierUnlocked(userId)
    return { ...resolved, canDownloadSnapshot }
  }

  private async getGuestEntitlements(guestSessionDbId: string): Promise<EntitlementsWithSnapshot> {
    const guest = await prisma.guestSession.findUnique({
      where: { id: guestSessionDbId },
      select: { creditsBalance: true, unlimitedUntil: true, subscriptionPlanSlug: true },
    })
    const resolved = resolveEntitlements({
      creditsBalance: guest?.creditsBalance ?? 0,
      unlimitedUntil: guest?.unlimitedUntil ?? null,
      subscriptionPlanSlug: asSubscriptionPlanSlug(guest?.subscriptionPlanSlug),
    })
    const canDownloadSnapshot = await isGuestSnapshotDossierUnlocked(guestSessionDbId)
    return { ...resolved, canDownloadSnapshot }
  }

  /**
   * Débloque un dossier pour le téléchargement (utilisateur ou invité).
   * - Déjà débloqué → no-op.
   * - Abonnement illimité actif → débloque sans consommer de crédit.
   * - Sinon consomme 1 crédit (transaction anti double-consommation).
   * - Aucun droit → AppError 402.
   */
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
    if (resume.unlockedAt) return { unlocked: true, consumedCredit: false }

    const entitlements = await this.getEntitlements(owner)
    if (entitlements.unlimitedActive) {
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
          select: { data: true },
        })
        const meta = readGuestSessionMeta(guest?.data)
        if (!meta.snapshotUnlockedAt) {
          const baseData =
            guest?.data && typeof guest.data === 'object' && !Array.isArray(guest.data)
              ? (guest.data as Record<string, unknown>)
              : {}
          await tx.guestSession.update({
            where: { id: owner.guestSessionDbId },
            data: {
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
      select: { creditsBalance: true, unlimitedUntil: true, subscriptionPlanSlug: true, data: true },
    })
    if (!guest) return

    const guestSnapshotUnlocked = readGuestSessionMeta(guest.data).snapshotUnlockedAt

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
