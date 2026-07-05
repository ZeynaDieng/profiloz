import bcrypt from 'bcryptjs'
import jwt, { type SignOptions } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import type { LoginInput, RegisterInput } from '@profiloz/validators'
import { guestSessionRepository } from '@/modules/guest/guest.repository'
import { paymentService } from '@/modules/payment/payment.service'
import { resumeService } from '@/modules/resume/resume.service'
import { ensurePlatformOwnerRole } from '@/lib/platform-admin'
import { sendEmailTemplate } from '@/lib/email/mail.service'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '15m'
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d'

export class AuthRepository {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } })
  }

  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true, firstName: true, lastName: true },
    })
  }

  createUser(data: { email: string; passwordHash: string }) {
    return prisma.user.create({ data })
  }

  createRefreshToken(userId: string, token: string, expiresAt: Date) {
    return prisma.refreshToken.create({ data: { userId, token, expiresAt } })
  }

  findRefreshToken(token: string) {
    return prisma.refreshToken.findUnique({ where: { token }, include: { user: true } })
  }

  deleteRefreshToken(token: string) {
    return prisma.refreshToken.delete({ where: { token } })
  }
}

export const authRepository = new AuthRepository()

export class AuthService {
  private signAccessToken(userId: string, email: string) {
    const options: SignOptions = { expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'] }
    return jwt.sign({ sub: userId, email }, JWT_SECRET, options)
  }

  private async createRefreshToken(userId: string) {
    const token = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)
    await authRepository.createRefreshToken(userId, token, expiresAt)
    return token
  }

  async register(input: RegisterInput) {
    const existing = await authRepository.findByEmail(input.email)
    if (existing) {
      throw new Error('EMAIL_EXISTS')
    }

    const passwordHash = await bcrypt.hash(input.password, 12)
    const user = await authRepository.createUser({ email: input.email, passwordHash })
    await ensurePlatformOwnerRole(user.id, user.email)
    const refreshed = await authRepository.findById(user.id)

    let migratedResumeId: string | undefined
    if (input.guestSessionId && input.resumeSnapshot) {
      try {
        const migrated = await resumeService.migrate(user.id, {
          guestSessionId: input.guestSessionId,
          resumeSnapshot: input.resumeSnapshot,
        })
        migratedResumeId = migrated.migratedResumeId
      } catch (error) {
        console.warn('Guest resume migration failed during registration:', error)
      }
    }

    // Migration des droits invités (crédits, abonnement, dossiers persistés, paiements).
    if (input.guestSessionId) {
      try {
        const guest = await guestSessionRepository.findBySessionId(input.guestSessionId)
        if (guest) await paymentService.migrateGuestToUser(user.id, guest.id)
      } catch (error) {
        console.warn('Guest entitlements migration failed during registration:', error)
      }
    }

    const accessToken = this.signAccessToken(user.id, user.email)
    const refreshToken = await this.createRefreshToken(user.id)

    void sendEmailTemplate('welcome', user.email, {
      email: user.email,
      firstName: user.email.split('@')[0] ?? 'Utilisateur',
    }).catch((error) => console.warn('[mail] welcome failed:', error))

    return {
      user: {
        id: refreshed?.id ?? user.id,
        email: refreshed?.email ?? user.email,
        role: refreshed?.role ?? user.role,
      },
      accessToken,
      refreshToken,
      migratedResumeId,
    }
  }

  async login(input: LoginInput) {
    const user = await authRepository.findByEmail(input.email)
    if (!user) throw new Error('INVALID_CREDENTIALS')
    if (user.suspendedAt) throw new Error('USER_SUSPENDED')

    const valid = await bcrypt.compare(input.password, user.passwordHash)
    if (!valid) throw new Error('INVALID_CREDENTIALS')

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    await ensurePlatformOwnerRole(user.id, user.email)
    const refreshed = await authRepository.findById(user.id)

    if (input.guestSessionId) {
      try {
        const guest = await guestSessionRepository.findBySessionId(input.guestSessionId)
        if (guest) await paymentService.migrateGuestToUser(user.id, guest.id)
      } catch (error) {
        console.warn('Guest entitlements migration failed during login:', error)
      }
    }

    const accessToken = this.signAccessToken(user.id, user.email)
    const refreshToken = await this.createRefreshToken(user.id)

    return {
      user: {
        id: refreshed?.id ?? user.id,
        email: refreshed?.email ?? user.email,
        role: refreshed?.role ?? user.role,
      },
      accessToken,
      refreshToken,
    }
  }

  async me(userId: string) {
    const user = await authRepository.findById(userId)
    if (!user) throw new Error('USER_NOT_FOUND')
    await ensurePlatformOwnerRole(user.id, user.email)
    const refreshed = await authRepository.findById(userId)
    if (!refreshed) throw new Error('USER_NOT_FOUND')
    return refreshed
  }

  verifyAccessToken(token: string) {
    return jwt.verify(token, JWT_SECRET) as { sub: string; email: string; impersonatedBy?: string }
  }

  async createSessionForUser(userId: string, options?: { impersonatedBy?: string }) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, firstName: true, lastName: true, suspendedAt: true },
    })
    if (!user) throw new Error('USER_NOT_FOUND')
    if (user.suspendedAt) throw new Error('USER_SUSPENDED')

    const payload: { sub: string; email: string; impersonatedBy?: string } = {
      sub: user.id,
      email: user.email,
    }
    if (options?.impersonatedBy) payload.impersonatedBy = options.impersonatedBy

    const signOptions: SignOptions = { expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'] }
    const accessToken = jwt.sign(payload, JWT_SECRET, signOptions)
    const refreshToken = await this.createRefreshToken(user.id)

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      accessToken,
      refreshToken,
      impersonatedBy: options?.impersonatedBy ?? null,
    }
  }
}

export const authService = new AuthService()
