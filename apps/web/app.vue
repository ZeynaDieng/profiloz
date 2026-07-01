<script setup lang="ts">
const route = useRoute()
const isPrintRoute = computed(() => route.path.startsWith('/imprimer/'))
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
