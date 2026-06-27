<script setup lang="ts">
import type { CoverLetterSnapshot } from '~/types/cover-letter'
import { normalizeCoverLetterTemplateSlug } from '~/types/cover-letter'
import { resolveCoverLetterTemplateComponent } from '~/features/cover-letter-templates/resolveTemplate'

const props = defineProps<{
  letter: CoverLetterSnapshot
}>()

const snapshot = computed(() => ({
  ...props.letter,
  templateSlug: normalizeCoverLetterTemplateSlug(props.letter.templateSlug),
}))

const TemplateComponent = computed(() => resolveCoverLetterTemplateComponent(snapshot.value.templateSlug))
</script>

<template>
  <component :is="TemplateComponent" :letter="snapshot" />
</template>
