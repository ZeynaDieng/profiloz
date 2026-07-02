<script setup lang="ts">
import type { ResumeSnapshot } from '@profiloz/shared'

defineProps<{
  resume: ResumeSnapshot | null
}>()

const previewOpen = ref(false)
const { isDesktop } = useBreakpoints()
</script>

<template>
  <div class="flex flex-col xl:flex-row gap-gutter max-w-[1200px] mx-auto w-full min-w-0 px-margin-mobile md:px-margin-tablet xl:px-margin-desktop">
    <div class="flex-1 min-w-0">
      <slot />
    </div>

    <!-- Desktop : aperçu latéral -->
    <aside v-if="resume && isDesktop" class="w-[320px] shrink-0 min-w-0">
      <div class="sticky top-28">
        <p class="text-xs font-bold uppercase tracking-wide text-on-surface-variant mb-2">
          Aperçu en direct
        </p>
        <div class="bg-[#F1F5F9] rounded-xl overflow-hidden border border-outline-variant/20 h-[min(70vh,520px)]">
          <FeatureTemplatesA4PreviewFit :resume="resume" />
        </div>
      </div>
    </aside>

    <!-- Mobile & tablette : FAB aperçu plein écran -->
    <button
      v-if="resume && !isDesktop"
      type="button"
      class="fixed bottom-[calc(var(--spacing-bottom-nav)+1rem)] right-4 z-30 flex items-center gap-2 px-4 py-3 rounded-full bg-secondary text-on-secondary font-bold text-sm shadow-lg pz-btn"
      @click="previewOpen = true"
    >
      <UiPzIcon name="visibility" />
      Aperçu
    </button>

    <UiFullScreenSheet v-if="resume" v-model:open="previewOpen" title="Aperçu en direct">
      <div class="h-full min-h-[70vh] bg-[#F1F5F9]">
        <FeatureTemplatesA4PreviewFit :resume="resume" />
      </div>
      <template #footer>
        <UiButton variant="secondary" block @click="previewOpen = false">
          Retour au formulaire
        </UiButton>
      </template>
    </UiFullScreenSheet>
  </div>
</template>
