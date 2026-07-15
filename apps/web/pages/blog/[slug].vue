<script setup lang="ts">
const route = useRoute()
const config = useRuntimeConfig()

const post = ref<Record<string, unknown> | null>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const result = await $fetch<{ post: Record<string, unknown> }>(`${config.public.apiBaseUrl}/content/blog/${route.params.slug}`)
    post.value = result.post

    // SEO dynamique après chargement
    if (post.value) {
      useSeoPage({
        title: String(post.value.title || 'Article'),
        description: String(post.value.excerpt || post.value.title || ''),
        type: 'article',
        publishedTime: post.value.createdAt ? String(post.value.createdAt) : undefined,
        modifiedTime: post.value.updatedAt ? String(post.value.updatedAt) : undefined,
        keywords: 'blog, CV, emploi, conseils',
      })

      // Schema.org Article
      useSchemaOrg([
        defineArticle({
          headline: String(post.value.title),
          description: String(post.value.excerpt || ''),
          datePublished: post.value.createdAt ? String(post.value.createdAt) : undefined,
          dateModified: post.value.updatedAt ? String(post.value.updatedAt) : undefined,
          author: {
            '@type': 'Organization',
            name: "Profilo'Z",
          },
        }),
      ])
    }
  } finally {
    loading.value = false
  }
})

// Fallback SEO avant le chargement
useSeoPage({
  title: 'Article',
  description: "Lisez nos articles et conseils pour créer le CV parfait sur Profilo'Z.",
  type: 'article',
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
