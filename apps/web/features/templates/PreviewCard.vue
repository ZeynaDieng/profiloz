<script setup lang="ts">
import type { ResumeSnapshot, TemplateSlug } from '@profiloz/shared'
import { buildPreviewSnapshot } from '~/features/templates/demoSnapshot'

const props = defineProps<{
  slug: TemplateSlug
  selected?: boolean
  userSnapshot?: ResumeSnapshot | null
}>()

defineEmits<{ select: [slug: TemplateSlug] }>()

const previewResume = computed(() =>
  buildPreviewSnapshot(
    props.slug,
    props.userSnapshot?.templateConfig.accentColor,
    props.userSnapshot,
  ),
)
</script>

<template>
  <button
    type="button"
    class="text-left rounded-2xl border overflow-hidden transition-all w-full"
    :class="
      selected
        ? 'border-secondary shadow-lg ring-2 ring-secondary/20'
        : 'border-outline-variant hover:border-secondary/50'
    "
    @click="$emit('select', slug)"
  >
    <div class="aspect-[3/4] overflow-hidden">
      <FeatureTemplatesA4PreviewFit :resume="previewResume" />
    </div>
    <div class="p-4 flex justify-between items-center bg-surface-container-lowest">
      <slot />
      <UiPzIcon v-if="selected" name="check_circle" class="text-secondary shrink-0" />
    </div>
  </button>
</template>
