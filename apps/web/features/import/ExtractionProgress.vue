<script setup lang="ts">
defineProps<{ progress?: number }>()
</script>

<template>
  <div class="flex flex-col items-center text-center space-y-6 w-full max-w-sm mx-auto py-12">
    <div class="w-16 h-16 rounded-full bg-[#14B8A6]/10 flex items-center justify-center text-[#14B8A6] animate-pulse">
      <UiPzIcon name="clinical_notes" class="text-[32px]" />
    </div>
    <div class="space-y-2 w-full">
      <h2 class="text-xl font-bold text-on-surface">Extraction en cours...</h2>
      <p class="text-on-surface-variant text-sm">Analyse de votre document</p>
      <div class="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden mt-4">
        <div
          class="h-full bg-[#14B8A6] transition-all duration-700"
          :style="{ width: `${progress ?? 0}%` }"
        />
      </div>
    </div>
  </div>
</template>
