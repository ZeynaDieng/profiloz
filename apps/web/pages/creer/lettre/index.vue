<script setup lang="ts">
import type { CoverLetterTemplateSlug } from '~/types/cover-letter'
import { MSG } from '@profiloz/shared'
import { COVER_LETTER_TEMPLATE_REGISTRY } from '~/features/cover-letter-templates/registry'
import { letterCreateLink, letterImportLink } from '~/utils/template-links'

definePageMeta({ layout: 'wizard' })

useGuestSession()
const coverLetterStore = useCoverLetterStore()
const resumeStore = useResumeStore()
const route = useRoute()

const letterSlugs = COVER_LETTER_TEMPLATE_REGISTRY.map((t) => t.slug)

const selectedTemplate = computed(() => {
  const raw = typeof route.query.template === 'string' ? route.query.template.toUpperCase() : ''
  return letterSlugs.includes(raw as CoverLetterTemplateSlug)
    ? (raw as CoverLetterTemplateSlug)
    : null
})

const createLink = computed(() =>
  selectedTemplate.value ? letterCreateLink(selectedTemplate.value) : '/creer/lettre/modele',
)
const importLink = computed(() =>
  selectedTemplate.value ? letterImportLink(selectedTemplate.value) : '/creer/importer/lettre',
)

onMounted(() => {
  resumeStore.rehydrateFromStorage()
  coverLetterStore.rehydrateFromStorage()
  if (selectedTemplate.value) {
    coverLetterStore.initDraft()
    coverLetterStore.setTemplate(selectedTemplate.value)
  }
})
</script>

<template>
  <div class="max-w-[480px] mx-auto px-margin-mobile md:px-margin-tablet xl:px-margin-desktop py-stack-lg pb-28 text-center">
    <div class="mb-stack-lg">
      <h1 class="text-2xl sm:text-3xl font-bold text-on-surface mb-3">{{ MSG.guide.createLetterTitle }}</h1>
      <p class="text-on-surface-variant">
        {{ selectedTemplate
          ? 'Rédigez votre lettre ou importez un document existant avec le modèle choisi.'
          : MSG.guide.createLetterSubtitle }}
      </p>
    </div>

    <NuxtLink
      :to="createLink"
      class="btn-secondary w-full inline-flex items-center justify-center gap-2 min-h-[52px]"
    >
      {{ MSG.guide.createLetterCta }}
      <UiPzIcon name="arrow_forward" class="text-[20px]" />
    </NuxtLink>

    <div class="mt-8 space-y-3 text-sm">
      <p>
        <NuxtLink :to="importLink" class="text-secondary font-semibold hover:underline">
          {{ MSG.guide.importLetterLink }}
        </NuxtLink>
      </p>
      <p>
        <NuxtLink to="/creer" class="text-on-surface-variant hover:text-secondary hover:underline">
          {{ MSG.guide.createCvLink }}
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
