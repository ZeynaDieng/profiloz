import { sendSubscriptionReminders } from '@/modules/notification/subscription-reminder.service'

/** Rappels de fin d'accès illimité toutes les 6 h ; sans doublon entre instances (cf. le service). */
const REMINDER_INTERVAL_MS = 6 * 60 * 60 * 1000
const FIRST_RUN_DELAY_MS = 2 * 60 * 1000

// En production uniquement, sauf demande explicite (SUBSCRIPTION_REMINDERS=on / off)
const setting = process.env.SUBSCRIPTION_REMINDERS
const enabled = setting ? setting === 'on' : process.env.NODE_ENV === 'production'

if (enabled) {
  const run = () => {
    sendSubscriptionReminders()
      .then((stats) => { if (stats.sent) console.log('[reminders]', JSON.stringify(stats)) })
      .catch((error) => console.warn('[reminders] échec:', error))
  }
  setTimeout(run, FIRST_RUN_DELAY_MS)
  setInterval(run, REMINDER_INTERVAL_MS)
}
