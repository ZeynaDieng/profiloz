import type { OrgRole, OrganizationType } from '@profiloz/shared'

export interface OrganizationMemberDto {
  id: string
  userId: string
  role: OrgRole
  joinedAt: string
  name: string
  email: string
}

export interface OrganizationDto {
  id: string
  name: string
  type: OrganizationType
  unlimitedUntil: string | null
  subscriptionPlanSlug: string | null
  createdAt: string
  updatedAt: string
  members: OrganizationMemberDto[]
}

export function useOrganizationService() {
  const { get, post, patch, delete: del } = useApiClient()

  async function getMyOrganization() {
    return get<{ organization: OrganizationDto; myRole: OrgRole }>('/organizations/me')
  }

  async function updateOrganization(input: { name?: string; type?: OrganizationType }) {
    return patch<{ organization: OrganizationDto }>('/organizations/me', input)
  }

  async function inviteMember(organizationId: string, input: { email: string; role: OrgRole }) {
    return post<{ member: OrganizationMemberDto }>(`/organizations/${organizationId}/members`, input)
  }

  async function updateMemberRole(organizationId: string, userId: string, role: OrgRole) {
    return patch<{ member: OrganizationMemberDto }>(
      `/organizations/${organizationId}/members/${userId}`,
      { role },
    )
  }

  async function removeMember(organizationId: string, userId: string) {
    await del(`/organizations/${organizationId}/members/${userId}`)
  }

  return {
    getMyOrganization,
    updateOrganization,
    inviteMember,
    updateMemberRole,
    removeMember,
  }
}
