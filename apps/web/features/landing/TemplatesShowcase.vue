<script setup lang="ts">
import type { TemplateSlug } from '@profiloz/shared'
import type { CoverLetterTemplateSlug } from '~/types/cover-letter'
import { buildPreviewSnapshot } from '~/features/templates/demoSnapshot'
import { buildCoverLetterDemoSnapshot } from '~/features/cover-letter-templates/demoSnapshot'
import { COVER_LETTER_TEMPLATE_REGISTRY } from '~/features/cover-letter-templates/registry'
import { TEMPLATE_REGISTRY } from '~/features/templates/registry'
import { cvTemplateStartLink, letterTemplateStartLink } from '~/utils/template-links'
import {
  cvLandingPreviewColors,
  landingPreviewStyle,
  letterLandingPreviewColors,
} from '~/utils/landing-accents'

type TemplateKind = 'cv' | 'letter'

const POPULAR_SLUG = 'PROFESSIONNEL'
const cvTemplates = TEMPLATE_REGISTRY
const letterTemplates = COVER_LETTER_TEMPLATE_REGISTRY

const cvCount = computed(() => cvTemplates.length)
const letterCount = computed(() => letterTemplates.length)

function templateCountLabel(count: number, kind: 'cv' | 'letter') {
  const word = count > 1 ? 'modèles' : 'modèle'
  if (kind === 'cv') return `${count} ${word} pour tous les profils.`
  return `${count} ${word} de lettres cohérents avec votre CV.`
}

const activeKind = ref<TemplateKind>('cv')
const cvRailRef = ref<{ reset: () => void } | null>(null)
const letterRailRef = ref<{ reset: () => void } | null>(null)

const previewOpen = ref(false)
const previewKind = ref<TemplateKind>('cv')
const previewSlug = ref<TemplateSlug | CoverLetterTemplateSlug>('PROFESSIONNEL')
const previewTitle = ref('')

const panelMeta = computed(() =>
  activeKind.value === 'cv'
    ? {
        icon: 'description',
        subtitle: templateCountLabel(cvCount.value, 'cv'),
        ctaLabel: 'Voir tous les modèles CV',
        ctaLink: '/creer/modele',
      }
    : {
        icon: 'mail',
        subtitle: templateCountLabel(letterCount.value, 'letter'),
        ctaLabel: 'Créer une lettre',
        ctaLink: '/creer/lettre',
      },
)

function selectKind(kind: TemplateKind) {
  if (kind === activeKind.value) return
  activeKind.value = kind
}

function openPreview(kind: TemplateKind, slug: TemplateSlug | CoverLetterTemplateSlug, title: string) {
  previewKind.value = kind
  previewSlug.value = slug
  previewTitle.value = title
  previewOpen.value = true
}

function cvPreview(slug: TemplateSlug) {
  const colors = cvLandingPreviewColors(slug)
  return buildPreviewSnapshot(slug, colors.accent)
}

watch(activeKind, (kind) => {
  nextTick(() => {
    if (kind === 'cv') cvRailRef.value?.reset()
    else letterRailRef.value?.reset()
  })
})

const { target, revealed } = useScrollReveal(0.25)
</script>

<template>
  <section
    id="templates"
    ref="target"
    class="landing-section max-w-container-max mx-auto px-margin-mobile md:px-margin-tablet xl:px-margin-desktop overflow-hidden scroll-reveal"
    :class="revealed && 'is-revealed'"
  >
    <div class="landing-section-header landing-section-header--left">
      <p class="landing-eyebrow">Modèles testés</p>
      <UiTypewriterText
        tag="h2"
        class="landing-title"
        :active="revealed"
        :segments="[
          { text: 'Des modèles pour ' },
          { text: 'votre candidature', class: 'text-secondary block sm:inline' },
        ]"
        loop
        loop-mode="tail"
      />
      <p class="landing-lead !max-w-xl hidden sm:block">
        CV et lettres conçus pour impressionner les recruteurs. Parcourez, comparez, personnalisez.
      </p>
    </div>

    <div
      class="template-kind-switch mx-auto mb-6 md:mb-8"
      role="tablist"
      aria-label="Type de modèle"
    >
      <span
        class="template-kind-switch__indicator"
        :class="activeKind === 'letter' && 'is-letter'"
        aria-hidden="true"
      />
      <button
        type="button"
        role="tab"
        class="template-kind-switch__btn"
        :class="activeKind === 'cv' && 'is-active'"
        :aria-selected="activeKind === 'cv'"
        @click="selectKind('cv')"
      >
        <UiPzIcon name="description" class="text-[18px]" />
        Modèles de CV
      </button>
      <button
        type="button"
        role="tab"
        class="template-kind-switch__btn"
        :class="activeKind === 'letter' && 'is-active'"
        :aria-selected="activeKind === 'letter'"
        @click="selectKind('letter')"
      >
        <UiPzIcon name="mail" class="text-[18px]" />
        Lettres de motivation
      </button>
    </div>

    <div class="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-end mb-4 md:mb-6">
      <p class="text-xs sm:text-sm text-on-surface-variant flex items-center gap-2">
        <UiPzIcon :name="panelMeta.icon" class="text-secondary text-[18px] shrink-0" />
        {{ panelMeta.subtitle }}
      </p>
      <NuxtLink
        :to="panelMeta.ctaLink"
        class="text-secondary font-bold hover:underline inline-flex items-center gap-1 min-h-11 shrink-0"
      >
        {{ panelMeta.ctaLabel }}
        <UiPzIcon name="chevron_right" class="text-[20px]" />
      </NuxtLink>
    </div>

    <p class="text-xs text-on-surface-variant mb-3 md:hidden template-scroll-hint">
      <span class="template-scroll-hint__arrow">→</span>
      Glissez pour parcourir
    </p>

    <div class="template-showcase-viewport">
      <div
        class="template-showcase-track"
        :class="activeKind === 'letter' && 'is-letter'"
      >
        <div
          class="template-showcase-slide"
          :class="activeKind !== 'cv' && 'is-inactive'"
          :aria-hidden="activeKind !== 'cv'"
        >
          <FeaturesLandingTemplateShowcaseRail
            ref="cvRailRef"
            :count="cvCount"
            :active="activeKind === 'cv'"
          >
            <article
              v-for="(template, index) in cvTemplates"
              :key="template.slug"
              class="group flex flex-col template-showcase-card shrink-0 snap-center"
              :class="template.slug === POPULAR_SLUG ? 'is-popular' : ''"
              :style="{ '--card-i': index }"
            >
              <div
                class="relative aspect-[3/4] min-h-[280px] sm:min-h-[360px] md:min-h-[400px] w-[72vw] max-w-[280px] sm:w-[280px] md:w-[300px] rounded-2xl border overflow-hidden mb-3 sm:mb-4 pz-template-card template-showcase-card-visual bg-white"
                :class="
                  template.slug === POPULAR_SLUG
                    ? 'border-secondary template-showcase-card-visual--featured ring-2 ring-secondary/20'
                    : 'border-outline-variant/60 group-hover:border-secondary/40'
                "
              >
                <span
                  v-if="template.slug === POPULAR_SLUG"
                  class="absolute top-3 left-3 z-30 inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-label-xs font-bold text-on-secondary shadow-md"
                >
                  <UiPzIcon name="star" class="text-[14px]" />
                  Populaire
                </span>

                <div
                  class="absolute inset-0 pz-template-preview preview-canvas-bg--landing"
                  :style="landingPreviewStyle(template.slug, 'cv')"
                >
                  <FeatureTemplatesA4PreviewFit :resume="cvPreview(template.slug)" />
                </div>

                <div class="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/60 to-transparent sm:from-black/50 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
                  <div class="flex gap-2">
                    <button
                      type="button"
                      class="btn-outline flex-1 !min-h-10 !py-2 !px-3 !text-xs sm:!text-sm !bg-white/95 !border-white/30"
                      @click="openPreview('cv', template.slug, template.name)"
                    >
                      Aperçu
                    </button>
                    <NuxtLink
                      :to="cvTemplateStartLink(template.slug)"
                      class="btn-secondary flex-1 !min-h-10 !py-2 !px-3 !text-xs sm:!text-sm"
                    >
                      Utiliser
                    </NuxtLink>
                  </div>
                </div>
              </div>

              <div class="px-1 w-[72vw] max-w-[280px] sm:w-[280px] md:w-[300px]">
                <h4 class="landing-subtitle">{{ template.name }}</h4>
                <p class="text-label-xs text-on-surface-variant mt-0.5 flex items-center gap-1.5">
                  <span
                    class="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                    :style="{ backgroundColor: cvLandingPreviewColors(template.slug).accent }"
                    aria-hidden="true"
                  />
                  {{ template.category }}
                </p>
              </div>
            </article>
          </FeaturesLandingTemplateShowcaseRail>
        </div>

        <div
          class="template-showcase-slide"
          :class="activeKind !== 'letter' && 'is-inactive'"
          :aria-hidden="activeKind !== 'letter'"
        >
          <FeaturesLandingTemplateShowcaseRail
            ref="letterRailRef"
            :count="letterCount"
            :active="activeKind === 'letter'"
          >
            <article
              v-for="(template, index) in letterTemplates"
              :key="template.slug"
              class="group flex flex-col template-showcase-card shrink-0 snap-center"
              :style="{ '--card-i': index }"
            >
              <div
                class="relative aspect-[3/4] min-h-[280px] sm:min-h-[360px] md:min-h-[400px] w-[72vw] max-w-[280px] sm:w-[280px] md:w-[300px] rounded-2xl border border-outline-variant/60 overflow-hidden mb-3 sm:mb-4 pz-template-card template-showcase-card-visual bg-white sm:group-hover:border-secondary/40"
              >
                <div
                  class="absolute inset-0 pz-template-preview preview-canvas-bg--landing"
                  :style="landingPreviewStyle(template.slug, 'letter')"
                >
                  <FeatureCoverLetterTemplatesA4PreviewFit :letter="buildCoverLetterDemoSnapshot(template.slug)" />
                </div>

                <div class="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/60 to-transparent sm:from-black/50 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
                  <div class="flex gap-2">
                    <button
                      type="button"
                      class="btn-outline flex-1 !min-h-10 !py-2 !px-3 !text-xs sm:!text-sm !bg-white/95 !border-white/30"
                      @click="openPreview('letter', template.slug, template.name)"
                    >
                      Aperçu
                    </button>
                    <NuxtLink
                      :to="letterTemplateStartLink(template.slug)"
                      class="btn-secondary flex-1 !min-h-10 !py-2 !px-3 !text-xs sm:!text-sm"
                    >
                      Utiliser
                    </NuxtLink>
                  </div>
                </div>
              </div>

              <div class="px-1 w-[72vw] max-w-[280px] sm:w-[280px] md:w-[300px]">
                <h4 class="landing-subtitle group-hover:text-secondary transition-colors">
                  {{ template.name }}
                </h4>
                <p class="text-label-xs text-on-surface-variant mt-0.5 flex items-center gap-1.5">
                  <span
                    class="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                    :style="{ backgroundColor: letterLandingPreviewColors(template.slug).accent }"
                    aria-hidden="true"
                  />
                  {{ template.category }}
                </p>
                <p class="text-sm text-on-surface-variant mt-1 hidden sm:block">{{ template.description }}</p>
              </div>
            </article>
          </FeaturesLandingTemplateShowcaseRail>
        </div>
      </div>
    </div>

    <FeaturesLandingTemplatePreviewModal
      :open="previewOpen"
      :kind="previewKind"
      :template-slug="previewSlug"
      :title="previewTitle"
      @close="previewOpen = false"
    />
  </section>
</template>

<style scoped>
.template-kind-switch {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: min(100%, 420px);
  padding: 4px;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--color-surface-container) 80%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-outline-variant) 35%, transparent);
  box-shadow: var(--shadow-elevated-sm, 0 2px 8px rgba(11, 28, 48, 0.04));
}

.template-kind-switch__indicator {
  position: absolute;
  top: 4px;
  left: 4px;
  width: calc(50% - 4px);
  height: calc(100% - 8px);
  border-radius: 9999px;
  background: var(--color-surface-container-lowest);
  box-shadow:
    0 1px 2px rgba(11, 28, 48, 0.06),
    0 4px 12px rgba(11, 28, 48, 0.08);
  transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  pointer-events: none;
}

.template-kind-switch__indicator.is-letter {
  transform: translateX(100%);
}

.template-kind-switch__btn {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  min-height: 2.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-on-surface-variant);
  transition: color 0.25s ease;
}

@media (min-width: 640px) {
  .template-kind-switch__btn {
    font-size: 0.875rem;
    padding-inline: 1rem;
  }
}

.template-kind-switch__btn.is-active {
  color: var(--color-secondary);
}

.template-scroll-hint {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}

.template-scroll-hint__arrow {
  display: inline-block;
  animation: template-scroll-nudge 1.6s ease-in-out infinite;
}

@keyframes template-scroll-nudge {
  0%, 100% { transform: translateX(0); opacity: 0.7; }
  50% { transform: translateX(5px); opacity: 1; }
}

.template-showcase-viewport {
  overflow: hidden;
}

.template-showcase-track {
  display: flex;
  width: 200%;
  transition: transform 0.65s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

.template-showcase-track.is-letter {
  transform: translateX(-50%);
}

.template-showcase-slide {
  width: 50%;
  flex-shrink: 0;
  transition:
    opacity 0.45s ease,
    transform 0.65s cubic-bezier(0.22, 1, 0.36, 1);
  transform: scale(1);
  opacity: 1;
}

.template-showcase-slide.is-inactive {
  opacity: 0.55;
  transform: scale(0.985);
  pointer-events: none;
}

.template-showcase-slide:not(.is-inactive) :deep(.template-showcase-card) {
  animation: template-card-rise 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: calc(var(--card-i, 0) * 70ms + 120ms);
  transition:
    transform 0.65s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.5s ease;
}

:deep(.preview-canvas-bg--landing) {
  background: var(--preview-canvas, var(--color-surface-dim));
}

:deep(.template-showcase-card-visual) {
  box-shadow: var(--shadow-elevated-sm);
}

:deep(.template-showcase-card-visual--featured) {
  box-shadow: var(--shadow-elevated-md);
}

:deep(.template-showcase-card-visual:hover) {
  box-shadow: var(--shadow-elevated-hover, var(--shadow-elevated-md));
}

@keyframes template-card-rise {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .template-kind-switch__indicator,
  .template-showcase-track,
  .template-showcase-slide {
    transition: none;
  }

  .template-showcase-slide:not(.is-inactive) :deep(.template-showcase-card),
  .template-scroll-hint__arrow {
    animation: none;
  }
}
</style>
