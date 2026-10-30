<script setup lang="ts">
import UiTemplatePreviewEye from '~/components/ui/TemplatePreviewEye.vue'
import type { CoverLetterTemplateSlug } from '~/types/cover-letter'
import { buildCoverLetterDemoSnapshot } from '~/features/cover-letter-templates/demoSnapshot'

const props = defineProps<{
  slug: CoverLetterTemplateSlug
  selected?: boolean
  resumeId?: string | null
  /** Nom du modèle : affiche l'œil « voir en grand » (événement `preview`). */
  previewLabel?: string
}>()

defineEmits<{ select: [slug: CoverLetterTemplateSlug]; preview: [slug: CoverLetterTemplateSlug] }>()

const previewLetter = computed(() => buildCoverLetterDemoSnapshot(props.slug))
</script>

<template>
  <div class="group relative">
    <button
      type="button"
      class="text-left rounded-2xl border overflow-hidden transition-all w-full block bg-surface-container-lowest"
      :class="
        selected
          ? 'border-secondary shadow-lg ring-2 ring-secondary/20'
          : 'border-outline-variant hover:border-secondary/50'
      "
      @click="$emit('select', slug)"
    >
      <div class="relative aspect-[3/4] overflow-hidden border-b border-outline-variant/60">
        <UiA4Sheet>
          <CoverLetterPreviewA4 :letter="previewLetter" />
        </UiA4Sheet>
      </div>
      <div class="p-2.5 sm:p-4 flex justify-between items-center min-w-0">
        <slot />
        <UiPzIcon v-if="selected" name="check_circle" class="text-secondary shrink-0 text-base sm:text-lg ml-1" />
      </div>
    </button>
    <div v-if="previewLabel" class="pointer-events-none absolute inset-x-0 top-0 aspect-[3/4] flex items-center justify-center">
      <UiTemplatePreviewEye :label="previewLabel" @click="$emit('preview', slug)" />
    </div>
  </div>
</template>
