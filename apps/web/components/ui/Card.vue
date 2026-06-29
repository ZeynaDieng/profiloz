<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'default' | 'glass' | 'bento'
    padding?: 'sm' | 'md' | 'lg'
    interactive?: boolean
    noHoverMotion?: boolean
  }>(),
  {
    variant: 'default',
    padding: 'md',
    interactive: false,
    noHoverMotion: false,
  },
)

const paddingClass = {
  sm: 'p-stack-sm',
  md: 'p-stack-md',
  lg: 'p-stack-lg',
} as const

const variantClass = {
  default: 'bg-surface-container-lowest border border-outline-variant',
  glass: 'glass-card border border-outline-variant',
  bento: 'bento-card bg-surface-container-lowest border border-outline-variant/30',
} as const
</script>

<template>
  <article
    class="rounded-xl pz-card"
    :class="[
      variantClass[variant],
      paddingClass[padding],
      interactive && 'cursor-pointer',
      noHoverMotion && 'no-hover-motion',
    ]"
  >
    <slot />
  </article>
</template>
