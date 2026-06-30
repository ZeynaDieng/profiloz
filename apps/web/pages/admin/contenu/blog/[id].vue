<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const route = useRoute()
const router = useRouter()
const adminService = useAdminService()
const { confirm } = useConfirm()

const isNew = computed(() => route.params.id === 'new')
const loading = ref(!isNew.value)
const saving = ref(false)
const message = ref('')

const form = ref({
  slug: '',
  title: '',
  excerpt: '',
  content: '',
  status: 'draft',
  seoTitle: '',
  seoDescription: '',
})

async function load() {
  if (isNew.value) return
  loading.value = true
  try {
    const result = await adminService.getBlogPost(String(route.params.id))
    const post = result.post
    form.value = {
      slug: String(post.slug ?? ''),
      title: String(post.title ?? ''),
      excerpt: String(post.excerpt ?? ''),
      content: String(post.content ?? ''),
      status: String(post.status ?? 'draft'),
      seoTitle: String(post.seoTitle ?? ''),
      seoDescription: String(post.seoDescription ?? ''),
    }
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  message.value = ''
  try {
    if (isNew.value) {
      const result = await adminService.createBlogPost(form.value)
      await router.replace(`/admin/contenu/blog/${result.post.id}`)
      message.value = 'Article créé.'
    } else {
      await adminService.updateBlogPost(String(route.params.id), form.value)
      message.value = 'Article enregistré.'
    }
  } catch {
    message.value = 'Échec de l’enregistrement.'
  } finally {
    saving.value = false
  }
}

async function removePost() {
  if (isNew.value) return
  const accepted = await confirm('Action définitive.', {
    title: 'Supprimer l’article ?',
    confirmLabel: 'Supprimer',
    destructive: true,
  })
  if (!accepted) return
  await adminService.deleteBlogPost(String(route.params.id))
  await router.push('/admin/contenu/blog')
}

onMounted(load)
</script>

<template>
  <div>
    <AdminPageHeader :title="isNew ? 'Nouvel article' : 'Éditer l’article'" subtitle="Contenu, statut et SEO.">
      <template #actions>
        <button v-if="!isNew" type="button" class="text-sm text-error font-semibold mr-2" @click="removePost">Supprimer</button>
        <button type="button" class="btn-primary text-sm" :disabled="saving" @click="save">{{ saving ? 'Enregistrement…' : 'Enregistrer' }}</button>
      </template>
    </AdminPageHeader>

    <UiMessageBanner v-if="message" variant="success" :message="message" class="mb-4" />

    <div v-if="loading" class="space-y-3">
      <UiSkeleton variant="rect" height="24rem" />
    </div>

    <UiCard v-else padding="md" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label class="block text-sm">
          <span class="font-semibold">Titre</span>
          <input v-model="form.title" type="text" class="mt-1 w-full rounded-lg border border-outline-variant/40 px-3 py-2">
        </label>
        <label class="block text-sm">
          <span class="font-semibold">Slug</span>
          <input v-model="form.slug" type="text" class="mt-1 w-full rounded-lg border border-outline-variant/40 px-3 py-2" :disabled="!isNew">
        </label>
      </div>
      <label class="block text-sm">
        <span class="font-semibold">Extrait</span>
        <textarea v-model="form.excerpt" rows="2" class="mt-1 w-full rounded-lg border border-outline-variant/40 px-3 py-2" />
      </label>
      <label class="block text-sm">
        <span class="font-semibold">Contenu</span>
        <textarea v-model="form.content" rows="14" class="mt-1 w-full rounded-lg border border-outline-variant/40 px-3 py-2 font-mono text-xs" />
      </label>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label class="block text-sm">
          <span class="font-semibold">Statut</span>
          <select v-model="form.status" class="mt-1 w-full rounded-lg border border-outline-variant/40 px-3 py-2">
            <option value="draft">Brouillon</option>
            <option value="published">Publié</option>
            <option value="scheduled">Programmé</option>
          </select>
        </label>
        <label class="block text-sm md:col-span-2">
          <span class="font-semibold">SEO title</span>
          <input v-model="form.seoTitle" type="text" class="mt-1 w-full rounded-lg border border-outline-variant/40 px-3 py-2">
        </label>
      </div>
      <label class="block text-sm">
        <span class="font-semibold">SEO description</span>
        <textarea v-model="form.seoDescription" rows="2" class="mt-1 w-full rounded-lg border border-outline-variant/40 px-3 py-2" />
      </label>
    </UiCard>
  </div>
</template>
