import type { ResumeSnapshot, TemplateSlug } from '@profiloz/shared'
import type { Prisma, TemplateSlug as PrismaTemplateSlug } from '@prisma/client'
import { prisma } from '@/lib/prisma'

function parseFlexibleDate(value?: string) {
  if (!value || value.toLowerCase() === 'present' || value.toLowerCase() === 'présent') return undefined
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

function formatFlexibleDate(value?: Date | null) {
  if (!value) return undefined
  return value.getFullYear().toString()
}

function snapshotRelationData(snapshot: ResumeSnapshot) {
  return {
    experiences: {
      create: snapshot.experiences.map((e, i) => ({
        company: e.company,
        position: e.position,
        location: e.location,
        country: e.country,
        startDate: parseFlexibleDate(e.startDate),
        endDate: parseFlexibleDate(e.endDate),
        isCurrent: e.isCurrent ?? false,
        description: e.description,
        skillsUsed: e.skillsUsed ?? [],
        sortOrder: i,
      })),
    },
    educations: {
      create: snapshot.educations.map((e, i) => ({
        institution: e.institution,
        degree: e.degree,
        field: e.field,
        location: e.location,
        startDate: parseFlexibleDate(e.startDate),
        endDate: parseFlexibleDate(e.endDate),
        description: e.description,
        sortOrder: i,
      })),
    },
    skills: {
      create: snapshot.skills.map((s, i) => ({
        name: s.name,
        level: s.level ?? 'INTERMEDIATE',
        category: s.category,
        sortOrder: i,
      })),
    },
    certifications: {
      create: snapshot.certifications.map((c, i) => ({
        name: c.name,
        issuer: c.issuer,
        credentialId: c.credentialId,
        sortOrder: i,
      })),
    },
    interests: {
      create: snapshot.interests.map((item, i) => ({ name: item.name, sortOrder: i })),
    },
    languages: {
      create: snapshot.languages.map((l, i) => ({
        name: l.name,
        level: l.level ?? 'CONVERSATIONAL',
        sortOrder: i,
      })),
    },
  }
}

function snapshotScalarData(snapshot: ResumeSnapshot) {
  return {
    title: snapshot.title,
    templateSlug: snapshot.templateSlug as PrismaTemplateSlug,
    templateConfig: snapshot.templateConfig as Prisma.InputJsonValue,
    fullName: snapshot.personalInfo.fullName,
    email: snapshot.personalInfo.email,
    phone: snapshot.personalInfo.phone,
    location: snapshot.personalInfo.location,
    jobTitle: snapshot.personalInfo.jobTitle,
    linkedinUrl: snapshot.personalInfo.linkedinUrl,
    websiteUrl: snapshot.personalInfo.websiteUrl,
    photoUrl: snapshot.personalInfo.photoUrl,
    summary: snapshot.summary,
    completeness: snapshot.metadata.completeness,
  }
}

export class ResumeRepository {
  createFromSnapshot(snapshot: ResumeSnapshot, userId?: string, guestSessionId?: string) {
    return prisma.resume.create({
      data: {
        userId,
        guestSessionId,
        ...snapshotScalarData(snapshot),
        ...snapshotRelationData(snapshot),
      },
      include: {
        experiences: true,
        educations: true,
        skills: true,
        certifications: true,
        interests: true,
        languages: true,
      },
    })
  }

  async updateFromSnapshot(id: string, userId: string, snapshot: ResumeSnapshot) {
    const existing = await prisma.resume.findFirst({ where: { id, userId } })
    if (!existing) return null

    return prisma.$transaction(async (tx) => {
      await tx.experience.deleteMany({ where: { resumeId: id } })
      await tx.education.deleteMany({ where: { resumeId: id } })
      await tx.skill.deleteMany({ where: { resumeId: id } })
      await tx.certification.deleteMany({ where: { resumeId: id } })
      await tx.interest.deleteMany({ where: { resumeId: id } })
      await tx.language.deleteMany({ where: { resumeId: id } })

      return tx.resume.update({
        where: { id },
        data: {
          ...snapshotScalarData(snapshot),
          ...snapshotRelationData(snapshot),
        },
        include: {
          experiences: { orderBy: { sortOrder: 'asc' } },
          educations: { orderBy: { sortOrder: 'asc' } },
          skills: { orderBy: { sortOrder: 'asc' } },
          certifications: { orderBy: { sortOrder: 'asc' } },
          interests: { orderBy: { sortOrder: 'asc' } },
          languages: { orderBy: { sortOrder: 'asc' } },
        },
      })
    })
  }

  async duplicate(id: string, userId: string) {
    const source = await this.findById(id, userId)
    if (!source) return null

    const snapshot = resumeEntityToSnapshot(source)
    snapshot.title = `${snapshot.title} (copie)`
    return this.createFromSnapshot(snapshot, userId)
  }

  updateTitle(id: string, userId: string, title: string) {
    return prisma.resume.updateMany({
      where: { id, userId },
      data: { title },
    })
  }

  archive(id: string, userId: string) {
    return prisma.resume.updateMany({
      where: { id, userId },
      data: { status: 'ARCHIVED' },
    })
  }

  listByUser(userId: string) {
    return prisma.resume.findMany({
      where: { userId, status: { not: 'ARCHIVED' } },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        templateSlug: true,
        completeness: true,
        fullName: true,
        jobTitle: true,
        updatedAt: true,
      },
    })
  }

  findById(id: string, userId?: string) {
    return prisma.resume.findFirst({
      where: { id, ...(userId ? { userId } : {}) },
      include: {
        experiences: { orderBy: { sortOrder: 'asc' } },
        educations: { orderBy: { sortOrder: 'asc' } },
        skills: { orderBy: { sortOrder: 'asc' } },
        certifications: { orderBy: { sortOrder: 'asc' } },
        interests: { orderBy: { sortOrder: 'asc' } },
        languages: { orderBy: { sortOrder: 'asc' } },
      },
    })
  }
}

export const resumeRepository = new ResumeRepository()

export function resumeEntityToSnapshot(resume: NonNullable<Awaited<ReturnType<ResumeRepository['findById']>>>): ResumeSnapshot {
  return {
    id: resume.id,
    title: resume.title,
    templateSlug: resume.templateSlug as TemplateSlug,
    templateConfig: (resume.templateConfig as ResumeSnapshot['templateConfig']) ?? {},
    personalInfo: {
      fullName: resume.fullName ?? undefined,
      email: resume.email ?? undefined,
      phone: resume.phone ?? undefined,
      location: resume.location ?? undefined,
      jobTitle: resume.jobTitle ?? undefined,
      linkedinUrl: resume.linkedinUrl ?? undefined,
      websiteUrl: resume.websiteUrl ?? undefined,
      photoUrl: resume.photoUrl ?? undefined,
    },
    summary: resume.summary ?? undefined,
    experiences: resume.experiences.map((e) => ({
      id: e.id,
      company: e.company,
      position: e.position,
      location: e.location ?? undefined,
      country: e.country ?? undefined,
      startDate: formatFlexibleDate(e.startDate),
      endDate: formatFlexibleDate(e.endDate),
      isCurrent: e.isCurrent,
      description: e.description ?? undefined,
      skillsUsed: e.skillsUsed?.length ? e.skillsUsed : undefined,
    })),
    educations: resume.educations.map((e) => ({
      id: e.id,
      institution: e.institution,
      degree: e.degree,
      field: e.field ?? undefined,
      location: e.location ?? undefined,
      startDate: formatFlexibleDate(e.startDate),
      endDate: formatFlexibleDate(e.endDate),
      description: e.description ?? undefined,
    })),
    skills: resume.skills.map((s) => ({ id: s.id, name: s.name, level: s.level, category: s.category ?? undefined })),
    certifications: resume.certifications.map((c) => ({
      id: c.id,
      name: c.name,
      issuer: c.issuer ?? undefined,
      credentialId: c.credentialId ?? undefined,
    })),
    interests: resume.interests.map((i) => ({ id: i.id, name: i.name })),
    languages: resume.languages.map((l) => ({ id: l.id, name: l.name, level: l.level })),
    metadata: {
      completeness: resume.completeness,
      lastModified: resume.updatedAt.toISOString(),
      source: 'manual',
    },
  }
}
