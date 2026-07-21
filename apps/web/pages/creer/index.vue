<script setup lang="ts">
import type { TemplateSlug } from '@profiloz/shared'
import { TEMPLATE_SLUGS } from '@profiloz/shared'
import { cvImportLink } from '~/utils/template-links'

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
  <div class="relative overflow-hidden bg-[#F8FAFF] min-h-screen py-10 px-5 sm:px-8">
    <div class="max-w-6xl mx-auto space-y-12 sm:space-y-16">

      <!-- HERO SECTION -->
      <LandingHeroSection />

      <!-- ACTION BUTTONS -->
      <LandingActionButtons
        :create-link="createLink"
        :import-link="importLink"
      />

      <!-- STRIPE-STYLE BENEFITS GRID -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
        <LandingBenefitCard
          icon="bolt"
          title="Rapide"
          subtitle="Moins de 10s"
        />
        <LandingBenefitCard
          icon="shield"
          title="Sécurisé"
          subtitle="Vos données"
        />
        <LandingBenefitCard
          icon="workspace_premium"
          title="Professionnel"
          subtitle="Résultats fiables"
        />
      </div>

    </div>
  </div>
</template>
