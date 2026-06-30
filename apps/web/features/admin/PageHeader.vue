<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<template>
  <header class="mb-stack-lg flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
    <div>
      <h1 class="text-2xl md:text-3xl font-bold text-on-surface">{{ title }}</h1>
      <p v-if="subtitle" class="text-on-surface-variant mt-1">{{ subtitle }}</p>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <slot name="actions" />
    </div>
  </header>
</template>
