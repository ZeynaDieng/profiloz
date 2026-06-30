<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const adminService = useAdminService()

const settings = ref<Record<string, unknown> | null>(null)
const health = ref<Record<string, unknown> | null>(null)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const [s, h] = await Promise.all([adminService.getSettings(), adminService.getHealth()])
    settings.value = s
    health.value = h
  } catch {
    error.value = 'Impossible de charger les paramètres.'
  } finally {
    loading.value = false
  }
})

const brandingName = computed(() => (settings.value?.branding as { appName?: string } | undefined)?.appName ?? '—')
const seoTitle = computed(() => (settings.value?.seo as { title?: string } | undefined)?.title ?? '—')
const paytechConfigured = computed(() => Boolean((settings.value?.paytech as { configured?: boolean } | undefined)?.configured))
const smtpConfigured = computed(() => Boolean((settings.value?.smtp as { configured?: boolean } | undefined)?.configured))
const aiConfigured = computed(() => Boolean((settings.value?.ai as { configured?: boolean } | undefined)?.configured))
const storageProvider = computed(() => (settings.value?.storage as { provider?: string } | undefined)?.provider ?? 'local')
const pdfReady = computed(() => Boolean((health.value?.pdfRender as { ready?: boolean } | undefined)?.ready))
</script>

<template>
  <div>
    <AdminPageHeader title="Paramètres" subtitle="Configuration plateforme (lecture seule — variables d’environnement)." />

    <UiMessageBanner v-if="error" variant="error" :message="error" class="mb-4" />

    <div v-if="loading" class="space-y-3">
      <UiSkeleton variant="rect" height="10rem" />
      <UiSkeleton variant="rect" height="10rem" />
    </div>

    <template v-else-if="settings">
      <UiMessageBanner variant="info" :message="String(settings.note)" class="mb-4" />

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
        <UiCard padding="lg">
          <h3 class="font-bold text-on-surface mb-3">Identité & SEO</h3>
          <dl class="space-y-2 text-sm">
            <div class="flex justify-between gap-2"><dt class="text-on-surface-variant">Nom</dt><dd>{{ brandingName }}</dd></div>
            <div class="flex justify-between gap-2"><dt class="text-on-surface-variant">Titre SEO</dt><dd class="text-right">{{ seoTitle }}</dd></div>
          </dl>
        </UiCard>

        <UiCard padding="lg">
          <h3 class="font-bold text-on-surface mb-3">Intégrations</h3>
          <ul class="space-y-2 text-sm">
            <li class="flex justify-between gap-2"><span>PayTech</span><AdminStatusBadge :status="paytechConfigured ? 'active' : 'FAILED'" /></li>
            <li class="flex justify-between gap-2"><span>SMTP</span><AdminStatusBadge :status="smtpConfigured ? 'active' : 'FAILED'" /></li>
            <li class="flex justify-between gap-2"><span>IA (OpenAI)</span><AdminStatusBadge :status="aiConfigured ? 'active' : 'FAILED'" /></li>
            <li class="flex justify-between gap-2"><span>OCR</span><AdminStatusBadge status="active" /></li>
            <li class="flex justify-between gap-2"><span>Stockage</span><AdminStatusBadge :status="storageProvider !== 'local' ? 'active' : 'pending'" /></li>
            <li class="flex justify-between gap-2"><span>PDF</span><AdminStatusBadge :status="pdfReady ? 'active' : 'FAILED'" /></li>
          </ul>
        </UiCard>

        <UiCard padding="lg" class="lg:col-span-2">
          <h3 class="font-bold text-on-surface mb-3">Variables publiques</h3>
          <pre class="text-xs bg-surface-container rounded-lg p-4 overflow-auto">{{ JSON.stringify(settings.publicVars, null, 2) }}</pre>
        </UiCard>
      </div>
    </template>
  </div>
</template>
