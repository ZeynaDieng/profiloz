<script setup lang="ts">
import { ORGANIZATION_TYPE_LABELS } from '@profiloz/shared'
import type { AdminOrganizationSummary } from '~/services/admin.service'

definePageMeta({ layout: 'admin' })

const adminService = useAdminService()
const organizations = ref<AdminOrganizationSummary[]>([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const result = await adminService.listOrganizations()
    organizations.value = result.data
  } catch {
    error.value = 'Impossible de charger les organisations.'
  } finally {
    loading.value = false
  }
})

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR')
}
</script>

<template>
  <div>
    <header class="mb-stack-lg flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold text-on-surface">Organisations</h1>
        <p class="text-on-surface-variant mt-1">{{ organizations.length }} organisation(s) enregistrée(s)</p>
      </div>
      <NuxtLink to="/admin" class="text-sm text-secondary font-semibold hover:underline">← Vue d’ensemble</NuxtLink>
    </header>

    <UiMessageBanner v-if="error" variant="error" :message="error" class="mb-4" />

    <div v-if="loading" class="space-y-3">
      <UiSkeleton v-for="i in 5" :key="i" variant="rect" height="4.5rem" />
    </div>

    <div v-else-if="organizations.length === 0" class="text-center py-stack-xl text-on-surface-variant">
      Aucune organisation pour le moment.
    </div>

    <div v-else class="rounded-xl border border-outline-variant/30 overflow-hidden">
      <div class="hidden md:grid md:grid-cols-[1.4fr_1fr_1fr_1fr_auto] gap-3 px-4 py-3 bg-surface-container text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
        <span>Organisation</span>
        <span>Type</span>
        <span>Abonnement</span>
        <span>Contenu</span>
        <span />
      </div>
      <NuxtLink
        v-for="org in organizations"
        :key="org.id"
        :to="`/admin/organisations/${org.id}`"
        class="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto] gap-2 md:gap-3 px-4 py-4 border-t border-outline-variant/20 bg-surface-container-lowest/60 hover:bg-surface-container transition-colors"
      >
        <div>
          <p class="font-semibold text-on-surface">{{ org.name }}</p>
          <p class="text-xs text-on-surface-variant mt-0.5">Créée le {{ formatDate(org.createdAt) }}</p>
        </div>
        <p class="text-sm text-on-surface-variant">{{ ORGANIZATION_TYPE_LABELS[org.type] }}</p>
        <p class="text-sm">
          <span
            class="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold"
            :class="org.subscriptionActive ? 'bg-secondary/10 text-secondary' : 'bg-error/10 text-error'"
          >
            {{ org.subscriptionActive ? 'Actif' : 'Expiré' }}
          </span>
          <span class="block text-xs text-on-surface-variant mt-1">jusqu’au {{ formatDate(org.unlimitedUntil) }}</span>
        </p>
        <p class="text-sm text-on-surface-variant">
          {{ org.memberCount }} membre(s) · {{ org.resumeCount }} dossier(s)
        </p>
        <UiPzIcon name="chevron_right" class="hidden md:block text-on-surface-variant self-center" />
      </NuxtLink>
    </div>
  </div>
</template>
