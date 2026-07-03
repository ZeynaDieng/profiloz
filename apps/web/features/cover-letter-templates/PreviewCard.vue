<script setup lang="ts">
import type { CoverLetterTemplateSlug } from '~/types/cover-letter'
import { buildCoverLetterDemoSnapshot } from '~/features/cover-letter-templates/demoSnapshot'
import { letterPreviewWrapperStyle } from '~/utils/template-accent-colors'

const props = defineProps<{
  slug: CoverLetterTemplateSlug
  selected?: boolean
  resumeId?: string | null
}>()

defineEmits<{ select: [slug: CoverLetterTemplateSlug] }>()

const previewLetter = computed(() => buildCoverLetterDemoSnapshot(props.slug))
const previewStyle = computed(() => letterPreviewWrapperStyle(props.slug))
</script>

<template>
  <button
    type="button"
    class="text-left rounded-2xl border overflow-hidden transition-all w-full block"
    :class="
      selected
        ? 'border-secondary shadow-lg ring-2 ring-secondary/20'
        : 'border-outline-variant hover:border-secondary/50'
    "
    @click="$emit('select', slug)"
  >
    <div class="aspect-[3/4] overflow-hidden preview-canvas-bg--landing" :style="previewStyle">
      <FeatureCoverLetterTemplatesA4PreviewFit :letter="previewLetter" />
    </div>
    <div class="p-4 flex justify-between items-center bg-surface-container-lowest">
      <slot />
      <UiPzIcon v-if="selected" name="check_circle" class="text-secondary shrink-0" />
    </div>
  </button>
</template>
