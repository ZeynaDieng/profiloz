<script setup lang="ts">
const route = useRoute()
const isPrintRoute = computed(() => route.path.startsWith('/imprimer/'))

useHead({
  meta: [
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1, viewport-fit=cover',
      tagPriority: 100,
    },
  ],
})
</script>

<template>
  <NuxtPage v-if="isPrintRoute" />
  <UApp v-else>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <UiConfirmDialog />
  </UApp>
</template>
