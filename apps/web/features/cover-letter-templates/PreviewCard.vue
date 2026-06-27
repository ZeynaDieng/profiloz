<script setup lang="ts">
import type { CoverLetterTemplateSlug } from '~/types/cover-letter'
import { buildCoverLetterDemoSnapshot } from '~/features/cover-letter-templates/demoSnapshot'

const props = defineProps<{
  slug: CoverLetterTemplateSlug
  selected?: boolean
  resumeId?: string | null
}>()

const previewLetter = computed(() => buildCoverLetterDemoSnapshot(props.slug))

const letterLink = computed(() => {
  const base = `/tableau-de-bord/lettres/nouvelle?template=${props.slug}`
  return props.resumeId ? `${base}&resumeId=${props.resumeId}` : base
})
</script>

<template>
  <NuxtLink
    :to="letterLink"
    class="text-left rounded-2xl border overflow-hidden transition-all w-full block"
    :class="
      selected
        ? 'border-secondary shadow-lg ring-2 ring-secondary/20'
        : 'border-outline-variant hover:border-secondary/50'
    "
  >
    <div class="aspect-[3/4] overflow-hidden">
      <FeatureCoverLetterTemplatesA4PreviewFit :letter="previewLetter" />
    </div>
    <div class="p-4 flex justify-between items-center bg-surface-container-lowest">
      <slot />
      <UiPzIcon v-if="selected" name="check_circle" class="text-secondary shrink-0" />
    </div>
  </NuxtLink>
</template>
