<script setup lang="ts">
import type { CoverLetterSnapshot } from '~/types/cover-letter'
import { normalizeCoverLetterTemplateSlug } from '~/types/cover-letter'
import { resolveCoverLetterTemplateComponent } from '~/features/cover-letter-templates/resolveTemplate'
import { letterPreviewWrapperStyle } from '~/utils/template-accent-colors'

const props = defineProps<{
  letter: CoverLetterSnapshot
}>()

const snapshot = computed(() => ({
  ...props.letter,
  templateSlug: normalizeCoverLetterTemplateSlug(props.letter.templateSlug),
}))

const TemplateComponent = computed(() => resolveCoverLetterTemplateComponent(snapshot.value.templateSlug))

const wrapperStyle = computed(() =>
  letterPreviewWrapperStyle(snapshot.value.templateSlug, snapshot.value.accentColor),
)
</script>

<template>
  <div :style="wrapperStyle">
    <component :is="TemplateComponent" :letter="snapshot" />
  </div>
</template>
