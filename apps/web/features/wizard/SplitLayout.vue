<script setup lang="ts">
import type { ResumeSnapshot } from '@profiloz/shared'

defineProps<{
  resume: ResumeSnapshot | null
}>()
</script>

<template>
  <div class="flex flex-col lg:flex-row gap-gutter max-w-[1200px] mx-auto w-full">
    <div class="flex-1 min-w-0">
      <slot />
    </div>
    <aside v-if="resume" class="hidden lg:block w-[280px] xl:w-[320px] shrink-0">
      <div class="sticky top-28">
        <p class="text-xs font-bold uppercase tracking-wide text-on-surface-variant mb-2">Aperçu en direct</p>
        <div class="bg-[#F1F5F9] rounded-xl p-3 overflow-hidden">
          <div class="origin-top scale-[0.28] w-[210mm] mx-auto">
            <ResumePreviewA4 :resume="resume" />
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>
