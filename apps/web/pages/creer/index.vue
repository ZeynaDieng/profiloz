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
  <div class="min-h-screen bg-[#F8FAFF] py-10 sm:py-16 px-4 sm:px-6 flex items-center justify-center">
    <div class="max-w-[480px] w-full mx-auto space-y-8 text-center">

      <!-- EN-TÊTE DE PAGE & BADGE DISCRET -->
      <div class="space-y-3">
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF4FF] text-[#2F5BFF] text-xs font-extrabold tracking-wide border border-[#2F5BFF]/10">
          <span>✨ Rapide • Sans inscription</span>
        </div>

        <h1 class="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
          {{ MSG.guide.createCvTitle }}
        </h1>

        <p class="text-xs sm:text-sm text-[#64748B] font-medium leading-relaxed max-w-sm mx-auto">
          {{ selectedTemplate
            ? 'Choisissez comment remplir votre CV avec le modèle sélectionné.'
            : MSG.guide.createCvSubtitle }}
        </p>
      </div>

      <!-- BOUTON D'ACTION PRINCIPAL -->
      <NuxtLink :to="createLink" class="block w-full">
        <button
          type="button"
          class="w-full h-[58px] rounded-[18px] bg-gradient-to-r from-[#2F5BFF] to-[#2452FF] text-white font-extrabold text-base shadow-[0_10px_30px_rgba(47,91,255,0.32)] hover:-translate-y-0.5 hover:shadow-[0_15px_35px_rgba(47,91,255,0.4)] transition-all duration-300 flex items-center justify-center gap-2.5 active:scale-[0.98] cursor-pointer"
        >
          <span>{{ MSG.guide.createCvCta }}</span>
          <UiPzIcon name="arrow_forward" class="text-xl" />
        </button>
      </NuxtLink>

      <!-- SÉPARATEUR DE SECTION -->
      <div class="relative flex items-center justify-center pt-2">
        <div class="w-full border-t border-[rgba(37,99,235,0.1)]" />
        <span class="absolute bg-[#F8FAFF] px-3 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
          Ou choisissez une alternative
        </span>
      </div>

      <!-- CARTES D'OPTIONS SECONDAIRES DE QUALITÉ -->
      <div class="space-y-3">
        <!-- Card 1: Importer mon CV -->
        <NuxtLink :to="importLink" class="block w-full">
          <div class="p-4 rounded-[18px] bg-white border border-[rgba(37,99,235,0.08)] shadow-[0_4px_20px_rgba(30,64,175,0.04)] hover:border-[#2F5BFF]/40 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 flex items-center justify-between cursor-pointer group">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-[#EEF4FF] text-[#2F5BFF] flex items-center justify-center shrink-0">
                <UiPzIcon name="upload" class="text-lg font-bold" />
              </div>
              <div class="text-left">
                <h4 class="font-extrabold text-sm text-[#0F172A] group-hover:text-[#2F5BFF] transition-colors">
                  {{ MSG.guide.importCvLink }}
                </h4>
                <p class="text-[11px] text-[#64748B]">Extraire automatiquement depuis PDF/DOCX</p>
              </div>
            </div>
            <UiPzIcon name="chevron_right" class="text-base text-[#64748B] group-hover:translate-x-1 transition-transform" />
          </div>
        </NuxtLink>

        <!-- Card 2: Créer une lettre -->
        <NuxtLink to="/creer/lettre" class="block w-full">
          <div class="p-4 rounded-[18px] bg-white border border-[rgba(37,99,235,0.08)] shadow-[0_4px_20px_rgba(30,64,175,0.04)] hover:border-[#2F5BFF]/40 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 flex items-center justify-between cursor-pointer group">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-[#EEF4FF] text-[#2F5BFF] flex items-center justify-center shrink-0">
                <UiPzIcon name="edit" class="text-lg font-bold" />
              </div>
              <div class="text-left">
                <h4 class="font-extrabold text-sm text-[#0F172A] group-hover:text-[#2F5BFF] transition-colors">
                  {{ MSG.guide.createLetterLink }}
                </h4>
                <p class="text-[11px] text-[#64748B]">Rédiger une lettre de motivation avec l'IA</p>
              </div>
            </div>
            <UiPzIcon name="chevron_right" class="text-base text-[#64748B] group-hover:translate-x-1 transition-transform" />
          </div>
        </NuxtLink>

        <!-- Card 3: Importer une lettre -->
        <NuxtLink to="/creer/importer/lettre" class="block w-full">
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

        <!-- Card 4 (Si modèle sélectionné): Aperçu du modèle -->
        <NuxtLink v-if="selectedTemplate" :to="galleryLink" class="block w-full">
          <div class="p-3.5 rounded-[16px] bg-white border border-[rgba(37,99,235,0.08)] text-xs font-bold text-[#64748B] hover:text-[#2F5BFF] hover:border-[#2F5BFF]/30 transition-all text-center">
            Voir l’aperçu du modèle sélectionné
          </div>
        </NuxtLink>
      </div>

    </div>
  </div>
</template>
