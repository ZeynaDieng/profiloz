<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const adminService = useAdminService()

const health = ref<Record<string, unknown> | null>(null)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    health.value = await adminService.getHealth()
  } catch {
    error.value = 'Impossible de charger la supervision.'
  } finally {
    loading.value = false
  }
})

const services = computed(() => {
  const list = health.value?.services as Array<{ key: string; name: string; status: string; message?: string }> | undefined
  return list ?? []
})

function statusLabel(status: string) {
  if (status === 'ok') return '🟢 OK'
  if (status === 'degraded') return '🟡 Dégradé'
  return '🔴 Hors service'
}
</script>

<template>
  <div>
    <AdminPageHeader
      title="Supervision"
      subtitle="État des services Profilo'Z — API, base de données, Redis, SMTP, PayTech, OCR et stockage."
    />

    <UiMessageBanner v-if="error" variant="error" :message="error" class="mb-4" />

    <div v-if="loading" class="space-y-3">
      <UiSkeleton v-for="i in 6" :key="i" variant="rect" height="4rem" />
    </div>

    <div v-else-if="health" class="space-y-4">
      <UiCard padding="lg">
        <p class="text-sm text-on-surface-variant mb-1">État global</p>
        <p class="text-2xl font-bold text-on-surface">{{ statusLabel(String(health.status)) }}</p>
        <p class="text-xs text-on-surface-variant mt-2">Dernière vérification : {{ health.timestamp }}</p>
      </UiCard>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-gutter">
        <UiCard v-for="service in services" :key="service.key" padding="lg">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h3 class="font-semibold text-on-surface">{{ service.name }}</h3>
              <p v-if="service.message" class="text-sm text-on-surface-variant mt-1">{{ service.message }}</p>
            </div>
            <span class="text-sm font-medium whitespace-nowrap">{{ statusLabel(service.status) }}</span>
          </div>
        </UiCard>
      </div>
    </div>
  </div>
</template>
