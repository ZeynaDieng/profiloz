<script setup lang="ts">
defineProps<{
  templateName?: string
}>()
</script>

<template>
  <div class="letter-a4 bg-white text-on-surface shadow-xl mx-auto">
    <slot />
    <p v-if="templateName" class="text-[10px] text-on-surface-variant/30 mt-8 text-right">
      {{ templateName }} — Profilo'Z
    </p>
  </div>
</template>

<style scoped>
.letter-a4 {
  width: 210mm;
  min-height: 297mm;
  padding: 20mm;
}
</style>
