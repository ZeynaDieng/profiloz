<script setup lang="ts">
const { goBack, goNext } = useWizardNavigation()

withDefaults(
  defineProps<{
    nextLabel?: string
    showBack?: boolean
    showSkip?: boolean
    skipLabel?: string
    loading?: boolean
  }>(),
  {
    nextLabel: 'Continuer',
    showBack: true,
    showSkip: false,
    skipLabel: 'Passer',
    loading: false,
  },
)

const emit = defineEmits<{ continue: [] ; skip: [] }>()

function onContinue() {
  emit('continue')
}
</script>

<template>
  <footer class="fixed bottom-0 w-full bg-surface-container-lowest border-t border-outline-variant py-stack-md px-margin-mobile md:px-margin-desktop z-40 pb-[max(1rem,env(safe-area-inset-bottom))]">
    <div class="max-w-container-max mx-auto flex justify-between items-center gap-2">
      <button
        v-if="showBack"
        type="button"
        class="min-h-11 px-4 sm:px-6 py-2 rounded-lg text-on-surface-variant font-label-sm hover:bg-surface-container inline-flex items-center gap-2"
        @click="goBack"
      >
        <UiPzIcon name="arrow_back" class="text-[18px]" />
        <span class="hidden sm:inline">Retour</span>
      </button>
      <div v-else />
      <div class="flex items-center gap-2 sm:gap-3">
        <button
          v-if="showSkip"
          type="button"
          class="min-h-11 px-3 sm:px-4 py-2 text-on-surface-variant font-label-sm hover:text-secondary"
          @click="emit('skip')"
        >
          {{ skipLabel }}
        </button>
        <button
          type="button"
          class="min-h-11 px-5 sm:px-8 py-3 rounded-lg bg-secondary text-white font-bold inline-flex items-center gap-2 disabled:opacity-60 text-sm sm:text-base"
          :disabled="loading"
          @click="onContinue"
        >
          <span class="truncate max-w-[140px] sm:max-w-none">{{ nextLabel }}</span>
          <UiPzIcon name="arrow_forward" class="text-[18px] shrink-0" />
        </button>
      </div>
    </div>
  </footer>
</template>
