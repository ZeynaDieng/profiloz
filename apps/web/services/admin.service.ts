import type { OrganizationType, Plan } from '@profiloz/shared'
import type { OrgRole } from '@profiloz/shared'

export interface AdminOrganizationSummary {
  id: string
  name: string
  type: OrganizationType
  unlimitedUntil: string | null
  subscriptionPlanSlug: string | null
  subscriptionActive: boolean
  createdAt: string
  memberCount: number
  resumeCount: number
  documentCount: number
  letterCount: number
  adminName?: string
  creditsRemaining?: number | null
}

export interface AdminOrganizationDetail extends AdminOrganizationSummary {
  updatedAt: string
  members: Array<{
    id: string
    userId: string
    role: OrgRole
    joinedAt: string
    name: string
    email: string
  }>
}

export interface AdminStats {
  organizations: number
  users: number
  paidPayments: number
  activeBusinessOrganizations: number
}

export interface AdminDashboard {
  summary: AdminStats
  kpis: {
    users: { total: number; today: number; activeGuests: number; businessOrgs: number }
    content: {
      resumes: number
      resumesToday: number
      letters: number
      lettersToday: number
      pdfGenerated: number
      ocrImports: number
    }
    revenue: { today: number; week: number; month: number; total: number }
  }
  charts: {
    signups: Array<{ date: string; value: number }>
    resumes: Array<{ date: string; value: number }>
    letters: Array<{ date: string; value: number }>
    payments: Array<{ date: string; value: number; amount: number; count?: number }>
  }
  activity: Array<{ id: string; type: string; message: string; at: string }>
}

export interface PaginatedMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface AdminUserRow {
  id: string
  name: string
  email: string
  country: string | null
  createdAt: string
  lastLoginAt: string | null
  resumeCount: number
  letterCount: number
  paymentCount: number
  status: string
  role: string
  creditsBalance: number
  subscriptionPlanSlug: string | null
}

export function useAdminService() {
  const { get, patch, post, delete: del } = useApiClient()

  async function getStats() {
    return get<AdminStats>('/admin/stats')
  }

  async function getDashboard() {
    return get<AdminDashboard>('/admin/dashboard')
  }

  async function listUsers(params?: { page?: number; q?: string }) {
    const search = new URLSearchParams()
    if (params?.page) search.set('page', String(params.page))
    if (params?.q) search.set('q', params.q)
    const qs = search.toString()
    return get<{ data: AdminUserRow[]; meta: PaginatedMeta }>(`/admin/users${qs ? `?${qs}` : ''}`)
  }

  async function getUser(id: string) {
    return get<{ user: Record<string, unknown> }>(`/admin/users/${id}`)
  }

  async function updateUser(id: string, input: Record<string, unknown>) {
    return patch<{ user: Record<string, unknown> }>(`/admin/users/${id}`, input)
  }

  async function deleteUser(id: string) {
    return del(`/admin/users/${id}`)
  }

  async function suspendUser(id: string) {
    return post<{ user: Record<string, unknown> }>(`/admin/users/${id}/suspend`, {})
  }

  async function unsuspendUser(id: string) {
    return post<{ user: Record<string, unknown> }>(`/admin/users/${id}/unsuspend`, {})
  }

  async function resetUserPassword(id: string) {
    return post<{ temporaryPassword: string; user: Record<string, unknown> }>(`/admin/users/${id}/reset-password`, {})
  }

  async function impersonateUser(id: string) {
    return post<{
      user: { id: string; email: string; role: string; firstName?: string | null; lastName?: string | null }
      accessToken: string
      refreshToken: string
      impersonatedBy: string | null
    }>(`/admin/users/${id}/impersonate`, {})
  }

  async function listResumes(params?: Record<string, string | number | undefined>) {
    const search = new URLSearchParams()
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== '') search.set(k, String(v))
      }
    }
    const qs = search.toString()
    return get<{ data: Record<string, unknown>[]; meta: PaginatedMeta }>(`/admin/resumes${qs ? `?${qs}` : ''}`)
  }

  async function listLetters(params?: Record<string, string | number | undefined>) {
    const search = new URLSearchParams()
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== '') search.set(k, String(v))
      }
    }
    const qs = search.toString()
    return get<{ data: Record<string, unknown>[]; meta: PaginatedMeta }>(`/admin/letters${qs ? `?${qs}` : ''}`)
  }

  async function listPdfJobs(params?: Record<string, string | number | undefined>) {
    const search = new URLSearchParams()
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== '') search.set(k, String(v))
      }
    }
    const qs = search.toString()
    return get<{ data: Record<string, unknown>[]; meta: PaginatedMeta }>(`/admin/pdf-jobs${qs ? `?${qs}` : ''}`)
  }

  async function listPayments(params?: Record<string, string | number | undefined>) {
    const search = new URLSearchParams()
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== '') search.set(k, String(v))
      }
    }
    const qs = search.toString()
    return get<{
      summary: Record<string, number>
      data: Record<string, unknown>[]
      meta: PaginatedMeta
    }>(`/admin/payments${qs ? `?${qs}` : ''}`)
  }

  async function getAnalytics() {
    return get<Record<string, unknown>>('/admin/analytics')
  }

  async function getOcrStats() {
    return get<Record<string, unknown>>('/admin/ocr')
  }

  async function listTemplates() {
    return get<{ cv: Record<string, unknown>[]; letters: Record<string, unknown>[] }>('/admin/templates')
  }

  async function updateTemplate(slug: string, input: Record<string, unknown>) {
    return patch<{ template: Record<string, unknown> }>(`/admin/templates/${slug}`, input)
  }

  async function listPlans() {
    return get<{ data: Array<Plan & { active: boolean; editable: boolean; note?: string; credits: number | null }> }>('/admin/plans')
  }

  async function listEmailTemplates() {
    return get<{ data: Record<string, unknown>[] }>('/admin/emails')
  }

  async function getEmailTemplate(slug: string) {
    return get<{ template: Record<string, unknown> }>(`/admin/emails/${slug}`)
  }

  async function updateEmailTemplate(slug: string, input: Record<string, unknown>) {
    return patch<{ template: Record<string, unknown> }>(`/admin/emails/${slug}`, input)
  }

  async function updatePlan(slug: string, input: Record<string, unknown>) {
    return patch<{ plan: Record<string, unknown> }>(`/admin/plans/${slug}`, input)
  }

  async function updateSettings(input: Record<string, unknown>) {
    return patch<Record<string, unknown>>('/admin/settings', input)
  }

  async function sendNotification(input: { title: string; body: string; audience: 'all' | 'business' | 'premium' }) {
    return post<{ notification: Record<string, unknown> }>('/admin/notifications', input)
  }

  async function listNotifications() {
    return get<{ data: Record<string, unknown>[] }>('/admin/notifications')
  }

  async function exportUsersCsv() {
    const { download } = useApiClient()
    return download('/admin/users/export', 'profiloz-utilisateurs.csv')
  }

  async function exportPaymentsCsv() {
    const { download } = useApiClient()
    return download('/admin/payments/export', 'profiloz-paiements.csv')
  }

  async function search(q: string) {
    return get<{
      users: Array<{ id: string; label: string; sublabel?: string; href: string }>
      resumes: Array<{ id: string; label: string; sublabel?: string; href: string }>
      letters: Array<{ id: string; label: string; sublabel?: string; href: string }>
      payments: Array<{ id: string; label: string; sublabel?: string; href: string }>
      organizations: Array<{ id: string; label: string; sublabel?: string; href: string }>
      templates: Array<{ id: string; label: string; sublabel?: string; href: string }>
    }>(`/admin/search?q=${encodeURIComponent(q)}`)
  }

  async function getLogs(params?: Record<string, string | number | undefined>) {
    const search = new URLSearchParams()
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== '') search.set(k, String(v))
      }
    }
    const qs = search.toString()
    return get<{ data: Record<string, unknown>[]; meta: PaginatedMeta }>(`/admin/logs${qs ? `?${qs}` : ''}`)
  }

  async function getHealth() {
    return get<Record<string, unknown>>('/admin/health')
  }

  async function getSettings() {
    return get<Record<string, unknown>>('/admin/settings')
  }

  async function listOrganizations() {
    return get<{ data: AdminOrganizationSummary[]; meta: { total: number } }>('/admin/organizations')
  }

  async function getOrganization(id: string) {
    return get<{ organization: AdminOrganizationDetail }>(`/admin/organizations/${id}`)
  }

  async function updateOrganization(
    id: string,
    input: {
      name?: string
      type?: OrganizationType
      unlimitedUntil?: string | null
      subscriptionPlanSlug?: 'illimite' | 'business' | null
    },
  ) {
    return patch<{ organization: AdminOrganizationDetail }>(`/admin/organizations/${id}`, input)
  }

  async function removeMember(organizationId: string, userId: string) {
    return del(`/admin/organizations/${organizationId}/members/${userId}`)
  }

  return {
    getStats,
    getDashboard,
    listUsers,
    getUser,
    updateUser,
    deleteUser,
    suspendUser,
    unsuspendUser,
    resetUserPassword,
    impersonateUser,
    listResumes,
    listLetters,
    listPdfJobs,
    listPayments,
    getAnalytics,
    getOcrStats,
    listTemplates,
    updateTemplate,
    listPlans,
    listEmailTemplates,
    getEmailTemplate,
    updateEmailTemplate,
    updatePlan,
    updateSettings,
    sendNotification,
    listNotifications,
    exportUsersCsv,
    exportPaymentsCsv,
    search,
    getLogs,
    getHealth,
    getSettings,
    listOrganizations,
    getOrganization,
    updateOrganization,
    removeMember,
  }
}
