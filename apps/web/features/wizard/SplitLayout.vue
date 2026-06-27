<script setup lang="ts">
import type { ResumeSnapshot } from '@profiloz/shared'

defineProps<{
  resume: ResumeSnapshot | null
}>()
</script>

<template>
  <div class="flex flex-col lg:flex-row gap-gutter max-w-[1200px] mx-auto w-full min-w-0 px-margin-mobile md:px-margin-desktop">
    <div class="flex-1 min-w-0">
      <slot />
    </div>
    <aside v-if="resume" class="hidden md:block w-[280px] xl:w-[320px] shrink-0 min-w-0">
      <div class="sticky top-28">
        <p class="text-xs font-bold uppercase tracking-wide text-on-surface-variant mb-2">
          Aperçu en direct
        </p>
        <div class="bg-[#F1F5F9] rounded-xl overflow-hidden border border-outline-variant/20 h-[380px] xl:h-[420px]">
          <FeatureTemplatesA4PreviewFit :resume="resume" />
        </div>
      </div>
    </aside>
  </div>
</template>
