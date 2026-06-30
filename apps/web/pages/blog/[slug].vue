<script setup lang="ts">
const route = useRoute()
const config = useRuntimeConfig()

const post = ref<Record<string, unknown> | null>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const result = await $fetch<{ post: Record<string, unknown> }>(`${config.public.apiBaseUrl}/content/blog/${route.params.slug}`)
    post.value = result.post
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <article class="max-w-3xl mx-auto px-margin-mobile md:px-margin-tablet xl:px-margin-desktop py-10">
    <div v-if="loading">
      <UiSkeleton variant="rect" height="20rem" />
    </div>
    <template v-else-if="post">
      <NuxtLink to="/blog" class="text-sm text-secondary font-semibold">← Retour au blog</NuxtLink>
      <h1 class="text-3xl font-bold text-on-surface mt-4">{{ post.title }}</h1>
      <div class="prose prose-sm max-w-none mt-6 whitespace-pre-wrap text-on-surface">{{ post.content }}</div>
    </template>
    <p v-else class="text-on-surface-variant">Article introuvable.</p>
  </article>
</template>
