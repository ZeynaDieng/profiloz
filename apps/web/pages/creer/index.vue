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

<template>
  <div class="max-w-[480px] mx-auto px-4 sm:px-6 py-10 sm:py-16 text-center">
    <!-- En-tête de la page -->
    <div class="mb-8 space-y-2">
      <h1 class="text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
        {{ MSG.guide.createCvTitle }}
      </h1>
      <p class="text-sm sm:text-base text-[#64748B] font-medium leading-relaxed">
        {{ selectedTemplate
          ? 'Choisissez comment remplir votre CV avec le modèle sélectionné.'
          : MSG.guide.createCvSubtitle }}
      </p>
    </div>

    <!-- Bouton d'action principal -->
    <NuxtLink :to="createLink" class="block w-full">
      <button
        type="button"
        class="w-full h-[56px] rounded-[16px] bg-[#2F5BFF] hover:bg-[#2452FF] text-white font-extrabold text-base shadow-[0_8px_25px_rgba(47,91,255,0.3)] hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
      >
        <span>{{ MSG.guide.createCvCta }}</span>
        <UiPzIcon name="arrow_forward" class="text-xl" />
      </button>
    </NuxtLink>

    <!-- Liens d'actions secondaires -->
    <div class="mt-8 space-y-3.5 text-sm font-medium">
      <p>
        <NuxtLink :to="importLink" class="text-[#2F5BFF] font-extrabold hover:underline">
          {{ MSG.guide.importCvLink }}
        </NuxtLink>
      </p>
      <p>
        <NuxtLink to="/creer/lettre" class="text-[#64748B] hover:text-[#0F172A] hover:underline">
          {{ MSG.guide.createLetterLink }}
        </NuxtLink>
      </p>
      <p>
        <NuxtLink to="/creer/importer/lettre" class="text-[#64748B] hover:text-[#0F172A] hover:underline">
          {{ MSG.guide.importLetterLink }}
        </NuxtLink>
      </p>
      <p v-if="selectedTemplate">
        <NuxtLink :to="galleryLink" class="text-[#64748B] hover:text-[#0F172A] hover:underline">
          Voir l’aperçu du modèle
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
