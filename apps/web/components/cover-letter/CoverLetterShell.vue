<script setup lang="ts">
defineProps<{
  /** Conservé pour compatibilité avec les templates existants. */
  templateName?: string
}>()
</script>

<template>
  <div class="letter-a4 bg-white text-on-surface shadow-xl mx-auto">
    <slot />
  </div>
</template>

<style scoped>
.letter-a4 {
  width: 210mm;
  min-height: 297mm;
  padding: 20mm;
}
</style>
