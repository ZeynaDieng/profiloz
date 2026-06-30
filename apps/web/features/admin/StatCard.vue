<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label: string
    value: string | number
    hint?: string
    trend?: string
    icon?: string
  }>(),
  {},
)
</script>

<template>
  <UiCard padding="lg" class="bento-card h-full">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-sm text-on-surface-variant">{{ props.label }}</p>
        <p class="text-2xl md:text-3xl font-bold text-on-surface mt-1 truncate">{{ props.value }}</p>
        <p v-if="props.hint" class="text-xs text-on-surface-variant mt-1">{{ props.hint }}</p>
        <p v-if="props.trend" class="text-xs font-semibold text-secondary mt-1">{{ props.trend }}</p>
      </div>
      <div v-if="props.icon" class="shrink-0 w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
        <UiPzIcon :name="props.icon" />
      </div>
    </div>
  </UiCard>
</template>
