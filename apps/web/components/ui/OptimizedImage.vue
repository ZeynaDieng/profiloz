<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    src: string
    alt: string
    width?: number | string
    height?: number | string
    loading?: 'lazy' | 'eager'
    imgClass?: string
  }>(),
  {
    loading: 'lazy',
    imgClass: '',
  },
)

const webpSrc = computed(() => {
  if (!props.src.endsWith('.png')) return null
  return props.src.replace(/\.png$/, '.webp')
})
</script>

<template>
  <picture>
    <source v-if="webpSrc" :srcset="webpSrc" type="image/webp">
    <img
      :src="src"
      :alt="alt"
      :width="width"
      :height="height"
      :loading="loading"
      :class="imgClass"
    >
  </picture>
</template>
