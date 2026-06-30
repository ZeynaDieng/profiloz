import type { OrganizationType } from '@profiloz/shared'
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

export function useAdminService() {
  const { get, patch, delete: del } = useApiClient()

  async function getStats() {
    return get<AdminStats>('/admin/stats')
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

  return { getStats, listOrganizations, getOrganization, updateOrganization, removeMember }
}
