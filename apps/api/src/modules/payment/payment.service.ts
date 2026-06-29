import { randomUUID } from 'crypto'
import { getPlan } from '@profiloz/shared'
import { AppError } from '@/lib/errors'
import { buildPublicAppPathForRequest } from '@/lib/pdf/app-url'
import { prisma } from '@/lib/prisma'
import { paytechProvider } from './paytech.provider'
import type { PaymentProvider } from './payment.provider'

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

export class PaymentService {
  constructor(private readonly provider: PaymentProvider = paytechProvider) {}

  private async creditPaidPayment(
    payment: PaidPaymentRecord,
    meta: { paymentMethod?: string; providerToken?: string | null },
  ) {
    const plan = getPlan(payment.planSlug)
    const isSubscription = plan?.kind === 'subscription'

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
          const user = await tx.user.findUnique({ where: { id: payment.userId }, select: { unlimitedUntil: true } })
          const start = isUnlimitedActive(user?.unlimitedUntil) ? user!.unlimitedUntil! : new Date()
          await tx.user.update({
            where: { id: payment.userId },
            data: { unlimitedUntil: addDays(start, plan!.durationDays ?? 30) },
          })
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
            select: { unlimitedUntil: true },
          })
          const start = isUnlimitedActive(guest?.unlimitedUntil) ? guest!.unlimitedUntil! : new Date()
          await tx.guestSession.update({
            where: { id: payment.guestSessionId },
            data: { unlimitedUntil: addDays(start, plan!.durationDays ?? 30) },
          })
        } else {
          await tx.guestSession.update({
            where: { id: payment.guestSessionId },
            data: { creditsBalance: { increment: payment.credits } },
          })
        }
      }
    })
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
      },
    })
    if (!payment) throw new AppError(404, 'Not Found', 'Commande introuvable')
    assertPaymentOwner(payment, owner)

    if (payment.status === 'PAID') {
      return { status: 'already_paid' as const, entitlements: await this.getEntitlements(owner) }
    }
    if (payment.status !== 'PENDING') {
      throw new AppError(400, 'Bad Request', 'Cette commande ne peut pas être confirmée')
    }

    await this.creditPaidPayment(payment, { paymentMethod: 'paytech_return' })
    return { status: 'paid' as const, entitlements: await this.getEntitlements(owner) }
  }

  /**
   * Vérifie qu'un invité peut télécharger (sans consommer le crédit).
   */
  async assertGuestSnapshotDownload(owner: EntitlementOwner) {
    requireOwner(owner)
    if (owner.userId) return

    const entitlements = await this.getEntitlements(owner)
    if (entitlements.unlimitedActive) return
    if (entitlements.creditsBalance <= 0) {
      throw new AppError(
        402,
        'Payment Required',
        'Aucun crédit disponible. Choisissez une offre pour télécharger votre CV.',
      )
    }
  }

  /**
   * Consomme 1 crédit pour un téléchargement PDF invité (snapshot, sans dossier en base).
   * Abonnement illimité actif → gratuit. Sinon 402 si aucun crédit.
   */
  async consumeGuestSnapshotDownload(owner: EntitlementOwner) {
    requireOwner(owner)
    if (owner.userId) return { consumed: false }

    const entitlements = await this.getEntitlements(owner)
    if (entitlements.unlimitedActive) return { consumed: false }

    const decremented = await prisma.guestSession.updateMany({
      where: { id: owner.guestSessionDbId, creditsBalance: { gt: 0 } },
      data: { creditsBalance: { decrement: 1 } },
    })

    if (decremented.count === 0) {
      throw new AppError(
        402,
        'Payment Required',
        'Aucun crédit disponible. Choisissez une offre pour télécharger votre CV.',
      )
    }
    return { consumed: true }
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
    const plan = getPlan(planSlug)
    if (!plan) throw new AppError(400, 'Bad Request', 'Offre inconnue')

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

  /** État des droits du propriétaire (crédits + abonnement). */
  async getEntitlements(owner: EntitlementOwner) {
    requireOwner(owner)
    if (owner.userId) {
      const user = await prisma.user.findUnique({
        where: { id: owner.userId },
        select: { creditsBalance: true, unlimitedUntil: true },
      })
      return {
        creditsBalance: user?.creditsBalance ?? 0,
        unlimitedUntil: user?.unlimitedUntil ?? null,
        unlimitedActive: isUnlimitedActive(user?.unlimitedUntil),
      }
    }
    const guest = await prisma.guestSession.findUnique({
      where: { id: owner.guestSessionDbId! },
      select: { creditsBalance: true, unlimitedUntil: true },
    })
    return {
      creditsBalance: guest?.creditsBalance ?? 0,
      unlimitedUntil: guest?.unlimitedUntil ?? null,
      unlimitedActive: isUnlimitedActive(guest?.unlimitedUntil),
    }
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
    const ownerWhere = owner.userId
      ? { userId: owner.userId }
      : { guestSessionId: owner.guestSessionDbId }

    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, ...ownerWhere },
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
        where: { id: resumeId, ...ownerWhere },
        select: { unlockedAt: true },
      })
      if (fresh?.unlockedAt) return { unlocked: true, consumedCredit: false }

      const decremented = owner.userId
        ? await tx.user.updateMany({
            where: { id: owner.userId, creditsBalance: { gt: 0 } },
            data: { creditsBalance: { decrement: 1 } },
          })
        : await tx.guestSession.updateMany({
            where: { id: owner.guestSessionDbId, creditsBalance: { gt: 0 } },
            data: { creditsBalance: { decrement: 1 } },
          })

      if (decremented.count === 0) {
        throw new AppError(
          402,
          'Payment Required',
          'Aucun crédit disponible. Choisissez une offre pour débloquer ce dossier.',
        )
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
      select: { creditsBalance: true, unlimitedUntil: true },
    })
    if (!guest) return

    await prisma.$transaction(async (tx) => {
      // Réassignation des dossiers invités.
      await tx.resume.updateMany({
        where: { guestSessionId: guestSessionDbId },
        data: { userId, guestSessionId: null },
      })
      // Réassignation des paiements invités.
      await tx.payment.updateMany({
        where: { guestSessionId: guestSessionDbId },
        data: { userId, guestSessionId: null },
      })
      // Transfert des crédits et de l'abonnement.
      const user = await tx.user.findUnique({ where: { id: userId }, select: { unlimitedUntil: true } })
      const mergedUntil = [guest.unlimitedUntil, user?.unlimitedUntil]
        .filter((d): d is Date => Boolean(d))
        .sort((a, b) => b.getTime() - a.getTime())[0]
      await tx.user.update({
        where: { id: userId },
        data: {
          creditsBalance: { increment: guest.creditsBalance },
          ...(mergedUntil ? { unlimitedUntil: mergedUntil } : {}),
        },
      })
      await tx.guestSession.update({
        where: { id: guestSessionDbId },
        data: { creditsBalance: 0, unlimitedUntil: null },
      })
    })
  }
}

export const paymentService = new PaymentService()
