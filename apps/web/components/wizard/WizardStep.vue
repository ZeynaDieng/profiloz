<template>
  <div class="pb-28">
    <slot />
    <WizardFooter
      :next-label="nextLabel"
      :show-back="showBack"
      :show-skip="showSkip"
      :skip-label="skipLabel"
      @continue="$emit('continue')"
      @skip="$emit('skip')"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  nextLabel?: string
  showBack?: boolean
  showSkip?: boolean
  skipLabel?: string
}>()

defineEmits<{ continue: [] ; skip: [] }>()
</script>
