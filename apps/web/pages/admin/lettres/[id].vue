<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const route = useRoute()
const router = useRouter()
const adminService = useAdminService()
const { confirm } = useConfirm()
const { formatDate } = useAdminFormat()

const letter = ref<Record<string, unknown> | null>(null)
const saving = ref(false)
const message = ref('')

const edit = ref({ title: '', content: '' })

async function load() {
  const result = await adminService.getLetter(String(route.params.id))
  letter.value = result.letter
  edit.value = {
    title: String(result.letter.title ?? ''),
    content: String(result.letter.content ?? ''),
  }
}

async function save() {
  saving.value = true
  try {
    const result = await adminService.updateLetter(String(route.params.id), edit.value)
    letter.value = result.letter
    message.value = 'Lettre mise à jour.'
  } finally {
    saving.value = false
  }
}

async function remove() {
  const accepted = await confirm('Action définitive.', {
    title: 'Supprimer cette lettre ?',
    confirmLabel: 'Supprimer',
    destructive: true,
  })
  if (!accepted) return
  await adminService.deleteLetter(String(route.params.id))
  await router.push('/admin/lettres')
}

onMounted(load)
</script>

<template>
  <div>
    <AdminPageHeader title="Détail lettre" subtitle="Modifier ou supprimer.">
      <template #actions>
        <button type="button" class="text-sm text-error font-semibold mr-2" @click="remove">Supprimer</button>
        <button type="button" class="btn-primary text-sm" :disabled="saving" @click="save">Enregistrer</button>
      </template>
    </AdminPageHeader>

    <UiMessageBanner v-if="message" variant="success" :message="message" class="mb-4" />

    <UiCard v-if="letter" padding="md" class="space-y-4">
      <p class="text-sm"><span class="text-on-surface-variant">Auteur :</span> {{ letter.owner }}</p>
      <p class="text-sm"><span class="text-on-surface-variant">Modèle :</span> {{ letter.templateId }}</p>
      <label class="block text-sm">
        <span class="font-semibold">Titre</span>
        <input v-model="edit.title" type="text" class="mt-1 w-full rounded-lg border border-outline-variant/40 px-3 py-2">
      </label>
      <label class="block text-sm">
        <span class="font-semibold">Contenu</span>
        <textarea v-model="edit.content" rows="12" class="mt-1 w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm" />
      </label>
    </UiCard>
  </div>
</template>
