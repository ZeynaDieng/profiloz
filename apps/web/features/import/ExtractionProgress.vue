<script setup lang="ts">
import { MSG } from '@profiloz/shared'
import { computed } from 'vue'

const props = defineProps<{ progress?: number }>()

const loadingMessage = computed(() => {
  const steps = MSG.upload.ocrSteps
  const p = props.progress ?? 0
  if (p < 25) return steps[0]
  if (p < 50) return steps[1]
  if (p < 75) return steps[2]
  return steps[3]
})
</script>

<template>
  <div class="flex flex-col items-center text-center space-y-6 w-full max-w-sm mx-auto py-12">
    <div class="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
      <UiPzIcon name="document_scanner" class="text-[32px] animate-pulse" />
    </div>
    <div class="space-y-2 w-full">
      <h2 class="text-xl font-bold text-on-surface">{{ loadingMessage }}</h2>
      <p class="text-on-surface-variant text-sm">Quelques instants suffisent.</p>
      <div class="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden mt-4">
        <div
          class="h-full bg-secondary transition-all duration-700"
          :style="{ width: `${progress ?? 0}%` }"
        />
      </div>
    </div>
  </div>
</template>
