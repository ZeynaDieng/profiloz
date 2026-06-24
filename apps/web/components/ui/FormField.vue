<template>
  <div>
    <label v-if="label" class="font-label-sm text-on-surface block mb-2">
      {{ label }}
      <span v-if="required" class="text-error">*</span>
    </label>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label?: string
  required?: boolean
}>()
</script>
