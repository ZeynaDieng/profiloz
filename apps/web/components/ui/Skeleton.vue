<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'text' | 'rect' | 'circle' | 'card'
    width?: string
    height?: string
    lines?: number
  }>(),
  {
    variant: 'rect',
    width: '100%',
    height: '1rem',
    lines: 3,
  },
)
</script>

<template>
  <div
    v-if="variant === 'text'"
    class="space-y-2"
    aria-hidden="true"
  >
    <div
      v-for="i in lines"
      :key="i"
      class="skeleton h-4"
      :style="{ width: i === lines ? '70%' : '100%' }"
    />
  </div>

  <div
    v-else-if="variant === 'circle'"
    class="skeleton rounded-full shrink-0"
    :style="{ width, height }"
    aria-hidden="true"
  />

  <div
    v-else-if="variant === 'card'"
    class="rounded-xl border border-outline-variant/30 overflow-hidden"
    aria-hidden="true"
  >
    <div class="skeleton aspect-[3/4]" />
    <div class="p-4 space-y-2">
      <div class="skeleton h-4 w-2/3" />
      <div class="skeleton h-3 w-1/2" />
    </div>
  </div>

  <div
    v-else
    class="skeleton"
    :style="{ width, height }"
    aria-hidden="true"
  />
</template>
