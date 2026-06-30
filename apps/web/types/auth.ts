export type PlatformUserRole = 'USER' | 'ADMIN'

export interface AuthUser {
  id: string
  email: string
  role: PlatformUserRole
}
