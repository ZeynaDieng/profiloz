<script setup lang="ts">
import { useWizardStepHandlers, useWizardStepState } from '~/composables/useWizardStep'

const route = useRoute()
const config = useWizardStepState()
const handlers = useWizardStepHandlers()

const showFooter = computed(() => route.meta.wizardFooter === true)

async function onContinue() {
  await handlers.value.onContinue?.()
}

async function onSkip() {
  await handlers.value.onSkip?.()
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <LayoutAppHeader variant="minimal" exit-to="/" />
    <LayoutWizardProgress />
    <main class="flex-1 pb-28">
      <slot />
    </main>
    <WizardFooter
      v-if="showFooter"
      :next-label="config.nextLabel"
      :show-back="config.showBack"
      :show-skip="config.showSkip"
      :skip-label="config.skipLabel"
      :loading="config.loading"
      @continue="onContinue"
      @skip="onSkip"
    />
  </div>
</template>
