<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const route = useRoute()
const adminService = useAdminService()
const { formatDate, formatXof } = useAdminFormat()

const user = ref<Record<string, unknown> | null>(null)
const loading = ref(true)
const error = ref('')
const saving = ref(false)
const message = ref('')

const editCredits = ref(0)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const result = await adminService.getUser(String(route.params.id))
    user.value = result.user
    editCredits.value = Number(result.user.creditsBalance ?? 0)
  } catch {
    error.value = 'Utilisateur introuvable.'
  } finally {
    loading.value = false
  }
}

async function saveCredits() {
  if (!user.value) return
  saving.value = true
  message.value = ''
  try {
    const result = await adminService.updateUser(String(user.value.id), { creditsBalance: editCredits.value })
    user.value = result.user
    message.value = 'Crédits mis à jour.'
  } catch {
    message.value = 'Échec de la mise à jour.'
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <AdminPageHeader
      v-if="user"
      :title="String(user.name)"
      :subtitle="String(user.email)"
    >
      <template #actions>
        <NuxtLink to="/admin/utilisateurs" class="text-sm text-secondary font-semibold hover:underline">← Retour</NuxtLink>
      </template>
    </AdminPageHeader>

    <UiMessageBanner v-if="error" variant="error" :message="error" class="mb-4" />
    <UiMessageBanner v-if="message" variant="success" :message="message" class="mb-4" />

    <div v-if="loading" class="space-y-3">
      <UiSkeleton variant="rect" height="8rem" />
      <UiSkeleton variant="rect" height="16rem" />
    </div>

    <template v-else-if="user">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-gutter mb-gutter">
        <UiCard padding="lg">
          <h2 class="font-bold text-on-surface mb-3">Profil</h2>
          <dl class="space-y-2 text-sm">
            <div class="flex justify-between gap-2"><dt class="text-on-surface-variant">Rôle</dt><dd>{{ user.role }}</dd></div>
            <div class="flex justify-between gap-2"><dt class="text-on-surface-variant">Inscription</dt><dd>{{ formatDate(user.createdAt as string) }}</dd></div>
            <div class="flex justify-between gap-2"><dt class="text-on-surface-variant">Dernière connexion</dt><dd>{{ formatDate(user.lastLoginAt as string, true) }}</dd></div>
            <div class="flex justify-between gap-2"><dt class="text-on-surface-variant">Plan</dt><dd>{{ user.subscriptionPlanSlug || '—' }}</dd></div>
          </dl>
        </UiCard>

        <UiCard padding="lg">
          <h2 class="font-bold text-on-surface mb-3">Crédits</h2>
          <div class="flex items-end gap-2">
            <input v-model.number="editCredits" type="number" min="0" class="rounded-lg border border-outline-variant/40 px-3 py-2 w-full">
            <UiButton variant="secondary" :disabled="saving" @click="saveCredits">Enregistrer</UiButton>
          </div>
          <p class="text-xs text-on-surface-variant mt-2">Suspendre, impersonation et reset mot de passe arrivent prochainement.</p>
        </UiCard>

        <UiCard padding="lg">
          <h2 class="font-bold text-on-surface mb-3">Actions</h2>
          <div class="space-y-2">
            <UiButton variant="ghost" class="w-full justify-start" disabled icon="login">Se connecter en tant que</UiButton>
            <UiButton variant="ghost" class="w-full justify-start" disabled icon="lock_reset">Réinitialiser le mot de passe</UiButton>
            <UiButton variant="ghost" class="w-full justify-start" disabled icon="block">Suspendre</UiButton>
          </div>
        </UiCard>
      </div>

      <UiCard padding="lg" class="mb-gutter">
        <h2 class="font-bold text-on-surface mb-3">CV ({{ (user.resumes as unknown[])?.length ?? 0 }})</h2>
        <AdminDataTable
          :columns="[{ key: 'title', label: 'Titre' }, { key: 'templateSlug', label: 'Modèle' }, { key: 'createdAt', label: 'Créé' }]"
          :rows="(user.resumes as Record<string, unknown>[]) || []"
        >
          <template #cell-createdAt="{ row }">{{ formatDate(row.createdAt as string) }}</template>
        </AdminDataTable>
      </UiCard>

      <UiCard padding="lg" class="mb-gutter">
        <h2 class="font-bold text-on-surface mb-3">Paiements</h2>
        <AdminDataTable
          :columns="[{ key: 'planSlug', label: 'Offre' }, { key: 'amountXof', label: 'Montant' }, { key: 'status', label: 'Statut' }, { key: 'createdAt', label: 'Date' }]"
          :rows="(user.payments as Record<string, unknown>[]) || []"
        >
          <template #cell-amountXof="{ row }">{{ formatXof(row.amountXof as number) }}</template>
          <template #cell-status="{ row }"><AdminStatusBadge :status="row.status as string" /></template>
          <template #cell-createdAt="{ row }">{{ formatDate(row.createdAt as string, true) }}</template>
        </AdminDataTable>
      </UiCard>
    </template>
  </div>
</template>
