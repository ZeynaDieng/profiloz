<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const adminService = useAdminService()
const { confirm } = useConfirm()
const config = useRuntimeConfig()

const rows = ref<Record<string, unknown>[]>([])
const meta = ref({ page: 1, totalPages: 1, total: 0, limit: 24 })
const loading = ref(true)
const uploading = ref(false)
const q = ref('')
const kind = ref('')

function mediaUrl(path: string) {
  if (path.startsWith('http')) return path
  return `${config.public.apiBaseUrl.replace(/\/$/, '')}${path}`
}

async function load(page = 1) {
  loading.value = true
  try {
    const result = await adminService.listMedia({
      page,
      q: q.value || undefined,
      kind: kind.value || undefined,
    })
    rows.value = result.data
    meta.value = result.meta
  } finally {
    loading.value = false
  }
}

async function onUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploading.value = true
  try {
    await adminService.uploadMedia(file)
    await load(1)
  } finally {
    uploading.value = false
    input.value = ''
  }
}

async function removeAsset(id: string) {
  const accepted = await confirm('Le fichier sera retiré du stockage.', {
    title: 'Supprimer ce média ?',
    confirmLabel: 'Supprimer',
    destructive: true,
  })
  if (!accepted) return
  await adminService.deleteMedia(id)
  await load(meta.value.page)
}

onMounted(() => load(1))
</script>

<template>
  <div>
    <AdminPageHeader title="Médiathèque" subtitle="Images, vidéos et documents pour la plateforme.">
      <template #actions>
        <select v-model="kind" class="rounded-lg border border-outline-variant/40 px-3 py-2 text-sm" @change="load(1)">
          <option value="">Tous types</option>
          <option value="image">Images</option>
          <option value="video">Vidéos</option>
          <option value="document">Documents</option>
        </select>
        <input v-model="q" type="search" placeholder="Rechercher…" class="rounded-lg border border-outline-variant/40 px-3 py-2 text-sm" @keyup.enter="load(1)">
        <label class="btn-primary text-sm cursor-pointer">
          {{ uploading ? 'Upload…' : 'Importer' }}
          <input type="file" class="hidden" accept="image/*,video/*,application/pdf" @change="onUpload">
        </label>
      </template>
    </AdminPageHeader>

    <div v-if="loading" class="grid grid-cols-2 md:grid-cols-4 gap-gutter">
      <UiSkeleton v-for="i in 8" :key="i" variant="rect" height="10rem" />
    </div>

    <div v-else-if="rows.length === 0" class="rounded-xl border border-outline-variant/30 p-8 text-center text-on-surface-variant">
      Aucun média. Importez un fichier pour commencer.
    </div>

    <div v-else class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-gutter">
      <UiCard v-for="asset in rows" :key="String(asset.id)" padding="sm">
        <div class="aspect-video bg-surface-container rounded-lg overflow-hidden mb-2 flex items-center justify-center">
          <img
            v-if="String(asset.kind) === 'image'"
            :src="mediaUrl(String(asset.publicUrl))"
            :alt="String(asset.filename)"
            class="w-full h-full object-cover"
          >
          <UiPzIcon v-else :name="String(asset.kind) === 'video' ? 'videocam' : 'description'" class="text-3xl text-on-surface-variant" />
        </div>
        <p class="text-sm font-medium text-on-surface truncate">{{ asset.filename }}</p>
        <p class="text-xs text-on-surface-variant">{{ asset.kind }} · {{ Math.round(Number(asset.sizeBytes) / 1024) }} Ko</p>
        <div class="flex gap-2 mt-2">
          <a :href="mediaUrl(String(asset.publicUrl))" target="_blank" class="text-xs text-secondary font-semibold">Ouvrir</a>
          <button type="button" class="text-xs text-error font-semibold" @click="removeAsset(String(asset.id))">Supprimer</button>
        </div>
      </UiCard>
    </div>

    <AdminPagination :page="meta.page" :total-pages="meta.totalPages" :total="meta.total" @change="load" />
  </div>
</template>
