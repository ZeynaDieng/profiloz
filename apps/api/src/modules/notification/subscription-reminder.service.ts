import { getPlan } from '@profiloz/shared'
import { prisma } from '@/lib/prisma'
import { buildResumeDossierUrl, sendEmailTemplate } from '@/lib/email/mail.service'

/** Rappel envoyé quand l'accès illimité se termine dans moins de 3 jours. */
const REMINDER_WINDOW_DAYS = 3

type ReminderTarget = {
  email: string
  firstName: string
  planSlug: string | null
  endsAt: Date
  renewUrl: string
}

function formatEndDate(date: Date) {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Dakar' })
}

/** E-mail et prénom d'un invité : pris dans ses documents payés (il n'a pas de compte). */
function guestContact(data: unknown): { email: string; firstName: string } | null {
  const raw = (data && typeof data === 'object' ? data : {}) as Record<string, any>
  const candidates = [raw.paidResumeSnapshot, raw.draftSnapshot, raw.paidLetterSnapshot]
  for (const snap of candidates) {
    if (!snap || typeof snap !== 'object') continue
    const email = String(snap.personalInfo?.email ?? snap.senderEmail ?? '').trim()
    if (!email.includes('@')) continue
    const fullName = String(snap.personalInfo?.fullName ?? snap.senderName ?? '').trim()
    return { email, firstName: fullName.split(/\s+/)[0] ?? '' }
  }
  return null
}

/** true si l'e-mail est parti (SMTP configuré et accepté). */
async function send(target: ReminderTarget): Promise<boolean> {
  const result = await sendEmailTemplate('subscription_reminder', target.email, {
    firstName: target.firstName || 'à vous',
    planName: (target.planSlug && getPlan(target.planSlug)?.name) || 'Accès illimité',
    endDate: formatEndDate(target.endsAt),
    renewUrl: target.renewUrl,
  })
  return result.sent
}

/**
 * Envoie un rappel par période d'accès illimité (comptes et invités).
 * Chaque rappel est d'abord « réservé » en base (updateMany conditionnel) : plusieurs instances
 * de l'API peuvent tourner en même temps, une seule envoie l'e-mail.
 */
export async function sendSubscriptionReminders(now = new Date()) {
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_DAYS * 24 * 60 * 60 * 1000)
  const publicAppUrl = process.env.PUBLIC_APP_URL || 'https://profiloz.com'
  let sent = 0

  const users = await prisma.user.findMany({
    where: { unlimitedUntil: { gt: now, lte: windowEnd } },
    select: { id: true, email: true, firstName: true, unlimitedUntil: true, unlimitedReminderFor: true, subscriptionPlanSlug: true },
  })
  for (const user of users) {
    const endsAt = user.unlimitedUntil!
    if (user.unlimitedReminderFor?.getTime() === endsAt.getTime()) continue
    const claimed = await prisma.user.updateMany({
      where: { id: user.id, unlimitedUntil: endsAt, OR: [{ unlimitedReminderFor: null }, { unlimitedReminderFor: { not: endsAt } }] },
      data: { unlimitedReminderFor: endsAt },
    })
    if (claimed.count === 0) continue
    const delivered = await send({ email: user.email, firstName: user.firstName ?? '', planSlug: user.subscriptionPlanSlug, endsAt, renewUrl: `${publicAppUrl}/tarifs?reason=renew` })
      .catch((error) => { console.warn('[reminders] e-mail utilisateur non envoyé:', error); return false })
    if (delivered) sent++
    // Pas envoyé : libérer la réservation pour réessayer au prochain passage
    else await prisma.user.updateMany({ where: { id: user.id, unlimitedReminderFor: endsAt }, data: { unlimitedReminderFor: user.unlimitedReminderFor } })
  }

  const guests = await prisma.guestSession.findMany({
    where: { unlimitedUntil: { gt: now, lte: windowEnd } },
    select: { id: true, sessionId: true, data: true, unlimitedUntil: true, unlimitedReminderFor: true, subscriptionPlanSlug: true },
  })
  for (const guest of guests) {
    const endsAt = guest.unlimitedUntil!
    if (guest.unlimitedReminderFor?.getTime() === endsAt.getTime()) continue
    const contact = guestContact(guest.data)
    if (!contact) continue
    const claimed = await prisma.guestSession.updateMany({
      where: { id: guest.id, unlimitedUntil: endsAt, OR: [{ unlimitedReminderFor: null }, { unlimitedReminderFor: { not: endsAt } }] },
      data: { unlimitedReminderFor: endsAt },
    })
    if (claimed.count === 0) continue
    // L'invité retrouve sa session (et ses documents) puis arrive sur les offres
    const renewUrl = `${buildResumeDossierUrl(publicAppUrl, guest.sessionId)}&next=${encodeURIComponent('/tarifs?reason=renew')}`
    const delivered = await send({ ...contact, planSlug: guest.subscriptionPlanSlug, endsAt, renewUrl })
      .catch((error) => { console.warn('[reminders] e-mail invité non envoyé:', error); return false })
    if (delivered) sent++
    else await prisma.guestSession.updateMany({ where: { id: guest.id, unlimitedReminderFor: endsAt }, data: { unlimitedReminderFor: guest.unlimitedReminderFor } })
  }

  return { users: users.length, guests: guests.length, sent }
}
