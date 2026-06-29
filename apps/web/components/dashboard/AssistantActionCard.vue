<script setup lang="ts">
defineProps<{
  to: string
  icon: string
  title: string
  description: string
}>()
</script>

<template>
  <NuxtLink
    :to="to"
    class="flex items-start gap-4 p-stack-md rounded-2xl border border-outline-variant/30 bg-surface-container-lowest hover:border-secondary hover:bg-secondary/5 transition-colors min-h-[88px] pz-card"
  >
    <div class="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary shrink-0">
      <UiPzIcon :name="icon" />
    </div>
    <div class="min-w-0">
      <h2 class="font-bold text-base sm:text-lg text-on-surface mb-1">{{ title }}</h2>
      <p class="text-on-surface-variant text-sm">{{ description }}</p>
    </div>
    <UiPzIcon name="chevron_right" class="ml-auto shrink-0 text-on-surface-variant/50 self-center" />
  </NuxtLink>
</template>
