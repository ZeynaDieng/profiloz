<script setup lang="ts">
import {
  MSG,
  ORG_ROLE_LABELS,
  ORGANIZATION_TYPE_LABELS,
  type OrganizationType,
} from '@profiloz/shared'
import type { AdminOrganizationDetail } from '~/services/admin.service'

definePageMeta({ layout: 'admin' })

const route = useRoute()
const adminService = useAdminService()
const { confirm } = useConfirm()

const organization = ref<AdminOrganizationDetail | null>(null)
const loading = ref(true)
const saving = ref(false)
const success = ref('')
const { fieldError, formError, clearAll, setFieldError, clearField, scrollToFirstError } = useFormValidation()

const editName = ref('')
const editType = ref<OrganizationType>('OTHER')
const editUntil = ref('')

const orgId = computed(() => route.params.id as string)
const organizationTypes = Object.entries(ORGANIZATION_TYPE_LABELS) as [OrganizationType, string][]

onMounted(loadOrganization)

async function loadOrganization() {
  loading.value = true
  clearAll()
  try {
    const result = await adminService.getOrganization(orgId.value)
    organization.value = result.organization
    editName.value = result.organization.name
    editType.value = result.organization.type
    editUntil.value = result.organization.unlimitedUntil
      ? result.organization.unlimitedUntil.slice(0, 10)
      : ''
  } catch {
    formError.value = 'Organisation introuvable.'
  } finally {
    loading.value = false
  }
}

async function saveOrganization() {
  if (!organization.value) return
  clearAll()
  if (!editName.value.trim()) {
    setFieldError('name', MSG.validation.required)
    formError.value = MSG.validation.invalidData
    scrollToFirstError()
    return
  }

  saving.value = true
  success.value = ''
  try {
    const unlimitedUntil = editUntil.value
      ? new Date(`${editUntil.value}T23:59:59.999Z`).toISOString()
      : null
    const result = await adminService.updateOrganization(orgId.value, {
      name: editName.value.trim(),
      type: editType.value,
      unlimitedUntil,
      subscriptionPlanSlug: 'business',
    })
    organization.value = result.organization
    success.value = 'Organisation mise à jour.'
  } catch (err) {
    const problem = err as { detail?: string }
    formError.value = problem.detail ?? 'Enregistrement impossible.'
  } finally {
    saving.value = false
  }
}

async function removeMember(userId: string, name: string) {
  if (!organization.value) return
  const ok = await confirm(`Retirer ${name} de cette organisation ?`, {
    title: 'Retirer un membre',
    confirmLabel: 'Retirer',
    destructive: true,
  })
  if (!ok) return

  clearAll()
  success.value = ''
  try {
    await adminService.removeMember(orgId.value, userId)
    await loadOrganization()
    success.value = 'Membre retiré.'
  } catch (err) {
    const problem = err as { detail?: string }
    formError.value = problem.detail ?? 'Suppression impossible.'
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div>
    <header class="mb-stack-lg">
      <NuxtLink to="/admin/organisations" class="text-sm text-secondary font-semibold hover:underline">
        ← Organisations
      </NuxtLink>
      <h1 v-if="organization" class="text-2xl md:text-3xl font-bold text-on-surface mt-2">{{ organization.name }}</h1>
    </header>

    <UiMessageBanner v-if="formError && !fieldError('name')" variant="error" :message="formError" class="mb-4" />
    <UiMessageBanner v-if="success" variant="success" :message="success" class="mb-4" />

    <div v-if="loading" class="space-y-4">
      <UiSkeleton variant="rect" height="12rem" />
      <UiSkeleton variant="rect" height="16rem" />
    </div>

    <div v-else-if="organization" class="space-y-stack-md">
      <UiCard padding="lg">
        <h2 class="font-bold text-on-surface mb-4">Paramètres</h2>
        <form class="grid grid-cols-1 md:grid-cols-2 gap-4" @submit.prevent="saveOrganization">
          <UiFormField label="Nom" required :error="fieldError('name')">
            <input
              v-model="editName"
              type="text"
              class="form-input w-full"
              @input="clearField('name')"
            >
          </UiFormField>
          <UiFormField label="Type">
            <select
              v-model="editType"
              class="w-full rounded-xl border border-outline-variant/40 bg-surface px-4 py-3"
            >
              <option v-for="[value, label] in organizationTypes" :key="value" :value="value">
                {{ label }}
              </option>
            </select>
          </UiFormField>
          <UiFormField label="Fin d’abonnement Business">
            <input
              v-model="editUntil"
              type="date"
              class="w-full rounded-xl border border-outline-variant/40 bg-surface px-4 py-3"
            >
          </UiFormField>
          <div class="md:col-span-2 flex flex-wrap gap-4 text-sm text-on-surface-variant">
            <span>{{ organization.memberCount }} membre(s)</span>
            <span>{{ organization.resumeCount }} dossier(s)</span>
            <span>{{ organization.documentCount }} document(s)</span>
            <span>{{ organization.letterCount }} lettre(s)</span>
          </div>
          <div class="md:col-span-2">
            <UiButton type="submit" variant="secondary" :loading="saving">Enregistrer</UiButton>
          </div>
        </form>
      </UiCard>

      <UiCard padding="lg">
        <h2 class="font-bold text-on-surface mb-4">Membres</h2>
        <ul class="divide-y divide-outline-variant/30 rounded-xl border border-outline-variant/30 overflow-hidden">
          <li
            v-for="member in organization.members"
            :key="member.id"
            class="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 bg-surface-container-lowest/60"
          >
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-on-surface truncate">{{ member.name }}</p>
              <p class="text-sm text-on-surface-variant truncate">{{ member.email }}</p>
              <p class="text-xs text-on-surface-variant mt-1">Depuis le {{ formatDate(member.joinedAt) }}</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold px-3 py-1 rounded-full bg-secondary/10 text-secondary">
                {{ ORG_ROLE_LABELS[member.role] }}
              </span>
              <UiButton
                v-if="member.role !== 'OWNER'"
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
      </UiCard>
    </div>
  </div>
</template>
