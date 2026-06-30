<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const adminService = useAdminService()
const { confirm } = useConfirm()

const items = ref<Array<{ id: string; question: string; answer: string; isActive: boolean }>>([])
const loading = ref(true)
const error = ref('')
const message = ref('')

const draft = ref({ question: '', answer: '' })

async function load() {
  loading.value = true
  try {
    const result = await adminService.listFaq()
    items.value = result.data.map((row) => ({
      id: String(row.id),
      question: String(row.question ?? ''),
      answer: String(row.answer ?? ''),
      isActive: Boolean(row.isActive),
    }))
  } catch {
    error.value = 'Impossible de charger la FAQ.'
  } finally {
    loading.value = false
  }
}

async function createItem() {
  if (!draft.value.question.trim() || !draft.value.answer.trim()) return
  try {
    await adminService.createFaq(draft.value)
    draft.value = { question: '', answer: '' }
    message.value = 'Question ajoutée.'
    await load()
  } catch {
    message.value = 'Échec de la création.'
  }
}

async function saveItem(item: { id: string; question: string; answer: string; isActive: boolean }) {
  try {
    await adminService.updateFaq(String(item.id), {
      question: item.question,
      answer: item.answer,
      isActive: item.isActive,
    })
    message.value = 'FAQ mise à jour.'
  } catch {
    message.value = 'Échec de la mise à jour.'
  }
}

async function removeItem(id: string) {
  const accepted = await confirm('Cette action est définitive.', {
    title: 'Supprimer cette question ?',
    confirmLabel: 'Supprimer',
    destructive: true,
  })
  if (!accepted) return
  await adminService.deleteFaq(id)
  await load()
}

onMounted(load)
</script>

<template>
  <div>
    <AdminPageHeader title="FAQ" subtitle="Questions affichées sur la landing page." />

    <UiMessageBanner v-if="error" variant="error" :message="error" class="mb-4" />
    <UiMessageBanner v-if="message" variant="success" :message="message" class="mb-4" />

    <UiCard padding="md" class="mb-gutter">
      <h3 class="font-semibold text-on-surface mb-3">Nouvelle question</h3>
      <div class="space-y-3">
        <input v-model="draft.question" type="text" placeholder="Question" class="w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm">
        <textarea v-model="draft.answer" rows="3" placeholder="Réponse" class="w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm" />
        <button type="button" class="btn-primary text-sm" @click="createItem">Ajouter</button>
      </div>
    </UiCard>

    <div v-if="loading" class="space-y-3">
      <UiSkeleton v-for="i in 4" :key="i" variant="rect" height="8rem" />
    </div>

    <div v-else class="space-y-4">
      <UiCard v-for="item in items" :key="String(item.id)" padding="md">
        <div class="space-y-3">
          <input v-model="item.question" type="text" class="w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm font-semibold">
          <textarea v-model="item.answer" rows="4" class="w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm" />
          <div class="flex flex-wrap gap-2">
            <label class="flex items-center gap-2 text-sm">
              <input v-model="item.isActive" type="checkbox">
              Active
            </label>
            <button type="button" class="btn-outline text-sm" @click="saveItem(item)">Enregistrer</button>
            <button type="button" class="text-sm text-error font-semibold" @click="removeItem(String(item.id))">Supprimer</button>
          </div>
        </div>
      </UiCard>
    </div>
  </div>
</template>
