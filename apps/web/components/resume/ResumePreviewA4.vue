<script setup lang="ts">
import type { ResumeSnapshot } from '@profiloz/shared'
import { resolveTemplateComponent } from '~/features/templates/resolveTemplate'

const props = defineProps<{
  resume: ResumeSnapshot
}>()

const TemplateComponent = computed(() => resolveTemplateComponent(props.resume.templateSlug))
</script>

<template>
  <component :is="TemplateComponent" :resume="resume" />
</template>
