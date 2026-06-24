import { prisma } from '@/lib/prisma'

export class TemplateRepository {
  findAll(category?: string) {
    return prisma.template.findMany({
      where: {
        isActive: true,
        ...(category ? { category } : {}),
      },
      orderBy: { sortOrder: 'asc' },
    })
  }

  findBySlug(slug: string) {
    return prisma.template.findUnique({ where: { slug: slug as never } })
  }
}

export const templateRepository = new TemplateRepository()
