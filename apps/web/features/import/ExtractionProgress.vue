<script setup lang="ts">
import { MSG } from '@profiloz/shared'
import { computed } from 'vue'

const props = defineProps<{ progress?: number; stage?: number }>()

const steps = MSG.upload.ocrSteps

const activeStage = computed(() => {
  if (typeof props.stage === 'number') return Math.min(steps.length - 1, Math.max(0, props.stage))
  const p = props.progress ?? 0
  if (p < 20) return 0
  if (p < 40) return 1
  if (p < 60) return 2
  if (p < 85) return 3
  return 4
})

const loadingMessage = computed(() => steps[activeStage.value] ?? steps[0])
</script>

<template>
  <div class="flex flex-col items-center text-center space-y-6 w-full max-w-md mx-auto py-12">
    <div class="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
      <UiPzIcon name="document_scanner" class="text-[32px] animate-pulse" />
    </div>
    <div class="space-y-4 w-full">
      <h2 class="text-xl font-bold text-on-surface">{{ loadingMessage }}</h2>
      <p class="text-on-surface-variant text-sm">Quelques instants suffisent.</p>
      <div class="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
        <div
          class="h-full bg-secondary transition-all duration-700"
          :style="{ width: `${progress ?? 0}%` }"
        />
      </div>
      <ol class="text-left space-y-2 pt-2">
        <li
          v-for="(step, index) in steps"
          :key="step"
          class="flex items-center gap-2 text-xs"
          :class="index <= activeStage ? 'text-on-surface font-medium' : 'text-on-surface-variant'"
        >
          <UiPzIcon
            :name="index < activeStage ? 'check_circle' : index === activeStage ? 'progress_activity' : 'radio_button_unchecked'"
            class="text-[14px] shrink-0"
            :class="index === activeStage ? 'animate-spin' : ''"
          />
          {{ step.replace('…', '') }}
        </li>
      </ol>
    </div>
  </div>
</template>
