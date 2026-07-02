<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    photoUrl?: string
    initials?: string
    accent?: string
    shape?: 'circle' | 'rounded' | 'square'
    sizeClass?: string
    fallbackClass?: string
    fallbackStyle?: Record<string, string | undefined>
  }>(),
  {
    accent: '#0051d5',
    shape: 'circle',
    sizeClass: 'w-14 h-14',
    fallbackClass: 'text-white font-bold',
  },
)

const shapeClass = computed(() => {
  if (props.shape === 'rounded') return 'rounded-lg'
  if (props.shape === 'square') return 'rounded'
  return 'rounded-full'
})

const fallbackStyles = computed(() => ({
  backgroundColor: props.accent,
  ...props.fallbackStyle,
}))
</script>

<template>
  <div :class="[sizeClass, shapeClass, 'overflow-hidden shrink-0']">
    <img v-if="photoUrl" :src="photoUrl" alt="" class="w-full h-full object-cover" />
    <div
      v-else
      :class="['w-full h-full flex items-center justify-center', fallbackClass]"
      :style="fallbackStyles"
    >
      <slot name="fallback">{{ initials }}</slot>
    </div>
  </div>
</template>
