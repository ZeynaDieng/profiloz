import type { ReviewStatus } from '@prisma/client'
import { z } from 'zod'
import { AppError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'
import type { RequestContext } from '@/lib/request-context'
import { logAdminAction } from '@/modules/admin/admin-audit.service'
import { paginationMeta, parsePagination } from '@/modules/admin/admin.utils'

/**
 * Avis clients : seuls les clients ayant payé peuvent en déposer un, et il n'apparaît sur
 * l'accueil qu'après validation par un admin. Les chiffres affichés viennent de la base.
 */

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(10, 'Votre avis doit faire au moins 10 caractères.').max(600),
  displayName: z.string().trim().min(2, 'Indiquez le nom à afficher.').max(40),
  city: z.string().trim().max(40).optional().or(z.literal('')),
  consent: z.literal(true, { errorMap: () => ({ message: 'Acceptez la publication de votre avis.' }) }),
})

const moderateSchema = z.object({ status: z.enum(['APPROVED', 'REJECTED', 'PENDING']) })

/** Avis affichés sur l'accueil (les plus récents). */
const PUBLIC_REVIEW_LIMIT = 9
const PUBLIC_CACHE_MS = 5 * 60_000

export type PublicReviews = {
  reviews: Array<{ id: string; rating: number; comment: string; displayName: string; city: string | null; createdAt: string }>
  stats: { reviewCount: number; averageRating: number | null; documentCount: number }
}

let publicCache: { at: number; value: PublicReviews } | null = null

function ownerWhere(ctx: RequestContext) {
  if (ctx.userId) return { userId: ctx.userId }
  if (ctx.guestSessionDbId) return { guestSessionId: ctx.guestSessionDbId }
  return null
}

async function hasPaid(ctx: RequestContext): Promise<boolean> {
  const or = [
    ctx.userId ? { userId: ctx.userId } : null,
    ctx.guestSessionDbId ? { guestSessionId: ctx.guestSessionDbId } : null,
  ].filter((clause): clause is { userId: string } | { guestSessionId: string } => clause !== null)
  if (or.length === 0) return false
  const paid = await prisma.payment.findFirst({ where: { status: 'PAID', OR: or }, select: { id: true } })
  return Boolean(paid)
}

export const reviewService = {
  /** Avis déjà déposé par ce client (pour pré-remplir le formulaire), et s'il peut en déposer un. */
  async getMine(ctx: RequestContext) {
    const where = ownerWhere(ctx)
    const [review, canReview] = await Promise.all([
      where ? prisma.review.findFirst({ where }) : null,
      hasPaid(ctx),
    ])
    return { review, canReview }
  },

  async submit(ctx: RequestContext, body: unknown) {
    const where = ownerWhere(ctx)
    if (!where || !(await hasPaid(ctx))) {
      throw new AppError(403, 'Forbidden', 'Seuls les clients ayant téléchargé leur dossier peuvent laisser un avis.')
    }
    const parsed = reviewSchema.safeParse(body)
    if (!parsed.success) {
      throw new AppError(400, 'Bad Request', parsed.error.issues[0]?.message ?? 'Avis invalide.')
    }
    const { rating, comment, displayName, city } = parsed.data
    const data = { rating, comment, displayName, city: city || null, status: 'PENDING' as const, moderatedAt: null }

    // Un avis modifié repasse en validation
    const review = ctx.userId
      ? await prisma.review.upsert({ where: { userId: ctx.userId }, create: { ...data, userId: ctx.userId }, update: data })
      : await prisma.review.upsert({
          where: { guestSessionId: ctx.guestSessionDbId! },
          create: { ...data, guestSessionId: ctx.guestSessionDbId! },
          update: data,
        })
    publicCache = null
    return review
  },

  async getPublic(): Promise<PublicReviews> {
    if (publicCache && Date.now() - publicCache.at < PUBLIC_CACHE_MS) return publicCache.value

    const [rows, aggregate, documentCount] = await Promise.all([
      prisma.review.findMany({
        where: { status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
        take: PUBLIC_REVIEW_LIMIT,
        select: { id: true, rating: true, comment: true, displayName: true, city: true, createdAt: true },
      }),
      prisma.review.aggregate({ where: { status: 'APPROVED' }, _avg: { rating: true }, _count: true }),
      // Documents réellement générés en PDF (CV et lettres)
      prisma.pdfJob.count({ where: { status: 'completed' } }),
    ])

    const value: PublicReviews = {
      reviews: rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })),
      stats: {
        reviewCount: aggregate._count,
        averageRating: aggregate._avg.rating ? Math.round(aggregate._avg.rating * 10) / 10 : null,
        documentCount,
      },
    }
    publicCache = { at: Date.now(), value }
    return value
  },

  async listForAdmin(searchParams: URLSearchParams) {
    const parsed = parsePagination(searchParams)
    const page = parsed.page ?? 1
    const limit = parsed.limit ?? 20
    const status = searchParams.get('status')
    const where = status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status) ? { status: status as ReviewStatus } : {}
    const [data, total, pending] = await Promise.all([
      prisma.review.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.review.count({ where }),
      prisma.review.count({ where: { status: 'PENDING' } }),
    ])
    return { data, meta: paginationMeta(page, limit, total), pending }
  },

  async moderate(id: string, body: unknown, actorId: string) {
    const parsed = moderateSchema.safeParse(body)
    if (!parsed.success) throw new AppError(400, 'Bad Request', 'Statut invalide.')
    const existing = await prisma.review.findUnique({ where: { id } })
    if (!existing) throw new AppError(404, 'Not Found', 'Avis introuvable.')
    const review = await prisma.review.update({
      where: { id },
      data: { status: parsed.data.status, moderatedAt: new Date() },
    })
    await logAdminAction({
      actorId,
      action: `review.${parsed.data.status.toLowerCase()}`,
      targetType: 'review',
      targetId: id,
    })
    publicCache = null
    return review
  },
}
