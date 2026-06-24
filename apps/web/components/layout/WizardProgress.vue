<script setup lang="ts">
import { FLOW_STEPS } from '~/composables/useWizardNavigation'

const route = useRoute()

const isFlowStep = computed(() =>
  FLOW_STEPS.some((s) => s.path === route.path),
)

const currentIndex = computed(() =>
  FLOW_STEPS.findIndex((s) => s.path === route.path),
)

const currentStep = computed(() =>
  currentIndex.value >= 0 ? FLOW_STEPS[currentIndex.value]! : null,
)

const progressPercent = computed(() => {
  if (currentIndex.value < 0) return 0
  return Math.round(((currentIndex.value + 1) / FLOW_STEPS.length) * 100)
})
</script>

<template>
  <nav v-if="isFlowStep && currentStep" class="px-margin-mobile md:px-margin-desktop max-w-[640px] mx-auto">
    <div class="py-3 sm:py-4 space-y-2">
      <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-sm">
        <span class="font-medium text-on-surface min-w-0 truncate">
          Étape {{ currentStep.step }}/{{ FLOW_STEPS.length }} · {{ currentStep.label }}
        </span>
        <span class="text-on-surface-variant shrink-0">~{{ Math.max(1, FLOW_STEPS.length - currentStep.step) }} min</span>
      </div>
      <div class="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
        <div
          class="h-full bg-secondary rounded-full transition-all duration-300"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>
    </div>
  </nav>
</template>
