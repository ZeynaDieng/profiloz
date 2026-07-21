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
  <div class="max-w-[480px] mx-auto px-4 py-8 sm:py-12 space-y-6 text-center">

    <!-- EN-TÊTE DE PAGE -->
    <div class="space-y-2 mb-2">
      <h1 class="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
        {{ MSG.guide.createLetterTitle }}
      </h1>

      <p class="text-xs sm:text-sm text-[#64748B] font-medium leading-relaxed max-w-sm mx-auto">
        {{ selectedTemplate
          ? 'Rédigez votre lettre ou importez un document existant avec le modèle choisi.'
          : MSG.guide.createLetterSubtitle }}
      </p>
    </div>

    <!-- BOUTON D'ACTION PRINCIPAL -->
    <NuxtLink :to="createLink" class="block w-full">
      <button
        type="button"
        class="w-full h-[58px] rounded-[18px] bg-gradient-to-r from-[#2F5BFF] to-[#2452FF] text-white font-extrabold text-base shadow-[0_10px_30px_rgba(47,91,255,0.32)] hover:-translate-y-0.5 hover:shadow-[0_15px_35px_rgba(47,91,255,0.4)] transition-all duration-300 flex items-center justify-center gap-2.5 active:scale-[0.98] cursor-pointer"
      >
        <span>{{ MSG.guide.createLetterCta }}</span>
        <UiPzIcon name="arrow_forward" class="text-xl" />
      </button>
    </NuxtLink>

    <!-- CARTES D'OPTIONS SECONDAIRES -->
    <div class="space-y-3 pt-1">
      <!-- Card 1: Importer une lettre existante -->
      <NuxtLink :to="importLink" class="block w-full">
        <div class="p-4 rounded-[18px] bg-white border border-[rgba(37,99,235,0.08)] shadow-[0_4px_20px_rgba(30,64,175,0.04)] hover:border-[#2F5BFF]/40 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 flex items-center justify-between cursor-pointer group">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-[#EEF4FF] text-[#2F5BFF] flex items-center justify-center shrink-0">
              <UiPzIcon name="file_download" class="text-lg font-bold" />
            </div>
            <div class="text-left">
              <h4 class="font-extrabold text-sm text-[#0F172A] group-hover:text-[#2F5BFF] transition-colors">
                {{ MSG.guide.importLetterLink }}
              </h4>
              <p class="text-[11px] text-[#64748B]">Améliorer une lettre existante</p>
            </div>
          </div>
          <UiPzIcon name="chevron_right" class="text-base text-[#64748B] group-hover:translate-x-1 transition-transform" />
        </div>
      </NuxtLink>

      <!-- Card 2: Créer un CV à la place -->
      <NuxtLink to="/creer" class="block w-full">
        <div class="p-4 rounded-[18px] bg-white border border-[rgba(37,99,235,0.08)] shadow-[0_4px_20px_rgba(30,64,175,0.04)] hover:border-[#2F5BFF]/40 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 flex items-center justify-between cursor-pointer group">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-[#EEF4FF] text-[#2F5BFF] flex items-center justify-center shrink-0">
              <UiPzIcon name="description" class="text-lg font-bold" />
            </div>
            <div class="text-left">
              <h4 class="font-extrabold text-sm text-[#0F172A] group-hover:text-[#2F5BFF] transition-colors">
                {{ MSG.guide.createCvLink }}
              </h4>
              <p class="text-[11px] text-[#64748B]">Créer un CV professionnel</p>
            </div>
          </div>
          <UiPzIcon name="chevron_right" class="text-base text-[#64748B] group-hover:translate-x-1 transition-transform" />
        </div>
      </NuxtLink>
    </div>

  </div>
</template>
