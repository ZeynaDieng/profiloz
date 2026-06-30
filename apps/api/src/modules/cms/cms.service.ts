import {
  adminBlogPostSchema,
  adminFaqItemSchema,
  adminFaqReorderSchema,
  adminLandingSectionSchema,
  adminUpdateBlogPostSchema,
} from '@profiloz/validators'
import type { BlogPostStatus, Prisma } from '@prisma/client'
import { AppError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/modules/admin/admin-audit.service'
import { paginationMeta, parsePagination } from '@/modules/admin/admin.utils'

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
}

function mapBlogStatus(status?: string): BlogPostStatus {
  if (status === 'published') return 'PUBLISHED'
  if (status === 'scheduled') return 'SCHEDULED'
  return 'DRAFT'
}

function toPublicBlogStatus(status: BlogPostStatus) {
  return status.toLowerCase()
}

export class CmsService {
  async listFaqItems(locale = 'fr-FR', includeInactive = false) {
    const rows = await prisma.faqItem.findMany({
      where: {
        locale,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })
    return rows.map((row) => ({
      id: row.id,
      question: row.question,
      answer: row.answer,
      sortOrder: row.sortOrder,
      locale: row.locale,
      isActive: row.isActive,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }))
  }

  async createFaqItem(body: unknown, actorId: string) {
    const input = adminFaqItemSchema.parse(body)
    const maxOrder = await prisma.faqItem.aggregate({
      where: { locale: input.locale ?? 'fr-FR' },
      _max: { sortOrder: true },
    })
    const row = await prisma.faqItem.create({
      data: {
        question: input.question,
        answer: input.answer,
        sortOrder: input.sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1,
        locale: input.locale ?? 'fr-FR',
        isActive: input.isActive ?? true,
      },
    })
    await logAdminAction({
      actorId,
      action: 'faq.create',
      targetType: 'faq_item',
      targetId: row.id,
    })
    return row
  }

  async updateFaqItem(id: string, body: unknown, actorId: string) {
    const input = adminFaqItemSchema.partial().parse(body)
    const existing = await prisma.faqItem.findUnique({ where: { id } })
    if (!existing) throw new AppError(404, 'Not Found', 'Question FAQ introuvable')
    const row = await prisma.faqItem.update({
      where: { id },
      data: {
        question: input.question,
        answer: input.answer,
        sortOrder: input.sortOrder,
        locale: input.locale,
        isActive: input.isActive,
      },
    })
    await logAdminAction({
      actorId,
      action: 'faq.update',
      targetType: 'faq_item',
      targetId: id,
    })
    return row
  }

  async deleteFaqItem(id: string, actorId: string) {
    const existing = await prisma.faqItem.findUnique({ where: { id } })
    if (!existing) throw new AppError(404, 'Not Found', 'Question FAQ introuvable')
    await prisma.faqItem.delete({ where: { id } })
    await logAdminAction({
      actorId,
      action: 'faq.delete',
      targetType: 'faq_item',
      targetId: id,
    })
    return { ok: true }
  }

  async reorderFaqItems(body: unknown, actorId: string) {
    const input = adminFaqReorderSchema.parse(body)
    await prisma.$transaction(
      input.items.map((item) =>
        prisma.faqItem.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    )
    await logAdminAction({
      actorId,
      action: 'faq.reorder',
      targetType: 'faq_item',
      metadata: { count: input.items.length },
    })
    return { ok: true }
  }

  async listLandingSections(locale = 'fr-FR') {
    const rows = await prisma.landingSection.findMany({
      where: { locale },
      orderBy: { key: 'asc' },
    })
    return rows.map((row) => ({
      id: row.id,
      key: row.key,
      locale: row.locale,
      content: row.content,
      isActive: row.isActive,
      updatedAt: row.updatedAt.toISOString(),
    }))
  }

  async getLandingSection(key: string, locale = 'fr-FR') {
    const row = await prisma.landingSection.findUnique({
      where: { key_locale: { key, locale } },
    })
    if (!row) throw new AppError(404, 'Not Found', 'Section landing introuvable')
    return {
      id: row.id,
      key: row.key,
      locale: row.locale,
      content: row.content,
      isActive: row.isActive,
      updatedAt: row.updatedAt.toISOString(),
    }
  }

  async updateLandingSection(key: string, body: unknown, actorId: string, locale = 'fr-FR') {
    const input = adminLandingSectionSchema.parse(body)
    const row = await prisma.landingSection.upsert({
      where: { key_locale: { key, locale } },
      create: {
        key,
        locale,
        content: input.content as Prisma.InputJsonValue,
        isActive: input.isActive ?? true,
      },
      update: {
        content: input.content as Prisma.InputJsonValue,
        isActive: input.isActive,
      },
    })
    await logAdminAction({
      actorId,
      action: 'landing.update',
      targetType: 'landing_section',
      targetId: row.id,
      metadata: { key },
    })
    return {
      id: row.id,
      key: row.key,
      locale: row.locale,
      content: row.content,
      isActive: row.isActive,
      updatedAt: row.updatedAt.toISOString(),
    }
  }

  async getPublicLanding(locale = 'fr-FR') {
    const [sections, faq] = await Promise.all([
      prisma.landingSection.findMany({
        where: { locale, isActive: true },
      }),
      this.listFaqItems(locale, false),
    ])
    const content: Record<string, unknown> = {}
    for (const section of sections) {
      content[section.key] = section.content
    }
    return { locale, sections: content, faq }
  }

  async listBlogPosts(searchParams: URLSearchParams) {
    const parsed = parsePagination(searchParams)
    const page = parsed.page ?? 1
    const limit = parsed.limit ?? 20
    const q = parsed.q
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (status) where.status = mapBlogStatus(status)
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
        { excerpt: { contains: q, mode: 'insensitive' } },
      ]
    }

    const [total, rows] = await Promise.all([
      prisma.blogPost.count({ where }),
      prisma.blogPost.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { coverMedia: { select: { id: true, publicUrl: true, filename: true } } },
      }),
    ])

    return {
      data: rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        title: row.title,
        excerpt: row.excerpt,
        status: toPublicBlogStatus(row.status),
        publishedAt: row.publishedAt?.toISOString() ?? null,
        coverMedia: row.coverMedia,
        updatedAt: row.updatedAt.toISOString(),
      })),
      meta: paginationMeta(page, limit, total),
    }
  }

  async getBlogPost(id: string) {
    const row = await prisma.blogPost.findUnique({
      where: { id },
      include: { coverMedia: true },
    })
    if (!row) throw new AppError(404, 'Not Found', 'Article introuvable')
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      content: row.content,
      status: toPublicBlogStatus(row.status),
      publishedAt: row.publishedAt?.toISOString() ?? null,
      seoTitle: row.seoTitle,
      seoDescription: row.seoDescription,
      coverMediaId: row.coverMediaId,
      coverMedia: row.coverMedia,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }
  }

  async getBlogPostBySlug(slug: string) {
    const row = await prisma.blogPost.findUnique({
      where: { slug },
      include: { coverMedia: true },
    })
    if (!row || row.status !== 'PUBLISHED') {
      throw new AppError(404, 'Not Found', 'Article introuvable')
    }
    return {
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      content: row.content,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      seoTitle: row.seoTitle,
      seoDescription: row.seoDescription,
      coverMedia: row.coverMedia,
    }
  }

  async listPublicBlogPosts(limit = 20) {
    const rows = await prisma.blogPost.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
      },
      orderBy: [{ publishedAt: 'desc' }, { updatedAt: 'desc' }],
      take: limit,
      include: { coverMedia: { select: { id: true, publicUrl: true, alt: true } } },
    })
    return rows.map((row) => ({
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      publishedAt: row.publishedAt?.toISOString() ?? row.updatedAt.toISOString(),
      coverMedia: row.coverMedia,
    }))
  }

  async createBlogPost(body: unknown, actorId: string) {
    const input = adminBlogPostSchema.parse(body)
    const slug = input.slug || slugify(input.title)
    const status = mapBlogStatus(input.status)
    const row = await prisma.blogPost.create({
      data: {
        slug,
        title: input.title,
        excerpt: input.excerpt ?? null,
        content: input.content,
        coverMediaId: input.coverMediaId ?? null,
        status,
        publishedAt: input.publishedAt ? new Date(input.publishedAt) : status === 'PUBLISHED' ? new Date() : null,
        seoTitle: input.seoTitle ?? null,
        seoDescription: input.seoDescription ?? null,
      },
    })
    await logAdminAction({
      actorId,
      action: 'blog.create',
      targetType: 'blog_post',
      targetId: row.id,
    })
    return this.getBlogPost(row.id)
  }

  async updateBlogPost(id: string, body: unknown, actorId: string) {
    const input = adminUpdateBlogPostSchema.parse(body)
    const existing = await prisma.blogPost.findUnique({ where: { id } })
    if (!existing) throw new AppError(404, 'Not Found', 'Article introuvable')

    const status = input.status ? mapBlogStatus(input.status) : undefined
    await prisma.blogPost.update({
      where: { id },
      data: {
        title: input.title,
        excerpt: input.excerpt,
        content: input.content,
        coverMediaId: input.coverMediaId,
        status,
        publishedAt: input.publishedAt === undefined
          ? status === 'PUBLISHED' && !existing.publishedAt
            ? new Date()
            : undefined
          : input.publishedAt
            ? new Date(input.publishedAt)
            : null,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
      },
    })
    await logAdminAction({
      actorId,
      action: 'blog.update',
      targetType: 'blog_post',
      targetId: id,
    })
    return this.getBlogPost(id)
  }

  async deleteBlogPost(id: string, actorId: string) {
    const existing = await prisma.blogPost.findUnique({ where: { id } })
    if (!existing) throw new AppError(404, 'Not Found', 'Article introuvable')
    await prisma.blogPost.delete({ where: { id } })
    await logAdminAction({
      actorId,
      action: 'blog.delete',
      targetType: 'blog_post',
      targetId: id,
    })
    return { ok: true }
  }
}

export const cmsService = new CmsService()
