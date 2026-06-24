<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    variant?: 'full' | 'icon'
    to?: string
  }>(),
  { size: 'md', variant: 'full', to: '/' },
)

const sizeClasses: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', string> = {
  xs: 'h-5',
  sm: 'h-10',
  md: 'h-12',
  lg: 'h-14',
  xl: 'h-16',
}
</script>

<template>
  <NuxtLink :to="to" class="inline-flex shrink-0 items-center" aria-label="Profilo'Z — Accueil">
    <img
      :src="variant === 'icon' ? '/logo-icon.png' : '/logo.png'"
      alt="Profilo'Z"
      :class="[sizeClasses[size], 'w-auto object-contain']"
    >
  </NuxtLink>
</template>
