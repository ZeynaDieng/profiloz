<script setup lang="ts">
import type { CoverLetterSnapshot } from '~/types/cover-letter'
import { normalizeCoverLetterTemplateSlug } from '~/types/cover-letter'
import { resolveCoverLetterTemplateComponent } from '~/features/cover-letter-templates/resolveTemplate'
import { letterPreviewWrapperStyle } from '~/utils/template-accent-colors'

const props = defineProps<{
  letter?: CoverLetterSnapshot | null
}>()

const snapshot = computed(() => {
  if (!props.letter) return null
  return {
    ...props.letter,
    templateSlug: normalizeCoverLetterTemplateSlug(props.letter.templateSlug),
  }
})

const TemplateComponent = computed(() =>
  snapshot.value ? resolveCoverLetterTemplateComponent(snapshot.value.templateSlug) : null,
)

const wrapperStyle = computed(() =>
  snapshot.value
    ? letterPreviewWrapperStyle(snapshot.value.templateSlug, snapshot.value.accentColor)
    : {},
)
</script>

<template>
  <div v-if="snapshot" :style="wrapperStyle">
    <component :is="TemplateComponent" :letter="snapshot" />
  </div>
</template>
