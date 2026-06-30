export const ORG_ROLES = ['OWNER', 'ADMIN', 'MANAGER', 'MEMBER'] as const
export type OrgRole = (typeof ORG_ROLES)[number]

export const ORGANIZATION_TYPES = [
  'COMPANY',
  'SCHOOL',
  'UNIVERSITY',
  'RH_AGENCY',
  'TRAINING_CENTER',
  'OTHER',
] as const
export type OrganizationType = (typeof ORGANIZATION_TYPES)[number]

export const ORG_ROLE_LABELS: Record<OrgRole, string> = {
  OWNER: 'Propriétaire',
  ADMIN: 'Administrateur',
  MANAGER: 'Manager',
  MEMBER: 'Membre',
}

export const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
  COMPANY: 'Entreprise',
  SCHOOL: 'École',
  UNIVERSITY: 'Université',
  RH_AGENCY: 'Cabinet RH',
  TRAINING_CENTER: 'Centre de formation',
  OTHER: 'Autre',
}

/** Rôles autorisés à gérer les membres (inviter / retirer). */
export const ORG_MEMBER_MANAGER_ROLES: OrgRole[] = ['OWNER', 'ADMIN']

export function canManageMembers(role: OrgRole): boolean {
  return ORG_MEMBER_MANAGER_ROLES.includes(role)
}

export function canEditOrganization(role: OrgRole): boolean {
  return role === 'OWNER' || role === 'ADMIN'
}
