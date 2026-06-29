<script setup lang="ts">
import { TEMPLATE_FILTERS, TEMPLATE_REGISTRY } from '~/features/templates/registry'

definePageMeta({ layout: 'dashboard' })

const authStore = useAuthStore()
const activeFilter = ref('all')

const filteredTemplates = computed(() => {
  if (activeFilter.value === 'all') return TEMPLATE_REGISTRY
  return TEMPLATE_REGISTRY.filter((t) => t.category === activeFilter.value)
})

onMounted(() => {
  authStore.loadFromStorage()
  if (!authStore.isAuthenticated) navigateTo('/connexion')
})
</script>

<template>
  <div class="page-container">
    <header class="mb-stack-lg">
      <h1 class="text-2xl sm:text-3xl font-bold text-on-surface">Modèles de CV</h1>
      <p class="text-on-surface-variant mt-1 text-sm sm:text-base">
        Parcourez les {{ TEMPLATE_REGISTRY.length }} modèles disponibles pour votre prochain CV.
      </p>
    </header>

    <div class="flex gap-2 mb-stack-lg overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
      <button
        v-for="filter in TEMPLATE_FILTERS"
        :key="filter.id"
        type="button"
        class="shrink-0 min-h-11 px-4 py-2 rounded-full text-sm font-semibold border transition-colors"
        :class="
          activeFilter === filter.id
            ? 'bg-secondary text-white border-secondary'
            : 'border-outline-variant text-on-surface-variant hover:border-secondary'
        "
        @click="activeFilter = filter.id"
      >
        {{ filter.label }}
      </button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter">
      <article
        v-for="template in filteredTemplates"
        :key="template.slug"
        class="glass-card rounded-xl border border-outline-variant overflow-hidden hover:border-secondary transition-colors"
      >
        <div class="aspect-[3/4] bg-gradient-to-b from-surface-container-high to-surface-container flex items-center justify-center p-6">
          <span class="text-center font-bold text-on-surface">{{ template.name }}</span>
        </div>
        <div class="p-4">
          <h2 class="font-bold text-on-surface">{{ template.name }}</h2>
          <p class="text-xs text-on-surface-variant mt-1">{{ template.category }}</p>
          <NuxtLink :to="`/creer/modele?select=${template.slug}`" class="block mt-3">
            <UiButton variant="secondary" size="sm" block>
              Utiliser ce modèle
            </UiButton>
          </NuxtLink>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
</style>
