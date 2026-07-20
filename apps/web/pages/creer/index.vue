<template>
  <div class="max-w-[480px] mx-auto px-margin-mobile md:px-margin-tablet xl:px-margin-desktop py-stack-lg pb-28 text-center">
    <div class="mb-stack-lg">
      <h1 class="text-2xl sm:text-3xl font-bold text-on-surface mb-3">{{ MSG.guide.createCvTitle }}</h1>
      <p class="text-on-surface-variant">
        {{ selectedTemplate
          ? 'Choisissez comment remplir votre CV avec le modèle sélectionné.'
          : MSG.guide.createCvSubtitle }}
      </p>
    </div>

    <NuxtLink :to="createLink" class="btn-secondary w-full inline-flex items-center justify-center gap-2 min-h-[52px]">
      {{ MSG.guide.createCvCta }}
      <UiPzIcon name="arrow_forward" class="text-[20px]" />
    </NuxtLink>

    <div class="mt-8 space-y-3 text-sm">
      <p>
        <NuxtLink :to="importLink" class="text-secondary font-semibold hover:underline">
          {{ MSG.guide.importCvLink }}
        </NuxtLink>
      </p>
      <p>
        <NuxtLink to="/creer/lettre" class="text-on-surface-variant hover:text-secondary hover:underline">
          {{ MSG.guide.createLetterLink }}
        </NuxtLink>
      </p>
      <p>
        <NuxtLink to="/creer/importer/lettre" class="text-on-surface-variant hover:text-secondary hover:underline">
          {{ MSG.guide.importLetterLink }}
        </NuxtLink>
      </p>
      <p v-if="selectedTemplate">
        <NuxtLink :to="galleryLink" class="text-on-surface-variant hover:text-secondary hover:underline">
          Voir l’aperçu du modèle
        </NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TemplateSlug } from '@profiloz/shared'
import { MSG, TEMPLATE_SLUGS } from '@profiloz/shared'
import { cvCreateLink, cvImportLink, cvTemplateGalleryLink } from '~/utils/template-links'

definePageMeta({ layout: 'wizard' })

useGuestSession()
const resumeStore = useResumeStore()
const route = useRoute()

const selectedTemplate = computed(() => {
  const raw = typeof route.query.template === 'string' ? route.query.template.toUpperCase() : ''
  return TEMPLATE_SLUGS.includes(raw as TemplateSlug) ? (raw as TemplateSlug) : null
})

const createLink = computed(() =>
  selectedTemplate.value ? `/creer/editeur?template=${selectedTemplate.value}` : '/creer/modele',
)
const importLink = computed(() =>
  selectedTemplate.value ? cvImportLink(selectedTemplate.value) : '/creer/importer/cv',
)
const galleryLink = computed(() =>
  selectedTemplate.value ? cvTemplateGalleryLink(selectedTemplate.value) : '/creer/modele',
)

onMounted(async () => {
  resumeStore.rehydrateFromStorage()
  await beginNewPaidDossierCycleIfNeeded().catch(() => {})
  if (selectedTemplate.value && !resumeStore.current?.personalInfo.fullName?.trim()) {
    resumeStore.initDraft()
    resumeStore.setTemplate(selectedTemplate.value)
  }
})
</script>
