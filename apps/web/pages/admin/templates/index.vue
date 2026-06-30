<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const adminService = useAdminService()

const cvTemplates = ref<Record<string, unknown>[]>([])
const letterTemplates = ref<Record<string, unknown>[]>([])
const loading = ref(true)
const error = ref('')
const message = ref('')
const savingSlug = ref('')

async function load() {
  loading.value = true
  try {
    const result = await adminService.listTemplates()
    cvTemplates.value = result.cv
    letterTemplates.value = result.letters
  } catch {
    error.value = 'Impossible de charger les templates.'
  } finally {
    loading.value = false
  }
}

async function toggleTemplate(slug: string, isActive: boolean) {
  savingSlug.value = slug
  message.value = ''
  try {
    await adminService.updateTemplate(slug, { isActive: !isActive })
    message.value = 'Template mis à jour.'
    await load()
  } catch {
    message.value = 'Échec de la mise à jour.'
  } finally {
    savingSlug.value = ''
  }
}

async function toggleLetterTemplate(slug: string, isActive: boolean) {
  savingSlug.value = slug
  message.value = ''
  try {
    const merged = letterTemplates.value.map((t) => ({
      slug: String(t.slug),
      isActive: String(t.slug) === slug ? !isActive : Boolean(t.isActive),
    }))
    await adminService.updateSettings({ letterTemplates: merged })
    message.value = 'Modèle lettre mis à jour.'
    await load()
  } catch {
    message.value = 'Échec de la mise à jour.'
  } finally {
    savingSlug.value = ''
  }
}

onMounted(load)
</script>

<template>
  <div>
    <AdminPageHeader title="Templates" subtitle="Modèles CV (base) et lettres (registre applicatif)." />

    <UiMessageBanner v-if="error" variant="error" :message="error" class="mb-4" />
    <UiMessageBanner v-if="message" variant="success" :message="message" class="mb-4" />

    <UiCard padding="lg" class="mb-gutter">
      <h2 class="font-bold text-on-surface mb-4">Modèles CV</h2>
      <div v-if="loading" class="space-y-2"><UiSkeleton v-for="i in 4" :key="i" variant="rect" height="4rem" /></div>
      <div v-else class="space-y-2">
        <div
          v-for="t in cvTemplates"
          :key="String(t.slug)"
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-outline-variant/30"
        >
          <div>
            <p class="font-semibold text-on-surface">{{ t.name }}</p>
            <p class="text-sm text-on-surface-variant">{{ t.slug }} · {{ t.category }}</p>
          </div>
          <div class="flex items-center gap-2">
            <AdminStatusBadge :status="t.isActive ? 'active' : 'FAILED'" />
            <UiButton
              variant="ghost"
              size="sm"
              :disabled="savingSlug === t.slug"
              @click="toggleTemplate(String(t.slug), Boolean(t.isActive))"
            >
              {{ t.isActive ? 'Désactiver' : 'Activer' }}
            </UiButton>
          </div>
        </div>
      </div>
    </UiCard>

    <UiCard padding="lg">
      <h2 class="font-bold text-on-surface mb-4">Modèles lettres</h2>
      <div class="space-y-2">
        <div
          v-for="t in letterTemplates"
          :key="String(t.slug)"
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-outline-variant/30"
        >
          <div>
            <p class="font-semibold text-on-surface">{{ t.name }}</p>
            <p class="text-sm text-on-surface-variant">{{ t.slug }} · {{ t.category }}</p>
          </div>
          <div class="flex items-center gap-2">
            <AdminStatusBadge :status="t.isActive ? 'active' : 'FAILED'" />
            <UiButton
              variant="ghost"
              size="sm"
              :disabled="savingSlug === t.slug"
              @click="toggleLetterTemplate(String(t.slug), Boolean(t.isActive))"
            >
              {{ t.isActive ? 'Désactiver' : 'Activer' }}
            </UiButton>
          </div>
        </div>
      </div>
    </UiCard>
  </div>
</template>
