export const PAYMENT_CURRENCY = 'XOF' as const

/** Slugs des offres. Stables : utilisés en base et côté provider. */
export const PLAN_SLUGS = ['dossier_unique', 'pack_10', 'illimite', 'business'] as const
export type PlanSlug = (typeof PLAN_SLUGS)[number]

export type PlanKind = 'credits' | 'subscription'

export interface Plan {
  slug: PlanSlug
  name: string
  /** Prix en FCFA (XOF), entier (pas de centimes). */
  priceXof: number
  kind: PlanKind
  /** Crédits accordés (offres à crédits). Pour les abonnements : Infinity. */
  credits: number
  /** Durée d'abonnement en jours (offres subscription). */
  durationDays?: number
  description: string
  features: string[]
  popular?: boolean
}

/** Fonctionnalités communes à tout dossier débloqué (crédits ou abonnement). */
const DOSSIER_QUALITY_FEATURES = [
  'PDF haute qualité',
  'Téléchargements illimités',
  'Modifications illimitées',
] as const

/** Fonctionnalités des abonnements Illimité et Business (liste explicite, pas de raccourci). */
const SUBSCRIPTION_CORE_FEATURES = [
  'Dossiers illimités',
  'Historique de vos dossiers',
  'Import & scan de documents',
  ...DOSSIER_QUALITY_FEATURES,
] as const

/**
 * Catalogue des offres Profilo'Z V1.
 * Le paiement intervient à la fin du parcours (au téléchargement du dossier).
 * 1 dossier débloqué = 1 crédit (CV + lettre). Les téléchargements ne consomment jamais de crédit.
 */
export const PLANS: Plan[] = [
  {
    slug: 'dossier_unique',
    name: 'Dossier Unique',
    priceXof: 300,
    kind: 'credits',
    credits: 1,
    description: 'Un dossier complet, prêt à envoyer.',
    features: ['1 dossier (CV + lettre)', ...DOSSIER_QUALITY_FEATURES],
  },
  {
    slug: 'pack_10',
    name: 'Pack 10 Dossiers',
    priceXof: 1500,
    kind: 'credits',
    credits: 10,
    description: 'Idéal pour multiplier les candidatures.',
    features: ['10 dossiers (CV + lettre chacun)', ...DOSSIER_QUALITY_FEATURES],
  },
  {
    slug: 'illimite',
    name: 'Illimité',
    priceXof: 3900,
    kind: 'subscription',
    credits: Number.POSITIVE_INFINITY,
    durationDays: 30,
    description: 'Tout, sans limite, chaque mois.',
    features: [...SUBSCRIPTION_CORE_FEATURES],
    popular: true,
  },
  {
    slug: 'business',
    name: 'Business',
    priceXof: 9900,
    kind: 'subscription',
    credits: Number.POSITIVE_INFINITY,
    durationDays: 30,
    description: 'Pour les entreprises, écoles et cabinets RH.',
    features: [
      ...SUBSCRIPTION_CORE_FEATURES,
      'Multi-collaborateurs',
      'Espace organisation',
    ],
  },
]

export function getPlan(slug: string): Plan | undefined {
  return PLANS.find((p) => p.slug === slug)
}

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELED'

export function formatXof(amount: number): string {
  return `${amount.toLocaleString('fr-FR')} FCFA`
}
