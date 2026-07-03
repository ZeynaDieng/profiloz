<script setup lang="ts">
import { buildPreviewSnapshot } from '~/features/templates/demoSnapshot'
import { buildCoverLetterDemoSnapshot } from '~/features/cover-letter-templates/demoSnapshot'

const config = useRuntimeConfig()
const { load, section } = useLandingContent()

const steps = [
  { id: 'import', label: 'Import', icon: 'upload_file' },
  { id: 'fill', label: 'Remplissage', icon: 'auto_fix_high' },
  { id: 'edit', label: 'Édition', icon: 'edit_note' },
  { id: 'template', label: 'Modèle', icon: 'palette' },
  { id: 'dossier', label: 'Dossier', icon: 'folder_open' },
  { id: 'pdf', label: 'PDF', icon: 'picture_as_pdf' },
] as const

const activeIndex = ref(0)
const activeStep = computed(() => steps[activeIndex.value]!.id)

const demoResume = buildPreviewSnapshot('PROFESSIONNEL')
const demoLetter = buildCoverLetterDemoSnapshot('CLASSIQUE')

const hero = computed(() => section<{ demoVideoUrl?: string }>('hero'))
const videoSrc = computed(
  () => hero.value.demoVideoUrl || (config.public.heroDemoVideoUrl as string) || '/demo/profiloz-hero.mp4',
)

const showVideo = ref(false)
const videoRef = ref<HTMLVideoElement | null>(null)

let timer: ReturnType<typeof setInterval> | null = null

function stopAutoplay() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function startAutoplay() {
  stopAutoplay()
  if (!import.meta.client) return
  if (showVideo.value) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  timer = setInterval(() => {
    activeIndex.value = (activeIndex.value + 1) % steps.length
  }, 3400)
}

function goTo(index: number) {
  activeIndex.value = index
  if (!showVideo.value) startAutoplay()
}

async function tryPlayVideo() {
  const el = videoRef.value
  if (!el) return
  try {
    await el.play()
    showVideo.value = true
    stopAutoplay()
  } catch {
    showVideo.value = false
    startAutoplay()
  }
}

function onVideoError() {
  showVideo.value = false
  startAutoplay()
}

onMounted(() => {
  void load()
  if (!import.meta.client) return
  nextTick(() => {
    if (videoRef.value) void tryPlayVideo()
    else startAutoplay()
  })
})

onUnmounted(() => stopAutoplay())
</script>

<template>
  <div class="hero-demo premium-shadow rounded-2xl border border-outline-variant/25 bg-surface-container-lowest/90 backdrop-blur-sm overflow-hidden">
    <div class="flex items-center justify-between gap-2 px-3 py-2 border-b border-outline-variant/20 bg-surface-container-low/80">
      <p class="text-[11px] font-semibold text-on-surface truncate">Profilo'Z en action</p>
      <div v-if="!showVideo" class="flex gap-1 shrink-0">
        <button
          v-for="(step, i) in steps"
          :key="step.id"
          type="button"
          class="w-2 h-2 rounded-full transition-all duration-300"
          :class="i === activeIndex ? 'bg-secondary w-4' : 'bg-outline-variant/50 hover:bg-outline-variant'"
          :aria-label="step.label"
          @click="goTo(i)"
        />
      </div>
    </div>

    <div class="relative aspect-[4/3] sm:aspect-[16/11] bg-gradient-to-br from-surface-container-low to-background overflow-hidden">
      <!-- Vidéo démo (autoplay muet) — repli sur la démo animée si fichier absent -->
      <video
        v-show="showVideo"
        ref="videoRef"
        class="absolute inset-0 h-full w-full object-cover"
        :src="videoSrc"
        autoplay
        muted
        loop
        playsinline
        preload="auto"
        aria-label="Démonstration Profilo'Z"
        @canplay="tryPlayVideo"
        @error="onVideoError"
      />

      <Transition v-if="!showVideo" name="demo-fade" mode="out-in">
        <div v-if="activeStep === 'import'" key="import" class="absolute inset-0 p-4 flex flex-col items-center justify-center gap-3">
          <div class="w-full max-w-[220px] rounded-xl border-2 border-dashed border-secondary/40 bg-secondary/5 p-4 text-center demo-pulse">
            <UiPzIcon name="document_scanner" class="text-secondary text-3xl mb-2" />
            <p class="text-xs font-semibold text-on-surface">CV_Aminata.pdf</p>
            <p class="text-[10px] text-on-surface-variant mt-1">Import PDF, Word ou photo</p>
          </div>
        </div>

        <div v-else-if="activeStep === 'fill'" key="fill" class="absolute inset-0 p-3 sm:p-4 space-y-2">
          <p class="text-xs font-semibold text-on-surface">Remplissage automatique…</p>
          <div
            v-for="(field, i) in ['Nom complet', 'Poste visé', 'Expérience', 'Formation']"
            :key="field"
            class="space-y-1"
          >
            <p class="text-[10px] text-on-surface-variant">{{ field }}</p>
            <div
              class="h-7 rounded-lg border border-outline-variant/30 bg-white px-2 flex items-center text-[10px] text-on-surface demo-field-fill"
              :style="{ animationDelay: `${i * 0.15}s` }"
            >
              <span v-if="field === 'Nom complet'">Aminata Diallo</span>
              <span v-else-if="field === 'Poste visé'">Responsable marketing</span>
              <span v-else-if="field === 'Expérience'">Chef de projet — Orange</span>
              <span v-else>Master Marketing — UCAD</span>
            </div>
          </div>
        </div>

        <div v-else-if="activeStep === 'edit'" key="edit" class="absolute inset-0 grid grid-cols-2 gap-px bg-outline-variant/20">
          <div class="bg-white p-2 space-y-1.5 overflow-hidden">
            <div class="h-2 w-2/3 rounded bg-surface-container demo-shimmer-line" />
            <div class="h-6 rounded border border-outline-variant/30 bg-surface-container-lowest" />
            <div class="h-6 rounded border border-outline-variant/30 bg-surface-container-lowest" />
            <div class="h-6 rounded border border-secondary/30 bg-secondary/5" />
          </div>
          <div class="preview-canvas-bg overflow-hidden">
            <FeatureTemplatesA4PreviewFit :resume="demoResume" />
          </div>
        </div>

        <div v-else-if="activeStep === 'template'" key="template" class="absolute inset-0 p-3 grid grid-cols-3 gap-2">
          <div
            v-for="(slug, n) in (['ETUDIANT', 'PROFESSIONNEL', 'MODERNE'] as const)"
            :key="slug"
            class="rounded-lg border bg-white overflow-hidden aspect-[3/4]"
            :class="n === 1 ? 'border-secondary ring-2 ring-secondary/30 demo-template-pick' : 'border-outline-variant/30 opacity-80'"
          >
            <FeatureTemplatesA4PreviewFit :resume="buildPreviewSnapshot(slug)" />
          </div>
        </div>

        <div v-else-if="activeStep === 'dossier'" key="dossier" class="absolute inset-0 grid grid-cols-2 gap-px bg-outline-variant/10">
          <div class="preview-canvas-bg relative overflow-hidden">
            <FeatureTemplatesA4PreviewFit :resume="demoResume" />
            <div class="absolute bottom-2 left-2 right-2 rounded-lg bg-white/92 border border-outline-variant/20 px-2 py-1 flex items-center gap-1.5">
              <UiPzIcon name="description" class="text-secondary text-sm" />
              <span class="text-[9px] font-medium text-on-surface truncate">CV · Aminata Diallo</span>
            </div>
          </div>
          <div class="preview-canvas-bg relative overflow-hidden border-l border-outline-variant/10">
            <FeatureCoverLetterTemplatesA4PreviewFit :letter="demoLetter" />
            <div class="absolute bottom-2 left-2 right-2 rounded-lg bg-white/92 border border-outline-variant/20 px-2 py-1 flex items-center gap-1.5">
              <UiPzIcon name="mail" class="text-secondary text-sm" />
              <span class="text-[9px] font-medium text-on-surface truncate">Lettre · Aminata Diallo</span>
            </div>
          </div>
        </div>

        <div v-else key="pdf" class="absolute inset-0 p-4 flex flex-col items-center justify-center gap-3">
          <div class="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary demo-pulse">
            <UiPzIcon name="picture_as_pdf" class="text-4xl" />
          </div>
          <p class="text-sm font-bold text-on-surface">CV_Aminata.pdf</p>
          <p class="text-[11px] text-secondary font-semibold flex items-center gap-1">
            <UiPzIcon name="check_circle" class="text-base" />
            Prêt à envoyer
          </p>
        </div>
      </Transition>
    </div>

    <div
      v-if="!showVideo"
      class="flex gap-1 overflow-x-auto px-2 py-2 border-t border-outline-variant/15 bg-surface/80 scrollbar-none"
    >
      <button
        v-for="(step, i) in steps"
        :key="step.id"
        type="button"
        class="inline-flex items-center gap-1 shrink-0 px-2 py-1 rounded-full text-[10px] font-medium transition-colors"
        :class="i === activeIndex ? 'bg-secondary/10 text-secondary' : 'text-on-surface-variant hover:bg-surface-container-low'"
        @click="goTo(i)"
      >
        <UiPzIcon :name="step.icon" class="text-[13px]" />
        {{ step.label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.demo-fade-enter-active,
.demo-fade-leave-active {
  transition: opacity 0.35s ease, transform 0.35s ease;
}

.demo-fade-enter-from {
  opacity: 0;
  transform: scale(0.98);
}

.demo-fade-leave-to {
  opacity: 0;
  transform: scale(1.01);
}

.demo-field-fill {
  animation: demo-field-in 0.5s ease both;
}

.demo-shimmer-line {
  background: linear-gradient(90deg, var(--color-surface-container) 0%, var(--color-surface-container-high) 50%, var(--color-surface-container) 100%);
  background-size: 200% 100%;
  animation: demo-shimmer 1.2s ease-in-out infinite;
}

@keyframes demo-shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}

@keyframes demo-field-in {
  from { opacity: 0; transform: translateX(-6px); }
  to { opacity: 1; transform: translateX(0); }
}

.demo-template-pick {
  animation: demo-pick 1.8s ease-in-out infinite;
}

@keyframes demo-pick {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}

.demo-pulse {
  animation: demo-pulse 2s ease-in-out infinite;
}

@keyframes demo-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.04); opacity: 0.94; }
}

@media (max-width: 767px) {
  .demo-pulse,
  .demo-template-pick {
    animation: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .demo-fade-enter-active,
  .demo-fade-leave-active,
  .demo-field-fill,
  .demo-template-pick,
  .demo-pulse {
    animation: none;
    transition: none;
  }
}

.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
</style>
