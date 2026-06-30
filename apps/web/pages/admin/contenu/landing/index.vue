<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const adminService = useAdminService()
const { confirm } = useConfirm()

const sections = ref<Record<string, unknown>[]>([])
const selectedKey = ref('hero')
const jsonDraft = ref('')
const loading = ref(true)
const saving = ref(false)
const message = ref('')
const error = ref('')

const sectionLabels: Record<string, string> = {
  hero: 'Hero',
  features: 'Fonctionnalités',
  testimonials: 'Témoignages',
  reassurance: 'Réassurance',
  cta: 'CTA final',
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const result = await adminService.listLandingSections()
    sections.value = result.data
    if (!sections.value.find((s) => s.key === selectedKey.value) && sections.value[0]) {
      selectedKey.value = String(sections.value[0].key)
    }
    syncDraft()
  } catch {
    error.value = 'Impossible de charger la landing.'
  } finally {
    loading.value = false
  }
}

function syncDraft() {
  const section = sections.value.find((s) => s.key === selectedKey.value)
  jsonDraft.value = JSON.stringify(section?.content ?? {}, null, 2)
}

watch(selectedKey, syncDraft)

async function save() {
  saving.value = true
  message.value = ''
  try {
    const content = JSON.parse(jsonDraft.value) as Record<string, unknown>
    await adminService.updateLandingSection(selectedKey.value, { content })
    message.value = 'Section enregistrée.'
    await load()
  } catch {
    message.value = 'JSON invalide ou erreur serveur.'
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <AdminPageHeader title="Landing page" subtitle="Modifiez les contenus publics sans redéploiement (JSON structuré par section).">
      <template #actions>
        <button type="button" class="btn-primary text-sm" :disabled="saving" @click="save">
          {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
        </button>
      </template>
    </AdminPageHeader>

    <UiMessageBanner v-if="error" variant="error" :message="error" class="mb-4" />
    <UiMessageBanner v-if="message" variant="success" :message="message" class="mb-4" />

    <div v-if="loading" class="space-y-3">
      <UiSkeleton variant="rect" height="20rem" />
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-gutter">
      <UiCard padding="md">
        <ul class="space-y-1">
          <li v-for="section in sections" :key="String(section.key)">
            <button
              type="button"
              class="w-full text-left rounded-lg px-3 py-2 text-sm"
              :class="selectedKey === section.key ? 'bg-secondary/10 text-secondary font-semibold' : 'hover:bg-surface-container'"
              @click="selectedKey = String(section.key)"
            >
              {{ sectionLabels[String(section.key)] ?? section.key }}
            </button>
          </li>
        </ul>
      </UiCard>

      <UiCard padding="md">
        <label class="block text-sm font-semibold text-on-surface mb-2">Contenu JSON — {{ sectionLabels[selectedKey] ?? selectedKey }}</label>
        <textarea
          v-model="jsonDraft"
          rows="22"
          class="w-full rounded-xl border border-outline-variant/40 px-3 py-2 font-mono text-xs"
        />
      </UiCard>
    </div>
  </div>
</template>
