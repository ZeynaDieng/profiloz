import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export class CoverLetterRepository {
  listByUser(userId: string) {
    return prisma.coverLetter.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        companyName: true,
        position: true,
        resumeId: true,
        templateId: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }

  findById(id: string, userId: string) {
    return prisma.coverLetter.findFirst({
      where: { id, userId },
    })
  }

  listByResume(resumeId: string, userId: string) {
    return prisma.coverLetter.findMany({
      where: { userId, resumeId },
      orderBy: { createdAt: 'asc' },
    })
  }

  create(userId: string, data: Omit<Prisma.CoverLetterCreateInput, 'user'>) {
    return prisma.coverLetter.create({
      data: {
        ...data,
        user: { connect: { id: userId } },
      },
    })
  }

  update(id: string, userId: string, data: Prisma.CoverLetterUpdateInput) {
    return prisma.coverLetter.updateMany({
      where: { id, userId },
      data,
    })
  }

  delete(id: string, userId: string) {
    return prisma.coverLetter.deleteMany({
      where: { id, userId },
    })
  }
}

export const coverLetterRepository = new CoverLetterRepository()
