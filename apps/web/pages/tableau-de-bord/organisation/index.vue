<script setup lang="ts">
import {
  ORG_ROLE_LABELS,
  ORGANIZATION_TYPE_LABELS,
  canManageMembers,
  canEditOrganization,
  type OrgRole,
  type OrganizationType,
} from '@profiloz/shared'
import type { OrganizationDto } from '~/services/organization.service'

definePageMeta({ layout: 'dashboard' })

const authStore = useAuthStore()
const paymentService = usePaymentService()
const organizationService = useOrganizationService()
const { confirm } = useConfirm()

const loading = ref(true)
const saving = ref(false)
const inviting = ref(false)
const error = ref('')
const success = ref('')

const organization = ref<OrganizationDto | null>(null)
const myRole = ref<OrgRole | null>(null)

const editName = ref('')
const editType = ref<OrganizationType>('OTHER')
const inviteEmail = ref('')
const inviteRole = ref<OrgRole>('MEMBER')

const canEdit = computed(() => myRole.value && canEditOrganization(myRole.value))
const canManage = computed(() => myRole.value && canManageMembers(myRole.value))

const organizationTypes = Object.entries(ORGANIZATION_TYPE_LABELS) as [OrganizationType, string][]
const inviteRoles: OrgRole[] = ['MEMBER', 'ADMIN', 'MANAGER']

onMounted(async () => {
  authStore.loadFromStorage()
  if (!authStore.isAuthenticated) {
    await navigateTo('/connexion')
    return
  }

  try {
    const entitlements = await paymentService.getEntitlements()
    if (!entitlements.features.businessOrg) {
      await navigateTo({ path: '/tarifs', query: { reason: 'business', returnTo: '/tableau-de-bord/organisation' } })
      return
    }
    await loadOrganization()
  } catch (err) {
    const problem = err as { status?: number }
    if (problem.status === 402 || problem.status === 404) {
      await navigateTo({ path: '/tarifs', query: { reason: 'business', returnTo: '/tableau-de-bord/organisation' } })
      return
    }
    error.value = 'Impossible de charger votre espace organisation.'
    loading.value = false
  }
})

async function loadOrganization() {
  loading.value = true
  error.value = ''
  try {
    const result = await organizationService.getMyOrganization()
    organization.value = result.organization
    myRole.value = result.myRole
    editName.value = result.organization.name
    editType.value = result.organization.type
  } catch {
    error.value = 'Impossible de charger votre espace organisation.'
  } finally {
    loading.value = false
  }
}

async function saveOrganization() {
  if (!organization.value || !canEdit.value) return
  saving.value = true
  error.value = ''
  success.value = ''
  try {
    const result = await organizationService.updateOrganization({
      name: editName.value.trim(),
      type: editType.value,
    })
    organization.value = result.organization
    success.value = 'Organisation mise à jour.'
  } catch (err) {
    const problem = err as { detail?: string }
    error.value = problem.detail ?? 'Enregistrement impossible pour le moment.'
  } finally {
    saving.value = false
  }
}

async function submitInvite() {
  if (!organization.value || !canManage.value) return
  inviting.value = true
  error.value = ''
  success.value = ''
  try {
    const result = await organizationService.inviteMember(organization.value.id, {
      email: inviteEmail.value.trim(),
      role: inviteRole.value,
    })
    organization.value = {
      ...organization.value,
      members: [...organization.value.members, result.member],
    }
    inviteEmail.value = ''
    inviteRole.value = 'MEMBER'
    success.value = `${result.member.name} a rejoint votre organisation.`
  } catch (err) {
    const problem = err as { detail?: string }
    error.value = problem.detail ?? 'Invitation impossible pour le moment.'
  } finally {
    inviting.value = false
  }
}

async function changeMemberRole(userId: string, role: OrgRole) {
  if (!organization.value || !canManage.value) return
  error.value = ''
  success.value = ''
  try {
    const result = await organizationService.updateMemberRole(organization.value.id, userId, role)
    organization.value = {
      ...organization.value,
      members: organization.value.members.map((member) =>
        member.userId === userId ? result.member : member,
      ),
    }
    success.value = 'Rôle mis à jour.'
  } catch (err) {
    const problem = err as { detail?: string }
    error.value = problem.detail ?? 'Modification impossible.'
  }
}

async function removeMember(userId: string, name: string) {
  if (!organization.value || !canManage.value) return
  const ok = await confirm(`Retirer ${name} de l’organisation ?`, {
    title: 'Retirer un membre',
    confirmLabel: 'Retirer',
    destructive: true,
  })
  if (!ok) return

  error.value = ''
  success.value = ''
  try {
    await organizationService.removeMember(organization.value.id, userId)
    organization.value = {
      ...organization.value,
      members: organization.value.members.filter((member) => member.userId !== userId),
    }
    success.value = 'Membre retiré.'
  } catch (err) {
    const problem = err as { detail?: string }
    error.value = problem.detail ?? 'Suppression impossible.'
  }
}
</script>

<template>
  <div class="page-container max-w-3xl">
    <header class="mb-stack-lg">
      <h1 class="text-2xl md:text-3xl font-bold text-on-surface">Espace organisation</h1>
      <p class="text-on-surface-variant mt-1">
        Gérez votre équipe et partagez les dossiers de candidature au sein de votre organisation.
      </p>
    </header>

    <UiMessageBanner v-if="error" variant="error" :message="error" class="mb-4" />
    <UiMessageBanner v-if="success" variant="success" :message="success" class="mb-4" />

    <div v-if="loading" class="space-y-4">
      <UiSkeleton variant="rect" height="10rem" />
      <UiSkeleton variant="rect" height="16rem" />
    </div>

    <div v-else-if="organization" class="space-y-stack-md">
      <UiCard variant="glass" padding="lg">
        <div class="flex items-start gap-4 mb-stack-md">
          <div class="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
            <UiPzIcon name="domain" />
          </div>
          <div>
            <h2 class="font-bold text-on-surface">Profil de l’organisation</h2>
            <p class="text-sm text-on-surface-variant mt-1">
              Offre Business active
              <span v-if="organization.unlimitedUntil">
                · renouvellement le
                {{ new Date(organization.unlimitedUntil).toLocaleDateString('fr-FR') }}
              </span>
            </p>
          </div>
        </div>

        <form class="space-y-4" @submit.prevent="saveOrganization">
          <UiFormField label="Nom de l’organisation">
            <input
              v-model="editName"
              type="text"
              class="w-full rounded-xl border border-outline-variant/40 bg-surface px-4 py-3 text-on-surface"
              :disabled="!canEdit || saving"
              required
            >
          </UiFormField>
          <label class="block text-sm font-medium text-on-surface">
            Type
            <select
              v-model="editType"
              class="mt-1 w-full rounded-xl border border-outline-variant/40 bg-surface px-4 py-3 text-on-surface"
              :disabled="!canEdit || saving"
            >
              <option v-for="[value, label] in organizationTypes" :key="value" :value="value">
                {{ label }}
              </option>
            </select>
          </label>
          <UiButton v-if="canEdit" type="submit" variant="secondary" :loading="saving">
            Enregistrer
          </UiButton>
        </form>
      </UiCard>

      <UiCard variant="glass" padding="lg">
        <div class="flex items-center justify-between gap-3 mb-stack-md">
          <div>
            <h2 class="font-bold text-on-surface">Collaborateurs</h2>
            <p class="text-sm text-on-surface-variant mt-1">
              {{ organization.members.length }} membre{{ organization.members.length > 1 ? 's' : '' }}
            </p>
          </div>
        </div>

        <form
          v-if="canManage"
          class="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 mb-stack-md"
          @submit.prevent="submitInvite"
        >
          <UiFormField label="E-mail du collaborateur">
            <input
              v-model="inviteEmail"
              type="email"
              placeholder="collaborateur@entreprise.com"
              class="w-full rounded-xl border border-outline-variant/40 bg-surface px-4 py-3 text-on-surface"
              required
            >
          </UiFormField>
          <label class="block text-sm font-medium text-on-surface">
            Rôle
            <select
              v-model="inviteRole"
              class="mt-1 w-full rounded-xl border border-outline-variant/40 bg-surface px-4 py-3 text-on-surface min-w-[10rem]"
            >
              <option v-for="role in inviteRoles" :key="role" :value="role">
                {{ ORG_ROLE_LABELS[role] }}
              </option>
            </select>
          </label>
          <div class="flex items-end">
            <UiButton type="submit" variant="secondary" :loading="inviting">
              Inviter
            </UiButton>
          </div>
        </form>

        <ul class="divide-y divide-outline-variant/30 rounded-xl border border-outline-variant/30 overflow-hidden">
          <li
            v-for="member in organization.members"
            :key="member.id"
            class="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 bg-surface-container-lowest/60"
          >
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-on-surface truncate">{{ member.name }}</p>
              <p class="text-sm text-on-surface-variant truncate">{{ member.email }}</p>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <span
                v-if="!canManage || member.role === 'OWNER'"
                class="text-xs font-semibold px-3 py-1 rounded-full bg-secondary/10 text-secondary"
              >
                {{ ORG_ROLE_LABELS[member.role] }}
              </span>
              <select
                v-else
                :value="member.role"
                class="rounded-lg border border-outline-variant/40 bg-surface px-3 py-2 text-sm"
                @change="changeMemberRole(member.userId, ($event.target as HTMLSelectElement).value as OrgRole)"
              >
                <option v-for="role in inviteRoles" :key="role" :value="role">
                  {{ ORG_ROLE_LABELS[role] }}
                </option>
              </select>

              <UiButton
                v-if="canManage && member.role !== 'OWNER' && member.userId !== authStore.user?.id"
                variant="ghost"
                size="sm"
                icon="person_remove"
                @click="removeMember(member.userId, member.name)"
              >
                Retirer
              </UiButton>
            </div>
          </li>
        </ul>

        <p v-if="canManage" class="text-xs text-on-surface-variant mt-4">
          L’invité doit déjà posséder un compte Profilo’Z avec cet e-mail.
        </p>
      </UiCard>
    </div>
  </div>
</template>
