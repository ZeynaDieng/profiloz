<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    threshold?: number
    tag?: string
  }>(),
  { threshold: 0.25, tag: 'div' },
)

const { target, revealed } = useScrollReveal(props.threshold)
</script>

<template>
  <component
    :is="tag"
    ref="target"
    :class="revealed ? 'scroll-reveal is-revealed' : 'scroll-reveal'"
  >
    <slot />
  </component>
</template>
