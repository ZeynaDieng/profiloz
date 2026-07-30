<script setup lang="ts">
import type { ResumeSnapshot } from '@profiloz/shared'
import { resolveTemplateComponent } from '~/features/templates/resolveTemplate'

const props = defineProps<{
  resume?: ResumeSnapshot | null
}>()

const templateSlug = computed(() => props.resume?.templateSlug ?? 'PROFESSIONNEL')
const TemplateComponent = computed(() => resolveTemplateComponent(templateSlug.value))
</script>

<template>
  <component :is="TemplateComponent" v-if="resume" :resume="resume" />
</template>
