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
  <div class="relative overflow-hidden bg-[#F8FAFF] min-h-screen pt-2 pb-24 px-4 sm:px-6">
    <div class="max-w-md mx-auto sm:max-w-xl space-y-6">

      <!-- 🖼️ HERO IMAGE CONTAINER WITH FLOATING CARDS & DECORATIVE CURVES -->
      <div class="relative w-full aspect-[4/3] sm:aspect-[16/11] rounded-[28px] overflow-hidden bg-white/70 backdrop-blur-md border border-[rgba(37,99,235,0.08)] shadow-[0_25px_60px_rgba(30,64,175,0.08)]">
        <!-- Candidate Photo -->
        <img
          src="/landing/hero-woman.png"
          alt="Profilo'Z Candidate"
          class="w-full h-full object-cover object-center"
        />

        <!-- 🎨 BLUE DECORATIVE SPIRAL CURVES (SVG Overlay) -->
        <svg class="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 300 240" fill="none">
          <path d="M 230,40 Q 250,70 235,100 T 215,130" stroke="#2F5BFF" stroke-width="1.8" stroke-dasharray="3 3" fill="none" opacity="0.6" />
          <path d="M 50,110 Q 70,80 100,90" stroke="#2F5BFF" stroke-width="1.8" stroke-dasharray="3 3" fill="none" opacity="0.6" />
        </svg>

        <!-- 🏷️ FLOATING CARD 1: Top Right - CV prêt -->
        <div class="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/95 backdrop-blur-md border border-[rgba(37,99,235,0.12)] shadow-[0_10px_25px_rgba(30,64,175,0.12)]">
          <div class="w-5 h-5 rounded-md bg-[#EEF4FF] text-[#2F5BFF] flex items-center justify-center shrink-0">
            <UiPzIcon name="description" class="text-xs font-bold" />
          </div>
          <span class="text-[11px] font-extrabold text-[#0F172A] whitespace-nowrap">CV prêt</span>
          <div class="w-3.5 h-3.5 rounded-full bg-[#22C55E] text-white flex items-center justify-center text-[9px] font-black shrink-0">
            ✓
          </div>
        </div>

        <!-- 🏷️ FLOATING CARD 2: Middle Right - Prêt à postuler -->
        <div class="absolute top-1/2 -translate-y-1/2 right-3 z-20 flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/95 backdrop-blur-md border border-[rgba(37,99,235,0.12)] shadow-[0_10px_25px_rgba(30,64,175,0.12)]">
          <div class="w-5 h-5 rounded-md bg-[#EEF4FF] text-[#2F5BFF] flex items-center justify-center shrink-0">
            <UiPzIcon name="target" class="text-xs font-bold" />
          </div>
          <span class="text-[11px] font-extrabold text-[#0F172A] whitespace-nowrap">Prêt à postuler</span>
          <div class="w-3.5 h-3.5 rounded-full bg-[#22C55E] text-white flex items-center justify-center text-[9px] font-black shrink-0">
            ✓
          </div>
        </div>

        <!-- 🏷️ FLOATING CARD 3: Left - Lettre de motivation -->
        <div class="absolute top-1/3 left-3 z-20 flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/95 backdrop-blur-md border border-[rgba(37,99,235,0.12)] shadow-[0_10px_25px_rgba(30,64,175,0.12)]">
          <div class="w-5 h-5 rounded-md bg-[#EEF4FF] text-[#2F5BFF] flex items-center justify-center shrink-0">
            <UiPzIcon name="mail" class="text-xs font-bold" />
          </div>
          <span class="text-[11px] font-extrabold text-[#0F172A] whitespace-nowrap">Lettre de motivation</span>
          <div class="w-3.5 h-3.5 rounded-full bg-[#22C55E] text-white flex items-center justify-center text-[9px] font-black shrink-0">
            ✓
          </div>
        </div>
      </div>

      <!-- 📝 HEADER TITLES & BADGE -->
      <div class="text-center space-y-3 pt-1">
        <!-- Badge -->
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF4FF] text-[#2F5BFF] text-xs font-extrabold tracking-wide">
          <span>IA • Simple • Rapide</span>
        </div>

        <!-- Main Title -->
        <h1 class="text-2xl sm:text-3xl font-black text-[#0F172A] leading-tight tracking-tight">
          Créez un CV et une lettre qui <span class="text-[#2F5BFF] underline underline-offset-4 decoration-[#2F5BFF]/30">vous ouvrent des portes.</span>
        </h1>

        <!-- Subtitle -->
        <p class="text-xs sm:text-sm text-[#64748B] font-medium leading-relaxed max-w-sm mx-auto">
          L'IA s'occupe du reste, vous brillez.
        </p>
      </div>

      <!-- 🚀 MAIN ACTION BUTTONS -->
      <div class="space-y-3 pt-1">
        <!-- Primary CTA Button -->
        <NuxtLink :to="createLink" class="block w-full">
          <button
            type="button"
            class="w-full h-[60px] rounded-[18px] bg-gradient-to-r from-[#2F5BFF] to-[#2452FF] text-white font-extrabold text-base shadow-[0_10px_30px_rgba(47,91,255,0.35)] hover:-translate-y-0.5 hover:shadow-[0_15px_35px_rgba(47,91,255,0.45)] transition-all duration-300 flex items-center justify-center gap-2.5 active:scale-95 cursor-pointer"
          >
            <span>Créer mon CV</span>
            <UiPzIcon name="arrow_forward" class="text-xl" />
          </button>
        </NuxtLink>

        <!-- Secondary Buttons Grid -->
        <div class="grid grid-cols-2 gap-3">
          <NuxtLink :to="importLink" class="block w-full">
            <button
              type="button"
              class="w-full h-[52px] rounded-[16px] bg-white text-[#0F172A] border border-[rgba(37,99,235,0.12)] font-bold text-xs sm:text-sm shadow-[0_4px_20px_rgba(30,64,175,0.05)] hover:-translate-y-0.5 hover:border-[#2F5BFF]/30 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <UiPzIcon name="upload" class="text-base text-[#2F5BFF]" />
              <span>Importer mon CV</span>
            </button>
          </NuxtLink>

          <NuxtLink to="/creer/lettre" class="block w-full">
            <button
              type="button"
              class="w-full h-[52px] rounded-[16px] bg-white text-[#0F172A] border border-[rgba(37,99,235,0.12)] font-bold text-xs sm:text-sm shadow-[0_4px_20px_rgba(30,64,175,0.05)] hover:-translate-y-0.5 hover:border-[#2F5BFF]/30 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <UiPzIcon name="edit" class="text-base text-[#2F5BFF]" />
              <span>Créer une lettre</span>
            </button>
          </NuxtLink>
        </div>
      </div>

      <!-- ⚡ THREE BENEFIT CARDS AT BOTTOM -->
      <div class="grid grid-cols-3 gap-2.5 pt-2">
        <div class="p-3 rounded-2xl bg-white border border-[rgba(37,99,235,0.08)] shadow-[0_8px_25px_rgba(30,64,175,0.05)] text-left flex items-center gap-2">
          <div class="w-8 h-8 rounded-xl bg-[#EEF4FF] text-[#2F5BFF] flex items-center justify-center font-bold text-base shrink-0">
            <UiPzIcon name="bolt" class="text-base" />
          </div>
          <div class="overflow-hidden">
            <h4 class="font-extrabold text-[11px] text-[#0F172A] truncate">Rapide</h4>
            <p class="text-[9px] text-[#64748B] font-medium truncate">Moins de 10s</p>
          </div>
        </div>

        <div class="p-3 rounded-2xl bg-white border border-[rgba(37,99,235,0.08)] shadow-[0_8px_25px_rgba(30,64,175,0.05)] text-left flex items-center gap-2">
          <div class="w-8 h-8 rounded-xl bg-[#EEF4FF] text-[#22C55E] flex items-center justify-center font-bold text-base shrink-0">
            <UiPzIcon name="shield" class="text-base" />
          </div>
          <div class="overflow-hidden">
            <h4 class="font-extrabold text-[11px] text-[#0F172A] truncate">Sécurisé</h4>
            <p class="text-[9px] text-[#64748B] font-medium truncate">Vos données</p>
          </div>
        </div>

        <div class="p-3 rounded-2xl bg-white border border-[rgba(37,99,235,0.08)] shadow-[0_8px_25px_rgba(30,64,175,0.05)] text-left flex items-center gap-2">
          <div class="w-8 h-8 rounded-xl bg-[#EEF4FF] text-[#8b5cf6] flex items-center justify-center font-bold text-base shrink-0">
            <UiPzIcon name="workspace_premium" class="text-base" />
          </div>
          <div class="overflow-hidden">
            <h4 class="font-extrabold text-[11px] text-[#0F172A] truncate">Professionnel</h4>
            <p class="text-[9px] text-[#64748B] font-medium truncate">Résultats fiables</p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
