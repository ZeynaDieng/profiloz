<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    name: string
    filled?: boolean
    class?: string
  }>(),
  { filled: false },
)

const filledStyle = {
  fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24",
}
</script>

<template>
  <span
    class="material-symbols-outlined inline-block align-middle"
    :class="props.class"
    :style="props.filled ? filledStyle : undefined"
  >
    {{ props.name }}
  </span>
</template>
