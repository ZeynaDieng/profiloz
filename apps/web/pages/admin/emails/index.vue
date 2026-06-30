<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const adminService = useAdminService()

const templates = ref<Record<string, unknown>[]>([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const result = await adminService.listEmailTemplates()
    templates.value = result.data
  } catch {
    error.value = 'Impossible de charger les emails système.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <AdminPageHeader title="Emails" subtitle="Templates transactionnels de la plateforme." />

    <UiMessageBanner v-if="error" variant="error" :message="error" class="mb-4" />

    <UiCard padding="lg">
      <div v-if="loading" class="space-y-3">
        <UiSkeleton v-for="i in 4" :key="i" variant="rect" height="4rem" />
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="t in templates"
          :key="String(t.slug)"
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-outline-variant/30"
        >
          <div>
            <p class="font-semibold text-on-surface">{{ t.name }}</p>
            <p class="text-sm text-on-surface-variant">{{ t.description }}</p>
          </div>
          <UiButton variant="ghost" disabled>Modifier</UiButton>
        </div>
        <p class="text-sm text-on-surface-variant pt-2">Éditeur d’emails persisté en base — prochainement.</p>
      </div>
    </UiCard>
  </div>
</template>
