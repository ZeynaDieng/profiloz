<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string
    compact?: boolean
  }>(),
  { compact: false },
)
</script>

<template>
  <div
    class="product-screen premium-shadow rounded-xl border border-outline-variant/25 bg-surface-container-lowest overflow-hidden"
    :class="compact ? 'text-[10px]' : 'text-xs'"
  >
    <div class="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-container-low border-b border-outline-variant/20">
      <span class="w-2 h-2 rounded-full bg-error/70" />
      <span class="w-2 h-2 rounded-full bg-amber-400/80" />
      <span class="w-2 h-2 rounded-full bg-emerald-500/70" />
      <span v-if="label" class="ml-auto text-[9px] font-medium text-on-surface-variant truncate">{{ label }}</span>
    </div>
    <div class="bg-background">
      <slot />
    </div>
  </div>
</template>
