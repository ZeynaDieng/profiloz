<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const adminService = useAdminService()
const router = useRouter()
const { confirm } = useConfirm()
const { formatDate } = useAdminFormat()

const rows = ref<Record<string, unknown>[]>([])
const meta = ref({ page: 1, totalPages: 1, total: 0, limit: 20 })
const loading = ref(true)
const q = ref('')

async function load(page = 1) {
  loading.value = true
  try {
    const result = await adminService.listBlogPosts({ page, q: q.value || undefined })
    rows.value = result.data
    meta.value = result.meta
  } finally {
    loading.value = false
  }
}

async function removePost(id: string) {
  const accepted = await confirm('Action définitive.', {
    title: 'Supprimer l’article ?',
    confirmLabel: 'Supprimer',
    destructive: true,
  })
  if (!accepted) return
  await adminService.deleteBlogPost(id)
  await load(meta.value.page)
}

onMounted(() => load(1))

const columns = [
  { key: 'title', label: 'Titre' },
  { key: 'status', label: 'Statut' },
  { key: 'updatedAt', label: 'Modifié' },
  { key: 'actions', label: 'Actions', class: 'md:col-span-1' },
]
</script>

<template>
  <div>
    <AdminPageHeader title="Blog" subtitle="Articles publics administrables.">
      <template #actions>
        <input v-model="q" type="search" placeholder="Rechercher…" class="rounded-lg border border-outline-variant/40 px-3 py-2 text-sm" @keyup.enter="load(1)">
        <NuxtLink to="/admin/contenu/blog/new" class="btn-primary text-sm">Nouvel article</NuxtLink>
      </template>
    </AdminPageHeader>

    <AdminDataTable :columns="columns" :rows="rows" :loading="loading">
      <template #cell-updatedAt="{ row }">{{ formatDate(row.updatedAt as string) }}</template>
      <template #cell-actions="{ row }">
        <div class="flex flex-wrap gap-2">
          <NuxtLink :to="`/admin/contenu/blog/${row.id}`" class="text-sm text-secondary font-semibold hover:underline">Éditer</NuxtLink>
          <button type="button" class="text-sm text-error font-semibold" @click="removePost(String(row.id))">Supprimer</button>
        </div>
      </template>
    </AdminDataTable>

    <AdminPagination :page="meta.page" :total-pages="meta.totalPages" :total="meta.total" @change="load" />
  </div>
</template>
