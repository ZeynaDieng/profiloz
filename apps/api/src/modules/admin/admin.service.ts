import type { OrganizationType, PaymentStatus } from '@profiloz/shared'
import { PLANS } from '@profiloz/shared'
import {
  adminSendNotificationSchema,
  adminUpdateEmailTemplateSchema,
  adminUpdateOrganizationSchema,
  adminUpdatePlanSchema,
  adminUpdatePlatformSettingsSchema,
  adminUpdateTemplateSchema,
  adminUpdateUserSchema,
} from '@profiloz/validators'
import bcrypt from 'bcryptjs'
import { AppError } from '@/lib/errors'
import { checkPdfRenderReadiness } from '@/lib/pdf/pdf-readiness'
import { prisma } from '@/lib/prisma'
import { authService } from '@/modules/auth/auth.service'
import { organizationRepository } from '@/modules/organization/organization.repository'
import { logAdminAction } from './admin-audit.service'
import { getPlatformSetting, listPlatformSettings, upsertPlatformSetting } from './platform-settings.repository'
import {
  bucketByDay,
  bucketPaymentsByDay,
  endOfDay,
  formatPersonName,
  isSubscriptionActive,
  lastNDays,
  paginationMeta,
  parsePagination,
  startOfDay,
  startOfMonth,
  startOfWeek,
  type PaginationInput,
} from './admin.utils'

const COVER_LETTER_TEMPLATES = [
  { slug: 'CLASSIQUE', name: 'Classique', category: 'Corporate', isActive: true },
  { slug: 'MODERNE', name: 'Moderne', category: 'Professionnel', isActive: true },
  { slug: 'ACCENT', name: 'Accent', category: 'Distinctif', isActive: true },
  { slug: 'PROFESSIONNEL', name: 'Professionnel', category: 'Corporate', isActive: true },
  { slug: 'CREATIF', name: 'Créatif', category: 'Créatif', isActive: true },
] as const

const EMAIL_TEMPLATES = [
  { slug: 'welcome', name: 'Email de bienvenue', description: 'Envoyé après inscription.' },
  { slug: 'payment_receipt', name: 'Reçu de paiement', description: 'Confirmation après paiement réussi.' },
  { slug: 'password_reset', name: 'Réinitialisation du mot de passe', description: 'Lien de réinitialisation.' },
  { slug: 'order_confirmation', name: 'Confirmation de commande', description: 'Récapitulatif de commande.' },
] as const

function generateTempPassword() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12)
}

type PlanOverride = { priceXof?: number; active?: boolean; description?: string }

function toAdminOrganizationDto(
  org: NonNullable<Awaited<ReturnType<typeof organizationRepository.findOrganizationById>>>,
  counts: { resumes: number; documents: number; letters: number },
) {
  return {
    id: org.id,
    name: org.name,
    type: org.type,
    unlimitedUntil: org.unlimitedUntil?.toISOString() ?? null,
    subscriptionPlanSlug: org.subscriptionPlanSlug,
    subscriptionActive: isSubscriptionActive(org.unlimitedUntil),
    createdAt: org.createdAt.toISOString(),
    updatedAt: org.updatedAt.toISOString(),
    memberCount: org.members.length,
    resumeCount: counts.resumes,
    documentCount: counts.documents,
    letterCount: counts.letters,
    members: org.members.map((member) => ({
      id: member.id,
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt.toISOString(),
      name: formatPersonName(member.user),
      email: member.user.email,
    })),
  }
}

export class AdminService {
  async getStats() {
    const dashboard = await this.getDashboard()
    return dashboard.summary
  }

  async getDashboard() {
    const now = new Date()
    const todayStart = startOfDay(now)
    const weekStart = startOfWeek(now)
    const monthStart = startOfMonth(now)
    const chartDays = lastNDays(30)
    const chartStart = chartDays[0]!

    const [
      totalUsers,
      usersToday,
      activeGuests,
      activeBusinessOrganizations,
      totalResumes,
      resumesToday,
      totalLetters,
      lettersToday,
      pdfGenerated,
      ocrImports,
      revenueToday,
      revenueWeek,
      revenueMonth,
      revenueTotal,
      chartUsers,
      chartResumes,
      chartLetters,
      chartPayments,
      recentUsers,
      recentResumes,
      recentLetters,
      recentPayments,
      recentOrganizations,
      recentPdfJobs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.guestSession.count({ where: { expiresAt: { gt: now } } }),
      prisma.organization.count({
        where: { unlimitedUntil: { gt: now }, subscriptionPlanSlug: 'business' },
      }),
      prisma.resume.count(),
      prisma.resume.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.coverLetter.count(),
      prisma.coverLetter.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.pdfJob.count({ where: { status: 'completed' } }),
      prisma.ocrResult.count(),
      prisma.payment.aggregate({
        where: { status: 'PAID', paidAt: { gte: todayStart } },
        _sum: { amountXof: true },
      }),
      prisma.payment.aggregate({
        where: { status: 'PAID', paidAt: { gte: weekStart } },
        _sum: { amountXof: true },
      }),
      prisma.payment.aggregate({
        where: { status: 'PAID', paidAt: { gte: monthStart } },
        _sum: { amountXof: true },
      }),
      prisma.payment.aggregate({
        where: { status: 'PAID' },
        _sum: { amountXof: true },
      }),
      prisma.user.findMany({
        where: { createdAt: { gte: chartStart } },
        select: { createdAt: true },
      }),
      prisma.resume.findMany({
        where: { createdAt: { gte: chartStart } },
        select: { createdAt: true },
      }),
      prisma.coverLetter.findMany({
        where: { createdAt: { gte: chartStart } },
        select: { createdAt: true },
      }),
      prisma.payment.findMany({
        where: { paidAt: { gte: chartStart }, status: 'PAID' },
        select: { paidAt: true, amountXof: true, status: true },
      }),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: { id: true, firstName: true, lastName: true, email: true, createdAt: true },
      }),
      prisma.resume.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          title: true,
          fullName: true,
          createdAt: true,
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
      prisma.coverLetter.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          title: true,
          senderName: true,
          createdAt: true,
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
      prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          amountXof: true,
          status: true,
          planSlug: true,
          createdAt: true,
          paidAt: true,
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
      prisma.organization.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, subscriptionPlanSlug: true, createdAt: true },
      }),
      prisma.pdfJob.findMany({
        where: { status: 'completed' },
        orderBy: { completedAt: 'desc' },
        take: 5,
        select: { id: true, completedAt: true, createdAt: true },
      }),
    ])

    const paymentSeries = bucketPaymentsByDay(chartPayments, chartDays)

    const activity = [
      ...recentUsers.map((u) => ({
        id: `user-${u.id}`,
        type: 'signup' as const,
        message: `${formatPersonName(u)} s’est inscrit(e)`,
        at: u.createdAt.toISOString(),
      })),
      ...recentResumes.map((r) => ({
        id: `resume-${r.id}`,
        type: 'resume' as const,
        message: `${formatPersonName({ fullName: r.fullName, ...r.user })} a créé un CV`,
        at: r.createdAt.toISOString(),
      })),
      ...recentLetters.map((l) => ({
        id: `letter-${l.id}`,
        type: 'letter' as const,
        message: `${formatPersonName({ fullName: l.senderName, ...l.user })} a créé une lettre`,
        at: l.createdAt.toISOString(),
      })),
      ...recentPayments
        .filter((p) => p.status === 'PAID')
        .map((p) => ({
          id: `payment-${p.id}`,
          type: 'payment' as const,
          message: `${formatPersonName(p.user ?? {})} a payé ${p.amountXof.toLocaleString('fr-FR')} FCFA`,
          at: (p.paidAt ?? p.createdAt).toISOString(),
        })),
      ...recentOrganizations
        .filter((o) => o.subscriptionPlanSlug === 'business')
        .map((o) => ({
          id: `org-${o.id}`,
          type: 'organization' as const,
          message: `${o.name} a créé un compte Business`,
          at: o.createdAt.toISOString(),
        })),
      ...recentPdfJobs.map((j) => ({
        id: `pdf-${j.id}`,
        type: 'pdf' as const,
        message: 'Un PDF a été généré',
        at: (j.completedAt ?? j.createdAt).toISOString(),
      })),
    ]
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 15)

    const summary = {
      organizations: await prisma.organization.count(),
      users: totalUsers,
      paidPayments: await prisma.payment.count({ where: { status: 'PAID' } }),
      activeBusinessOrganizations,
    }

    return {
      summary,
      kpis: {
        users: { total: totalUsers, today: usersToday, activeGuests, businessOrgs: activeBusinessOrganizations },
        content: {
          resumes: totalResumes,
          resumesToday,
          letters: totalLetters,
          lettersToday,
          pdfGenerated,
          ocrImports,
        },
        revenue: {
          today: revenueToday._sum.amountXof ?? 0,
          week: revenueWeek._sum.amountXof ?? 0,
          month: revenueMonth._sum.amountXof ?? 0,
          total: revenueTotal._sum.amountXof ?? 0,
        },
      },
      charts: {
        signups: bucketByDay(chartUsers, chartDays),
        resumes: bucketByDay(chartResumes, chartDays),
        letters: bucketByDay(chartLetters, chartDays),
        payments: paymentSeries.map((p) => ({ date: p.date, value: p.count, amount: p.amount })),
      },
      activity,
    }
  }

  async listUsers(input: PaginationInput) {
    const page = input.page ?? 1
    const limit = input.limit ?? 20
    const q = input.q?.trim()
    const where = q
      ? {
          OR: [
            { email: { contains: q, mode: 'insensitive' as const } },
            { firstName: { contains: q, mode: 'insensitive' as const } },
            { lastName: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          creditsBalance: true,
          unlimitedUntil: true,
          subscriptionPlanSlug: true,
          createdAt: true,
          lastLoginAt: true,
          suspendedAt: true,
          _count: { select: { resumes: true, coverLetters: true, payments: true } },
        },
      }),
    ])

    return {
      data: users.map((u) => ({
        id: u.id,
        name: formatPersonName(u),
        email: u.email,
        country: null as string | null,
        createdAt: u.createdAt.toISOString(),
        lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
        resumeCount: u._count.resumes,
        letterCount: u._count.coverLetters,
        paymentCount: u._count.payments,
        status: u.suspendedAt
          ? 'suspended'
          : isSubscriptionActive(u.unlimitedUntil)
            ? 'premium'
            : u.creditsBalance > 0
              ? 'credits'
              : 'free',
        role: u.role,
        creditsBalance: u.creditsBalance,
        subscriptionPlanSlug: u.subscriptionPlanSlug,
      })),
      meta: paginationMeta(page, limit, total),
    }
  }

  async getUser(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        resumes: { orderBy: { updatedAt: 'desc' }, take: 20, select: { id: true, title: true, templateSlug: true, status: true, createdAt: true, updatedAt: true } },
        coverLetters: { orderBy: { updatedAt: 'desc' }, take: 20, select: { id: true, title: true, templateId: true, createdAt: true, updatedAt: true } },
        payments: { orderBy: { createdAt: 'desc' }, take: 20, select: { id: true, planSlug: true, amountXof: true, status: true, createdAt: true, paidAt: true } },
        orgMemberships: {
          include: { organization: { select: { id: true, name: true, subscriptionPlanSlug: true } } },
        },
      },
    })
    if (!user) throw new AppError(404, 'Not Found', 'Utilisateur introuvable')

    return {
      id: user.id,
      name: formatPersonName(user),
      email: user.email,
      role: user.role,
      creditsBalance: user.creditsBalance,
      unlimitedUntil: user.unlimitedUntil?.toISOString() ?? null,
      subscriptionPlanSlug: user.subscriptionPlanSlug,
      suspendedAt: user.suspendedAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      resumes: user.resumes.map((r) => ({ ...r, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() })),
      coverLetters: user.coverLetters.map((l) => ({ ...l, createdAt: l.createdAt.toISOString(), updatedAt: l.updatedAt.toISOString() })),
      payments: user.payments.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        paidAt: p.paidAt?.toISOString() ?? null,
      })),
      organizations: user.orgMemberships.map((m) => ({
        id: m.organization.id,
        name: m.organization.name,
        role: m.role,
        planSlug: m.organization.subscriptionPlanSlug,
      })),
    }
  }

  async updateUser(id: string, body: unknown) {
    const input = adminUpdateUserSchema.parse(body)
    const existing = await prisma.user.findUnique({ where: { id } })
    if (!existing) throw new AppError(404, 'Not Found', 'Utilisateur introuvable')
    await prisma.user.update({
      where: { id },
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        creditsBalance: input.creditsBalance,
        role: input.role,
        unlimitedUntil: input.unlimitedUntil === undefined
          ? undefined
          : input.unlimitedUntil
            ? new Date(input.unlimitedUntil)
            : null,
        subscriptionPlanSlug: input.subscriptionPlanSlug,
      },
    })
    return this.getUser(id)
  }

  async deleteUser(id: string) {
    const existing = await prisma.user.findUnique({ where: { id } })
    if (!existing) throw new AppError(404, 'Not Found', 'Utilisateur introuvable')
    if (existing.role === 'ADMIN') {
      throw new AppError(400, 'Bad Request', 'Impossible de supprimer un administrateur plateforme.')
    }
    await prisma.user.delete({ where: { id } })
    return { ok: true }
  }

  async listResumes(searchParams: URLSearchParams) {
    const parsed = parsePagination(searchParams)
    const page = parsed.page ?? 1
    const limit = parsed.limit ?? 20
    const q = parsed.q
    const template = searchParams.get('template') || undefined
    const guestOnly = searchParams.get('guest') === '1'
    const userOnly = searchParams.get('user') === '1'
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const where: Record<string, unknown> = {}
    if (template) where.templateSlug = template
    if (guestOnly) where.guestSessionId = { not: null }
    if (userOnly) where.userId = { not: null }
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: endOfDay(new Date(to)) } : {}),
      }
    }
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { fullName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ]
    }

    const [total, rows] = await Promise.all([
      prisma.resume.count({ where }),
      prisma.resume.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          fullName: true,
          templateSlug: true,
          status: true,
          userId: true,
          guestSessionId: true,
          createdAt: true,
          updatedAt: true,
          user: { select: { email: true, firstName: true, lastName: true } },
        },
      }),
    ])

    return {
      data: rows.map((r) => ({
        id: r.id,
        title: r.title,
        owner: formatPersonName({ fullName: r.fullName, ...r.user }),
        ownerEmail: r.user?.email ?? null,
        templateSlug: r.templateSlug,
        status: r.status,
        isGuest: Boolean(r.guestSessionId && !r.userId),
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      meta: paginationMeta(page, limit, total),
    }
  }

  async listCoverLetters(searchParams: URLSearchParams) {
    const parsed = parsePagination(searchParams)
    const page = parsed.page ?? 1
    const limit = parsed.limit ?? 20
    const q = parsed.q
    const template = searchParams.get('template') || undefined
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const where: Record<string, unknown> = {}
    if (template) where.templateId = template
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: endOfDay(new Date(to)) } : {}),
      }
    }
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { senderName: { contains: q, mode: 'insensitive' } },
        { companyName: { contains: q, mode: 'insensitive' } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
      ]
    }

    const [total, rows] = await Promise.all([
      prisma.coverLetter.count({ where }),
      prisma.coverLetter.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          senderName: true,
          templateId: true,
          createdAt: true,
          updatedAt: true,
          user: { select: { email: true, firstName: true, lastName: true } },
        },
      }),
    ])

    return {
      data: rows.map((l) => ({
        id: l.id,
        title: l.title,
        owner: formatPersonName({ fullName: l.senderName, ...l.user }),
        ownerEmail: l.user.email,
        templateId: l.templateId,
        createdAt: l.createdAt.toISOString(),
        updatedAt: l.updatedAt.toISOString(),
      })),
      meta: paginationMeta(page, limit, total),
    }
  }

  async listPdfJobs(searchParams: URLSearchParams) {
    const parsed = parsePagination(searchParams)
    const page = parsed.page ?? 1
    const limit = parsed.limit ?? 20
    const q = parsed.q
    const status = searchParams.get('status') || undefined

    const where: Record<string, unknown> = {}
    if (status) where.status = status

    const [total, rows] = await Promise.all([
      prisma.pdfJob.count({ where }),
      prisma.pdfJob.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          status: true,
          storageKey: true,
          resumeId: true,
          errorMessage: true,
          createdAt: true,
          completedAt: true,
          expiresAt: true,
        },
      }),
    ])

    return {
      data: rows.map((j) => ({
        id: j.id,
        owner: q ? null : null,
        resumeId: j.resumeId,
        sizeBytes: null as number | null,
        templateSlug: null as string | null,
        status: j.status,
        storageKey: j.storageKey,
        errorMessage: j.errorMessage,
        createdAt: j.createdAt.toISOString(),
        completedAt: j.completedAt?.toISOString() ?? null,
        expiresAt: j.expiresAt?.toISOString() ?? null,
      })),
      meta: paginationMeta(page, limit, total),
    }
  }

  async listPayments(searchParams: URLSearchParams) {
    const parsed = parsePagination(searchParams)
    const page = parsed.page ?? 1
    const limit = parsed.limit ?? 20
    const q = parsed.q
    const status = searchParams.get('status') as PaymentStatus | null
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const userId = searchParams.get('userId') || undefined

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (userId) where.userId = userId
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: endOfDay(new Date(to)) } : {}),
      }
    }
    if (q) {
      where.OR = [
        { providerRef: { contains: q, mode: 'insensitive' } },
        { planSlug: { contains: q, mode: 'insensitive' } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
      ]
    }

    const todayStart = startOfDay()
    const monthStart = startOfMonth()

    const [total, rows, summary] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          planSlug: true,
          amountXof: true,
          status: true,
          providerRef: true,
          paymentMethod: true,
          createdAt: true,
          paidAt: true,
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
      Promise.all([
        prisma.payment.aggregate({ where: { status: 'PAID' }, _sum: { amountXof: true } }),
        prisma.payment.aggregate({ where: { status: 'PAID', paidAt: { gte: todayStart } }, _sum: { amountXof: true } }),
        prisma.payment.aggregate({ where: { status: 'PAID', paidAt: { gte: monthStart } }, _sum: { amountXof: true } }),
        prisma.payment.count({ where: { status: 'PAID' } }),
        prisma.payment.count({ where: { status: 'FAILED' } }),
        prisma.payment.count({ where: { status: 'CANCELED' } }),
      ]),
    ])

    const [allRevenue, todayRevenue, monthRevenue, paidCount, failedCount, canceledCount] = summary

    return {
      summary: {
        totalRevenue: allRevenue._sum.amountXof ?? 0,
        todayRevenue: todayRevenue._sum.amountXof ?? 0,
        monthRevenue: monthRevenue._sum.amountXof ?? 0,
        paidCount,
        failedCount,
        refundsCount: canceledCount,
      },
      data: rows.map((p) => ({
        id: p.id,
        planSlug: p.planSlug,
        amountXof: p.amountXof,
        status: p.status,
        providerRef: p.providerRef,
        paymentMethod: p.paymentMethod,
        user: p.user
          ? { id: p.user.id, name: formatPersonName(p.user), email: p.user.email }
          : null,
        createdAt: p.createdAt.toISOString(),
        paidAt: p.paidAt?.toISOString() ?? null,
      })),
      meta: paginationMeta(page, limit, total),
    }
  }

  async getAnalytics() {
    const days90 = lastNDays(90)
    const start = days90[0]!
    const [users, payments, resumes, letters, pdfJobs, guestSessions, paidGuestPayments] = await Promise.all([
      prisma.user.findMany({ where: { createdAt: { gte: start } }, select: { createdAt: true } }),
      prisma.payment.findMany({
        where: { paidAt: { gte: start }, status: 'PAID' },
        select: { paidAt: true, amountXof: true, status: true },
      }),
      prisma.resume.findMany({ where: { createdAt: { gte: start } }, select: { createdAt: true } }),
      prisma.coverLetter.findMany({ where: { createdAt: { gte: start } }, select: { createdAt: true } }),
      prisma.pdfJob.findMany({
        where: { createdAt: { gte: start }, status: 'completed' },
        select: { createdAt: true },
      }),
      prisma.guestSession.count({ where: { createdAt: { gte: start } } }),
      prisma.payment.count({
        where: { status: 'PAID', guestSessionId: { not: null }, createdAt: { gte: start } },
      }),
    ])

    const revenueSeries = bucketPaymentsByDay(payments, days90)

    return {
      signups: bucketByDay(users, days90),
      revenue: revenueSeries.map((p) => ({ date: p.date, value: p.amount })),
      downloads: bucketByDay(pdfJobs.map((j) => ({ createdAt: j.createdAt })), days90),
      resumes: bucketByDay(resumes, days90),
      letters: bucketByDay(letters, days90),
      conversion: {
        visits: guestSessions,
        payments: paidGuestPayments,
        rate: guestSessions > 0 ? Math.round((paidGuestPayments / guestSessions) * 1000) / 10 : 0,
      },
    }
  }

  async getOcrStats() {
    const [totalDocuments, parsed, failed, processing, ocrResults, mimeGroups] = await Promise.all([
      prisma.document.count(),
      prisma.document.count({ where: { status: 'PARSED' } }),
      prisma.document.count({ where: { status: 'FAILED' } }),
      prisma.document.count({ where: { status: 'PROCESSING' } }),
      prisma.ocrResult.findMany({
        select: { confidence: true, processedAt: true, document: { select: { createdAt: true } } },
      }),
      prisma.document.groupBy({ by: ['mimeType'], _count: { _all: true } }),
    ])

    const successRate = totalDocuments > 0 ? Math.round((parsed / totalDocuments) * 1000) / 10 : 0
    const avgMs = ocrResults.length
      ? Math.round(
          ocrResults.reduce((acc, r) => acc + (r.processedAt.getTime() - r.document.createdAt.getTime()), 0)
            / ocrResults.length,
        )
      : 0

    return {
      analyzedFiles: ocrResults.length,
      totalDocuments,
      parsed,
      failed,
      processing,
      successRate,
      averageProcessingMs: avgMs,
      formats: mimeGroups
        .map((g) => ({ mimeType: g.mimeType, count: g._count._all }))
        .sort((a, b) => b.count - a.count),
      recentErrors: await prisma.document.findMany({
        where: { status: 'FAILED' },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        select: { id: true, originalName: true, mimeType: true, updatedAt: true },
      }).then((rows) =>
        rows.map((r) => ({
          id: r.id,
          name: r.originalName,
          mimeType: r.mimeType,
          at: r.updatedAt.toISOString(),
        })),
      ),
    }
  }

  async listTemplates() {
    const cvTemplates = await prisma.template.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] })
    const letterOverrides = await getPlatformSetting<Array<{ slug: string; isActive: boolean }>>('letter_templates')
    const overrideMap = new Map((letterOverrides ?? []).map((t) => [t.slug, t.isActive]))

    return {
      cv: cvTemplates.map((t) => ({
        id: t.id,
        slug: t.slug,
        name: t.name,
        category: t.category,
        description: t.description,
        previewUrl: t.previewUrl,
        isActive: t.isActive,
        sortOrder: t.sortOrder,
      })),
      letters: COVER_LETTER_TEMPLATES.map((t) => ({
        ...t,
        isActive: overrideMap.has(t.slug) ? overrideMap.get(t.slug)! : t.isActive,
      })),
    }
  }

  async updateTemplate(slug: string, body: unknown) {
    const input = adminUpdateTemplateSchema.parse(body)
    const existing = await prisma.template.findUnique({ where: { slug: slug as never } })
    if (!existing) throw new AppError(404, 'Not Found', 'Template introuvable')
    const updated = await prisma.template.update({
      where: { slug: slug as never },
      data: {
        name: input.name,
        description: input.description,
        isActive: input.isActive,
        sortOrder: input.sortOrder,
      },
    })
    return {
      id: updated.id,
      slug: updated.slug,
      name: updated.name,
      category: updated.category,
      description: updated.description,
      previewUrl: updated.previewUrl,
      isActive: updated.isActive,
      sortOrder: updated.sortOrder,
    }
  }

  async listPlans() {
    const overrides = await getPlatformSetting<Record<string, PlanOverride>>('plan_overrides') ?? {}
    return PLANS.map((plan) => {
      const override = overrides[plan.slug] ?? {}
      return {
        ...plan,
        priceXof: override.priceXof ?? plan.priceXof,
        description: override.description ?? plan.description,
        credits: Number.isFinite(plan.credits) ? plan.credits : null,
        active: override.active ?? true,
        editable: true,
      }
    })
  }

  async updatePlan(slug: string, body: unknown, actorId: string) {
    const plan = PLANS.find((p) => p.slug === slug)
    if (!plan) throw new AppError(404, 'Not Found', 'Offre introuvable')

    const input = adminUpdatePlanSchema.parse(body)
    const overrides = (await getPlatformSetting<Record<string, PlanOverride>>('plan_overrides')) ?? {}
    const current = overrides[slug] ?? {}
    overrides[slug] = {
      ...current,
      ...input,
    }
    await upsertPlatformSetting('plan_overrides', overrides)
    await logAdminAction({
      actorId,
      action: 'plan.update',
      targetType: 'plan',
      targetId: slug,
      metadata: input as Record<string, unknown>,
    })
    return (await this.listPlans()).find((p) => p.slug === slug)
  }

  async listEmailTemplates() {
    const rows = await prisma.emailTemplate.findMany({ orderBy: { slug: 'asc' } })
    if (rows.length === 0) {
      return EMAIL_TEMPLATES.map((t) => ({ ...t, editable: true }))
    }
    return rows.map((t) => ({
      slug: t.slug,
      name: t.name,
      description: t.description,
      subject: t.subject,
      bodyHtml: t.bodyHtml,
      bodyText: t.bodyText,
      isActive: t.isActive,
      updatedAt: t.updatedAt.toISOString(),
      editable: true,
    }))
  }

  async getEmailTemplate(slug: string) {
    const row = await prisma.emailTemplate.findUnique({ where: { slug } })
    if (!row) throw new AppError(404, 'Not Found', 'Template email introuvable')
    return {
      slug: row.slug,
      name: row.name,
      description: row.description,
      subject: row.subject,
      bodyHtml: row.bodyHtml,
      bodyText: row.bodyText,
      isActive: row.isActive,
      updatedAt: row.updatedAt.toISOString(),
    }
  }

  async updateEmailTemplate(slug: string, body: unknown, actorId: string) {
    const input = adminUpdateEmailTemplateSchema.parse(body)
    const existing = await prisma.emailTemplate.findUnique({ where: { slug } })
    if (!existing) throw new AppError(404, 'Not Found', 'Template email introuvable')

    const updated = await prisma.emailTemplate.update({
      where: { slug },
      data: {
        name: input.name,
        description: input.description,
        subject: input.subject,
        bodyHtml: input.bodyHtml,
        bodyText: input.bodyText,
        isActive: input.isActive,
      },
    })

    await logAdminAction({
      actorId,
      action: 'email_template.update',
      targetType: 'email_template',
      targetId: slug,
    })

    return this.getEmailTemplate(updated.slug)
  }

  async suspendUser(id: string, actorId: string) {
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) throw new AppError(404, 'Not Found', 'Utilisateur introuvable')
    if (user.role === 'ADMIN') throw new AppError(400, 'Bad Request', 'Impossible de suspendre un administrateur.')

    await prisma.user.update({ where: { id }, data: { suspendedAt: new Date() } })
    await logAdminAction({ actorId, action: 'user.suspend', targetType: 'user', targetId: id })
    return this.getUser(id)
  }

  async unsuspendUser(id: string, actorId: string) {
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) throw new AppError(404, 'Not Found', 'Utilisateur introuvable')

    await prisma.user.update({ where: { id }, data: { suspendedAt: null } })
    await logAdminAction({ actorId, action: 'user.unsuspend', targetType: 'user', targetId: id })
    return this.getUser(id)
  }

  async resetUserPassword(id: string, actorId: string) {
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) throw new AppError(404, 'Not Found', 'Utilisateur introuvable')

    const temporaryPassword = generateTempPassword()
    const passwordHash = await bcrypt.hash(temporaryPassword, 12)
    await prisma.user.update({ where: { id }, data: { passwordHash } })
    await logAdminAction({
      actorId,
      action: 'user.reset_password',
      targetType: 'user',
      targetId: id,
    })

    return { temporaryPassword, user: await this.getUser(id) }
  }

  async impersonateUser(id: string, actorId: string) {
    const target = await prisma.user.findUnique({ where: { id } })
    if (!target) throw new AppError(404, 'Not Found', 'Utilisateur introuvable')
    if (target.role === 'ADMIN') {
      throw new AppError(400, 'Bad Request', 'Impossible de se connecter en tant qu’un administrateur.')
    }

    const session = await authService.createSessionForUser(id, { impersonatedBy: actorId })
    await logAdminAction({
      actorId,
      action: 'user.impersonate',
      targetType: 'user',
      targetId: id,
    })
    return session
  }

  async sendNotification(body: unknown, actorId: string) {
    const input = adminSendNotificationSchema.parse(body)
    const audienceMap = { all: 'ALL', business: 'BUSINESS', premium: 'PREMIUM' } as const
    const audience = audienceMap[input.audience]
    const now = new Date()

    let recipientCount = 0
    if (audience === 'ALL') {
      recipientCount = await prisma.user.count({ where: { suspendedAt: null, role: 'USER' } })
    } else if (audience === 'BUSINESS') {
      recipientCount = await prisma.organizationMember.count({
        where: { organization: { subscriptionPlanSlug: 'business', unlimitedUntil: { gt: now } } },
      })
    } else {
      recipientCount = await prisma.user.count({
        where: {
          suspendedAt: null,
          OR: [
            { unlimitedUntil: { gt: now } },
            { subscriptionPlanSlug: { in: ['illimite', 'business'] } },
          ],
        },
      })
    }

    const notification = await prisma.platformNotification.create({
      data: {
        title: input.title,
        body: input.body,
        audience,
        recipientCount,
        sentAt: now,
        createdById: actorId,
      },
    })

    await logAdminAction({
      actorId,
      action: 'notification.send',
      targetType: 'notification',
      targetId: notification.id,
      metadata: { audience: input.audience, recipientCount },
    })

    return {
      id: notification.id,
      title: notification.title,
      body: notification.body,
      audience: input.audience,
      recipientCount,
      sentAt: notification.sentAt?.toISOString() ?? null,
    }
  }

  async listNotifications(limit = 20) {
    const rows = await prisma.platformNotification.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { createdBy: { select: { email: true, firstName: true, lastName: true } } },
    })
    return rows.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      audience: n.audience.toLowerCase(),
      recipientCount: n.recipientCount,
      sentAt: n.sentAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
      createdBy: formatPersonName(n.createdBy),
    }))
  }

  async globalSearch(q: string) {
    const term = q.trim()
    if (term.length < 2) {
      return { users: [], resumes: [], letters: [], payments: [], organizations: [], templates: [] }
    }

    const [users, resumes, letters, payments, organizations, templates] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: term, mode: 'insensitive' } },
            { firstName: { contains: term, mode: 'insensitive' } },
            { lastName: { contains: term, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, email: true, firstName: true, lastName: true },
      }),
      prisma.resume.findMany({
        where: {
          OR: [
            { title: { contains: term, mode: 'insensitive' } },
            { fullName: { contains: term, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, title: true, fullName: true },
      }),
      prisma.coverLetter.findMany({
        where: { title: { contains: term, mode: 'insensitive' } },
        take: 5,
        select: { id: true, title: true, senderName: true },
      }),
      prisma.payment.findMany({
        where: {
          OR: [
            { providerRef: { contains: term, mode: 'insensitive' } },
            { user: { email: { contains: term, mode: 'insensitive' } } },
          ],
        },
        take: 5,
        select: { id: true, providerRef: true, amountXof: true, status: true },
      }),
      prisma.organization.findMany({
        where: { name: { contains: term, mode: 'insensitive' } },
        take: 5,
        select: { id: true, name: true },
      }),
      prisma.template.findMany({
        where: { name: { contains: term, mode: 'insensitive' } },
        take: 5,
        select: { slug: true, name: true },
      }),
    ])

    return {
      users: users.map((u) => ({ id: u.id, label: formatPersonName(u), sublabel: u.email, href: `/admin/utilisateurs/${u.id}` })),
      resumes: resumes.map((r) => ({ id: r.id, label: r.title, sublabel: r.fullName, href: `/admin/cv?q=${r.id}` })),
      letters: letters.map((l) => ({ id: l.id, label: l.title, sublabel: l.senderName, href: `/admin/lettres?q=${l.id}` })),
      payments: payments.map((p) => ({ id: p.id, label: p.providerRef, sublabel: `${p.amountXof} FCFA · ${p.status}`, href: `/admin/paiements?q=${p.providerRef}` })),
      organizations: organizations.map((o) => ({ id: o.id, label: o.name, sublabel: 'Organisation', href: `/admin/organisations/${o.id}` })),
      templates: templates.map((t) => ({ id: t.slug, label: t.name, sublabel: 'Template CV', href: `/admin/templates?slug=${t.slug}` })),
    }
  }

  async getLogs(searchParams: URLSearchParams) {
    const parsed = parsePagination(searchParams)
    const page = parsed.page ?? 1
    const limit = parsed.limit ?? 20
    const q = parsed.q
    const type = searchParams.get('type') || 'all'

    type LogRow = { id: string; type: string; message: string; at: string; meta?: string }

    const rows: LogRow[] = []

    if (type === 'all' || type === 'payments') {
      const payments = await prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: { id: true, status: true, amountXof: true, planSlug: true, createdAt: true, user: { select: { email: true } } },
      })
      rows.push(
        ...payments.map((p) => ({
          id: `payment-${p.id}`,
          type: 'payment',
          message: `Paiement ${p.status.toLowerCase()} · ${p.planSlug} · ${p.amountXof} FCFA`,
          meta: p.user?.email ?? undefined,
          at: p.createdAt.toISOString(),
        })),
      )
    }

    if (type === 'all' || type === 'downloads') {
      const jobs = await prisma.pdfJob.findMany({
        where: { status: 'completed' },
        orderBy: { completedAt: 'desc' },
        take: 20,
        select: { id: true, completedAt: true, createdAt: true },
      })
      rows.push(
        ...jobs.map((j) => ({
          id: `pdf-${j.id}`,
          type: 'download',
          message: 'PDF généré',
          at: (j.completedAt ?? j.createdAt).toISOString(),
        })),
      )
    }

    if (type === 'all' || type === 'errors') {
      const docs = await prisma.document.findMany({
        where: { status: 'FAILED' },
        orderBy: { updatedAt: 'desc' },
        take: 20,
        select: { id: true, originalName: true, updatedAt: true },
      })
      rows.push(
        ...docs.map((d) => ({
          id: `doc-${d.id}`,
          type: 'error',
          message: `Échec document · ${d.originalName}`,
          at: d.updatedAt.toISOString(),
        })),
      )
    }

    if (type === 'all' || type === 'ocr') {
      const ocrs = await prisma.ocrResult.findMany({
        orderBy: { processedAt: 'desc' },
        take: 20,
        select: { id: true, confidence: true, processedAt: true, document: { select: { originalName: true } } },
      })
      rows.push(
        ...ocrs.map((o) => ({
          id: `ocr-${o.id}`,
          type: 'ocr',
          message: `OCR · ${o.document.originalName}${o.confidence != null ? ` · ${Math.round(o.confidence * 100)}%` : ''}`,
          at: o.processedAt.toISOString(),
        })),
      )
    }

    if (type === 'all' || type === 'connections') {
      const users = await prisma.user.findMany({
        where: { lastLoginAt: { not: null } },
        orderBy: { lastLoginAt: 'desc' },
        take: 20,
        select: { id: true, email: true, lastLoginAt: true },
      })
      rows.push(
        ...users.map((u) => ({
          id: `login-${u.id}`,
          type: 'connection',
          message: `Connexion · ${u.email}`,
          at: u.lastLoginAt!.toISOString(),
        })),
      )
    }

    if (type === 'all' || type === 'admin') {
      const audits = await prisma.adminAuditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 30,
        include: { actor: { select: { email: true } } },
      })
      rows.push(
        ...audits.map((a) => ({
          id: `admin-${a.id}`,
          type: 'admin',
          message: `Admin · ${a.action}${a.targetId ? ` · ${a.targetId}` : ''}`,
          meta: a.actor.email,
          at: a.createdAt.toISOString(),
        })),
      )
    }

    const filtered = q
      ? rows.filter((r) => r.message.toLowerCase().includes(q.toLowerCase()) || r.meta?.toLowerCase().includes(q.toLowerCase()))
      : rows

    filtered.sort((a, b) => b.at.localeCompare(a.at))
    const total = filtered.length
    const start = (page - 1) * limit
    const data = filtered.slice(start, start + limit)

    return { data, meta: paginationMeta(page, limit, total) }
  }

  async getPlatformHealth() {
    const pdfRender = await checkPdfRenderReadiness()
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      pdfRender,
      payments: {
        paytechConfigured: Boolean(process.env.PAYTECH_API_KEY?.trim() && process.env.PAYTECH_API_SECRET?.trim()),
        publicAppUrl: process.env.PUBLIC_APP_URL ?? null,
        paytechEnv: process.env.PAYTECH_ENV ?? null,
        ipnConfigured: Boolean(process.env.PAYTECH_IPN_URL?.trim()),
      },
      database: { connected: true },
      storage: { configured: Boolean(process.env.S3_BUCKET?.trim() || process.env.R2_BUCKET?.trim()) },
      ai: { configured: Boolean(process.env.OPENAI_API_KEY?.trim()) },
      ocr: { provider: 'tesseract', configured: true },
      smtp: { configured: Boolean(process.env.SMTP_HOST?.trim()) },
    }
  }

  async getPlatformSettings() {
    const stored = await listPlatformSettings()
    const branding = (stored.branding ?? {}) as { appName?: string; logoUrl?: string }
    const seo = (stored.seo ?? {}) as { title?: string; description?: string }

    return {
      branding: {
        appName: branding.appName ?? "Profilo'Z",
        logoUrl: branding.logoUrl ?? '/logo.png',
        editable: true,
      },
      seo: {
        title: seo.title ?? "Profilo'Z | Créateur de CV professionnel",
        description: seo.description ?? 'Créez un CV professionnel en quelques minutes.',
        editable: true,
      },
      smtp: {
        host: process.env.SMTP_HOST ? '***' : null,
        configured: Boolean(process.env.SMTP_HOST?.trim()),
        editable: false,
      },
      paytech: {
        env: process.env.PAYTECH_ENV ?? null,
        configured: Boolean(process.env.PAYTECH_API_KEY?.trim()),
        editable: false,
      },
      ai: {
        provider: 'openai',
        configured: Boolean(process.env.OPENAI_API_KEY?.trim()),
        editable: false,
      },
      ocr: { provider: 'tesseract', editable: false },
      storage: {
        provider: process.env.S3_BUCKET ? 's3' : process.env.R2_BUCKET ? 'r2' : 'local',
        editable: false,
      },
      pdf: { engine: 'puppeteer', editable: false },
      publicVars: {
        PUBLIC_APP_URL: process.env.PUBLIC_APP_URL ?? null,
        NUXT_PUBLIC_API_BASE_URL: process.env.NUXT_PUBLIC_API_BASE_URL ?? null,
      },
      letterTemplates: (stored.letter_templates as unknown) ?? null,
      note: 'Logo, SEO et modèles lettres sont persistés en base. SMTP, PayTech et clés API restent dans l’environnement.',
    }
  }

  async updatePlatformSettings(body: unknown, actorId: string) {
    const input = adminUpdatePlatformSettingsSchema.parse(body)

    if (input.branding) {
      const current = (await getPlatformSetting<Record<string, unknown>>('branding')) ?? {}
      await upsertPlatformSetting('branding', { ...current, ...input.branding })
    }
    if (input.seo) {
      const current = (await getPlatformSetting<Record<string, unknown>>('seo')) ?? {}
      await upsertPlatformSetting('seo', { ...current, ...input.seo })
    }
    if (input.letterTemplates) {
      await upsertPlatformSetting('letter_templates', input.letterTemplates)
    }

    await logAdminAction({
      actorId,
      action: 'platform_settings.update',
      targetType: 'platform_settings',
      metadata: input as Record<string, unknown>,
    })

    return this.getPlatformSettings()
  }

  async listOrganizations() {
    const organizations = await prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        members: {
          select: { id: true, role: true, user: { select: { firstName: true, lastName: true, email: true } } },
        },
        _count: {
          select: {
            resumes: true,
            documents: true,
            coverLetters: true,
          },
        },
      },
    })

    return organizations.map((org) => ({
      id: org.id,
      name: org.name,
      type: org.type,
      unlimitedUntil: org.unlimitedUntil?.toISOString() ?? null,
      subscriptionPlanSlug: org.subscriptionPlanSlug,
      subscriptionActive: isSubscriptionActive(org.unlimitedUntil),
      createdAt: org.createdAt.toISOString(),
      memberCount: org.members.length,
      resumeCount: org._count.resumes,
      documentCount: org._count.documents,
      letterCount: org._count.coverLetters,
      adminName: formatPersonName(
        org.members.find((m) => m.role === 'OWNER')?.user
        ?? org.members[0]?.user
        ?? { email: '—' },
      ),
      creditsRemaining: null as number | null,
    }))
  }

  async getOrganization(id: string) {
    const org = await organizationRepository.findOrganizationById(id)
    if (!org) throw new AppError(404, 'Not Found', 'Organisation introuvable')

    const [resumes, documents, letters] = await Promise.all([
      prisma.resume.count({ where: { organizationId: id } }),
      prisma.document.count({ where: { organizationId: id } }),
      prisma.coverLetter.count({ where: { organizationId: id } }),
    ])

    return toAdminOrganizationDto(org, {
      resumes,
      documents,
      letters,
    })
  }

  async updateOrganization(id: string, body: unknown) {
    const input = adminUpdateOrganizationSchema.parse(body)
    const existing = await organizationRepository.findOrganizationById(id)
    if (!existing) throw new AppError(404, 'Not Found', 'Organisation introuvable')

    const data: {
      name?: string
      type?: OrganizationType
      unlimitedUntil?: Date | null
      subscriptionPlanSlug?: string | null
    } = {}

    if (input.name !== undefined) data.name = input.name
    if (input.type !== undefined) data.type = input.type
    if (input.unlimitedUntil !== undefined) {
      data.unlimitedUntil = input.unlimitedUntil ? new Date(input.unlimitedUntil) : null
    }
    if (input.subscriptionPlanSlug !== undefined) {
      data.subscriptionPlanSlug = input.subscriptionPlanSlug
    }

    await prisma.organization.update({ where: { id }, data })
    return this.getOrganization(id)
  }

  async removeMember(organizationId: string, userId: string) {
    const org = await organizationRepository.findOrganizationById(organizationId)
    if (!org) throw new AppError(404, 'Not Found', 'Organisation introuvable')

    const member = await organizationRepository.findMember(organizationId, userId)
    if (!member) throw new AppError(404, 'Not Found', 'Membre introuvable')
    if (member.role === 'OWNER') {
      throw new AppError(400, 'Bad Request', 'Impossible de retirer le propriétaire de l’organisation.')
    }

    await organizationRepository.removeMember(organizationId, userId)
    return this.getOrganization(organizationId)
  }
}

export const adminService = new AdminService()
