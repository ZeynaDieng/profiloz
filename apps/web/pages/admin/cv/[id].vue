<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const route = useRoute()
const router = useRouter()
const adminService = useAdminService()
const { confirm } = useConfirm()
const { formatDate } = useAdminFormat()

const resume = ref<Record<string, unknown> | null>(null)
const loading = ref(true)
const saving = ref(false)
const message = ref('')

const edit = ref({ title: '', status: 'ACTIVE' })

async function load() {
  loading.value = true
  try {
    const result = await adminService.getResume(String(route.params.id))
    resume.value = result.resume
    edit.value = {
      title: String(result.resume.title ?? ''),
      status: String(result.resume.status ?? 'ACTIVE'),
    }
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    const result = await adminService.updateResume(String(route.params.id), edit.value)
    resume.value = result.resume
    message.value = 'CV mis à jour.'
  } finally {
    saving.value = false
  }
}

async function remove() {
  const accepted = await confirm('Action définitive.', {
    title: 'Supprimer ce CV ?',
    confirmLabel: 'Supprimer',
    destructive: true,
  })
  if (!accepted) return
  await adminService.deleteResume(String(route.params.id))
  await router.push('/admin/cv')
}

onMounted(load)
</script>

<template>
  <div>
    <AdminPageHeader title="Détail CV" subtitle="Modifier, archiver ou supprimer.">
      <template #actions>
        <button type="button" class="text-sm text-error font-semibold mr-2" @click="remove">Supprimer</button>
        <button type="button" class="btn-primary text-sm" :disabled="saving" @click="save">Enregistrer</button>
      </template>
    </AdminPageHeader>

    <UiMessageBanner v-if="message" variant="success" :message="message" class="mb-4" />

    <UiCard v-if="resume" padding="md" class="space-y-4">
      <p class="text-sm"><span class="text-on-surface-variant">Propriétaire :</span> {{ resume.owner }} ({{ resume.ownerEmail }})</p>
      <p class="text-sm"><span class="text-on-surface-variant">Modèle :</span> {{ resume.templateSlug }}</p>
      <p class="text-sm"><span class="text-on-surface-variant">Créé :</span> {{ formatDate(String(resume.createdAt)) }}</p>
      <label class="block text-sm">
        <span class="font-semibold">Titre</span>
        <input v-model="edit.title" type="text" class="mt-1 w-full rounded-lg border border-outline-variant/40 px-3 py-2">
      </label>
      <label class="block text-sm">
        <span class="font-semibold">Statut</span>
        <select v-model="edit.status" class="mt-1 w-full rounded-lg border border-outline-variant/40 px-3 py-2">
          <option value="DRAFT">Brouillon</option>
          <option value="ACTIVE">Actif</option>
          <option value="ARCHIVED">Archivé</option>
        </select>
      </label>
    </UiCard>
  </div>
</template>
