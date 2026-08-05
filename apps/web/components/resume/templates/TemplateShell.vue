<script setup lang="ts">
import type { ResumeSnapshot } from '@profiloz/shared'

defineProps<{
  resume: ResumeSnapshot
  /** Conservé pour compatibilité avec les templates existants. */
  templateName?: string
}>()
</script>

<template>
  <div class="resume-a4 bg-white text-on-surface shadow-xl mx-auto relative transition-all duration-300">
    <slot />
  </div>
</template>

<style scoped>
.resume-a4 {
  width: 210mm;
  min-height: 297mm;
  height: auto;
  padding: 20mm;
  box-sizing: border-box;
  overflow: visible !important;
}
</style>
