<script setup lang="ts">
const config = useRuntimeConfig()

useSeoPage({
  title: 'Blog',
  description: "Conseils, astuces et guides pour créer le CV parfait et décrocher l'emploi de vos rêves.",
  keywords: 'blog, conseils CV, astuces emploi, guide lettre de motivation',
})

const posts = ref<Array<Record<string, unknown>>>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const result = await $fetch<{ data: Record<string, unknown>[] }>(`${config.public.apiBaseUrl}/content/blog`)
    posts.value = result.data
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="max-w-container-max mx-auto px-margin-mobile md:px-margin-tablet xl:px-margin-desktop py-10">
    <h1 class="text-3xl font-bold text-on-surface mb-6">Blog Profilo'Z</h1>
    <div v-if="loading" class="space-y-4">
      <UiSkeleton v-for="i in 3" :key="i" variant="rect" height="6rem" />
    </div>
    <div v-else-if="posts.length === 0" class="text-on-surface-variant">
      Aucun article publié pour le moment.
    </div>
    <ul v-else class="space-y-4">
      <li v-for="post in posts" :key="String(post.slug)">
        <NuxtLink :to="`/blog/${post.slug}`" class="block rounded-xl border border-outline-variant/30 p-5 hover:bg-surface-container-lowest">
          <h2 class="text-xl font-semibold text-on-surface">{{ post.title }}</h2>
          <p v-if="post.excerpt" class="text-sm text-on-surface-variant mt-2">{{ post.excerpt }}</p>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
