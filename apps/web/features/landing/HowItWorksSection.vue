<script setup lang="ts">
import type { TemplateSlug } from '@profiloz/shared'
import { buildPreviewSnapshot } from '~/features/templates/demoSnapshot'
import { cvTemplateAccentColors } from '~/utils/template-accent-colors'

const templateSlugs = ['ETUDIANT', 'PROFESSIONNEL', 'CREATIF'] as const satisfies readonly TemplateSlug[]

const steps = [
  {
    number: 1,
    title: 'Importer ou créer',
    description: 'Partez de votre CV existant ou rédigez étape par étape.',
    screen: 'import' as const,
    icon: 'upload_file',
    accent: '#0051d5',
    canvas: '#dbeafe',
  },
  {
    number: 2,
    title: 'Compléter',
    description: 'Vérifiez et ajustez le contenu en quelques clics.',
    screen: 'editor' as const,
    icon: 'edit_note',
    accent: '#059669',
    canvas: '#d1fae5',
  },
  {
    number: 3,
    title: 'Choisir un modèle',
    description: 'Comparez les modèles et personnalisez les couleurs.',
    screen: 'templates' as const,
    icon: 'palette',
    accent: '#7c3aed',
    canvas: '#ede9fe',
  },
  {
    number: 4,
    title: 'Télécharger',
    description: 'Exportez en PDF, compatible recruteurs et ATS.',
    screen: 'pdf' as const,
    icon: 'download',
    accent: '#009485',
    canvas: '#ccfbf1',
  },
]

const demoResumeEditor = buildPreviewSnapshot('MODERNE', cvTemplateAccentColors('MODERNE').accent)

const { target, revealed } = useScrollReveal(0.12)
</script>

<template>
  <section id="comment-ca-marche" class="how-section landing-section border-t border-outline-variant/30">
    <div
      ref="target"
      class="max-w-container-max mx-auto px-margin-mobile md:px-margin-tablet xl:px-margin-desktop overflow-hidden"
      :class="revealed ? 'scroll-reveal is-revealed' : 'scroll-reveal'"
    >
      <div class="landing-section-header text-center">
        <h2 class="text-xl sm:text-2xl font-bold text-on-surface">Comment ça marche</h2>
        <p class="text-on-surface-variant text-sm sm:text-base">
          Quatre étapes <span class="text-secondary font-semibold">simples</span>, sans prise de tête.
        </p>
      </div>

      <div class="how-steps-shell">
        <div class="how-steps-track hidden xl:block" aria-hidden="true">
          <span v-for="n in 3" :key="n" class="how-steps-track__segment" />
        </div>

        <ol class="how-steps-list mobile-scroll-x xl:grid xl:grid-cols-4 xl:gap-6">
          <li
            v-for="(step, index) in steps"
            :key="step.number"
            class="how-step-card mobile-scroll-card list-none"
            :style="{
              '--step-accent': step.accent,
              '--step-canvas': step.canvas,
              '--step-i': index,
            }"
          >
            <div class="how-step-head">
              <span class="how-step-badge" aria-hidden="true">{{ step.number }}</span>
              <span class="how-step-icon-chip" aria-hidden="true">
                <UiPzIcon :name="step.icon" class="text-[20px]" />
              </span>
            </div>

            <h3 class="font-bold text-on-surface text-sm sm:text-base leading-snug how-step-title">
              {{ step.title }}
            </h3>
            <p class="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              {{ step.description }}
            </p>

            <FeaturesLandingProductScreenFrame :label="step.title" compact class="how-step-screen mt-auto">
              <!-- Import -->
              <div
                v-if="step.screen === 'import'"
                class="how-step-screen__body how-step-import p-3 flex items-center justify-center"
              >
                <div class="how-step-import__drop w-full rounded-lg border-2 border-dashed py-4 text-center how-import-pulse">
                  <UiPzIcon name="upload_file" class="text-xl how-step-icon" />
                  <p class="text-[9px] text-on-surface-variant mt-1 how-step-import__label">CV_Aminata.pdf</p>
                </div>
              </div>

              <!-- Éditeur -->
              <div
                v-else-if="step.screen === 'editor'"
                class="how-step-screen__body how-step-editor h-32 sm:h-36 grid grid-cols-2 gap-px bg-outline-variant/30"
              >
                <div class="bg-white p-1.5 space-y-1.5 overflow-hidden">
                  <div
                    v-for="(field, i) in ['Nom', 'Poste', 'Expérience']"
                    :key="field"
                    class="space-y-0.5"
                  >
                    <div class="h-1.5 w-8 rounded bg-surface-container" />
                    <div
                      class="h-4 rounded border border-outline-variant/25 bg-surface-container-lowest how-field-fill"
                      :style="{ animationDelay: `${i * 0.2}s` }"
                    />
                  </div>
                </div>
                <div
                  class="preview-canvas-bg--landing overflow-hidden"
                  :style="{ '--preview-canvas': step.canvas }"
                >
                  <FeatureTemplatesA4PreviewFit :resume="demoResumeEditor" />
                </div>
              </div>

              <!-- Modèles -->
              <div
                v-else-if="step.screen === 'templates'"
                class="how-step-screen__body how-step-templates p-2 h-32 sm:h-36 grid grid-cols-3 gap-1.5"
              >
                <div
                  v-for="(slug, n) in templateSlugs"
                  :key="slug"
                  class="how-step-templates__item rounded overflow-hidden border bg-white"
                  :class="`how-template-spotlight-${n + 1}`"
                  :style="{
                    '--preview-canvas': cvTemplateAccentColors(slug).canvas,
                    borderColor: 'color-mix(in srgb, var(--step-accent) 20%, var(--color-outline-variant))',
                  }"
                >
                  <div
                    class="h-full preview-canvas-bg--landing"
                    :style="{ '--preview-canvas': cvTemplateAccentColors(slug).canvas }"
                  >
                    <FeatureTemplatesA4PreviewFit
                      :resume="buildPreviewSnapshot(slug, cvTemplateAccentColors(slug).accent)"
                    />
                  </div>
                </div>
              </div>

              <!-- PDF -->
              <div
                v-else
                class="how-step-screen__body how-step-pdf p-3 h-32 sm:h-36 flex flex-col items-center justify-center gap-1.5"
              >
                <div class="how-pdf-icon rounded-2xl p-2 how-import-pulse">
                  <UiPzIcon name="picture_as_pdf" class="text-2xl how-step-icon" />
                </div>
                <p class="text-[10px] font-semibold text-on-surface">CV_Aminata.pdf</p>
                <p class="text-[9px] font-semibold how-step-icon flex items-center gap-0.5 how-pdf-ready">
                  <UiPzIcon name="check_circle" class="text-[12px]" />
                  Prêt à envoyer
                </p>
              </div>
            </FeaturesLandingProductScreenFrame>
          </li>
        </ol>
      </div>
    </div>
  </section>
</template>

<style scoped>
.how-section {
  background:
    radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in srgb, var(--color-secondary) 8%, transparent), transparent 70%),
    linear-gradient(180deg, var(--color-surface-container-low) 0%, var(--color-background) 100%);
}

.how-steps-shell {
  position: relative;
}

.how-steps-track {
  position: absolute;
  top: 1.65rem;
  left: 10%;
  right: 10%;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  z-index: 0;
  pointer-events: none;
}

.how-steps-track__segment {
  height: 3px;
  border-radius: 9999px;
  background: linear-gradient(
    90deg,
    #0051d5 0%,
    #059669 33%,
    #7c3aed 66%,
    #009485 100%
  );
  background-size: 200% 100%;
  animation: how-track-shimmer 2.8s ease-in-out infinite;
  opacity: 0.85;
  box-shadow: 0 1px 6px rgba(11, 28, 48, 0.12);
}

.how-steps-track__segment:nth-child(2) {
  animation-delay: 0.4s;
}

.how-steps-track__segment:nth-child(3) {
  animation-delay: 0.8s;
}

@keyframes how-track-shimmer {
  0%, 100% { background-position: 100% 0; }
  50% { background-position: 0% 0; }
}

.how-steps-list {
  position: relative;
  z-index: 1;
}

.how-step-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.125rem 1rem 1rem;
  border-radius: 1.125rem;
  border: 1.5px solid color-mix(in srgb, var(--step-accent) 45%, var(--color-outline-variant));
  background: linear-gradient(
    165deg,
    color-mix(in srgb, var(--step-canvas) 75%, white) 0%,
    #ffffff 42%,
    color-mix(in srgb, var(--step-canvas) 40%, white) 100%
  );
  box-shadow:
    0 6px 20px color-mix(in srgb, var(--step-accent) 14%, transparent),
    var(--shadow-elevated-md);
  overflow: hidden;
  transition:
    transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.35s ease,
    border-color 0.35s ease;
}

.how-step-head {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.how-step-icon-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--step-canvas) 65%, white);
  border: 1px solid color-mix(in srgb, var(--step-accent) 35%, transparent);
  color: var(--step-accent);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.scroll-reveal.is-revealed .how-step-card {
  animation: how-step-rise 0.65s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: calc(var(--step-i, 0) * 90ms + 100ms);
}

@keyframes how-step-rise {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (hover: hover) {
  .how-step-card:hover {
    transform: translateY(-6px);
    box-shadow:
      0 12px 32px color-mix(in srgb, var(--step-accent) 22%, transparent),
      var(--shadow-elevated-lg);
    border-color: var(--step-accent);
  }

  .how-step-card:hover .how-step-screen {
    transform: scale(1.03);
  }
}

.how-step-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  font-size: 0.9375rem;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(
    145deg,
    var(--step-accent) 0%,
    color-mix(in srgb, var(--step-accent) 75%, #000) 100%
  );
  box-shadow:
    0 4px 14px color-mix(in srgb, var(--step-accent) 45%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
}

.how-step-icon {
  color: var(--step-accent);
}

.how-step-screen {
  transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

.how-step-screen:deep(.product-screen) {
  border-color: color-mix(in srgb, var(--step-accent) 40%, var(--color-outline-variant));
  box-shadow:
    0 8px 28px color-mix(in srgb, var(--step-accent) 18%, rgba(11, 28, 48, 0.12)),
    var(--shadow-elevated-sm);
}

.how-step-screen:deep(.bg-surface-container-low) {
  background: color-mix(in srgb, var(--step-canvas) 55%, var(--color-surface-container-low));
}

.how-step-screen__body {
  min-height: 8rem;
}

.how-step-import__drop {
  border-color: var(--step-accent);
  background: color-mix(in srgb, var(--step-canvas) 55%, white);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--step-accent) 15%, transparent);
}

.how-step-import__label {
  animation: how-label-in 2.8s ease-in-out infinite;
}

@keyframes how-label-in {
  0%, 30%, 100% { opacity: 0.55; transform: translateY(3px); }
  42%, 78% { opacity: 1; transform: translateY(0); color: var(--step-accent); font-weight: 600; }
}

.how-import-pulse {
  animation: how-soft-pulse 2s ease-in-out infinite;
}

@keyframes how-soft-pulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 color-mix(in srgb, var(--step-accent) 0%, transparent); }
  50% { transform: scale(1.04); box-shadow: 0 0 0 6px color-mix(in srgb, var(--step-accent) 12%, transparent); }
}

.how-field-fill {
  animation: how-field-in 2s ease-in-out infinite;
}

@keyframes how-field-in {
  0%, 25%, 100% { opacity: 0.5; background: white; }
  40%, 72% {
    opacity: 1;
    border-color: var(--step-accent);
    background: color-mix(in srgb, var(--step-canvas) 50%, white);
  }
}

.how-step-templates__item {
  transition:
    transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.35s ease,
    border-color 0.35s ease;
}

.how-template-spotlight-1 {
  animation: how-template-spotlight 4.8s ease-in-out infinite;
}

.how-template-spotlight-2 {
  animation: how-template-spotlight 4.8s ease-in-out infinite 1.6s;
}

.how-template-spotlight-3 {
  animation: how-template-spotlight 4.8s ease-in-out infinite 3.2s;
}

@keyframes how-template-spotlight {
  0%, 22%, 100% {
    transform: scale(1);
    box-shadow: none;
    outline: 2px solid transparent;
  }
  6%, 14% {
    transform: scale(1.08);
    box-shadow: 0 8px 22px color-mix(in srgb, var(--step-accent) 35%, transparent);
    outline: 2px solid var(--step-accent);
  }
}

.how-pdf-icon {
  background: color-mix(in srgb, var(--step-canvas) 70%, white);
  border: 1px solid color-mix(in srgb, var(--step-accent) 30%, transparent);
}

.how-pdf-ready {
  animation: how-pdf-ready 2.2s ease-in-out infinite;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--step-accent) 12%, white);
}

@keyframes how-pdf-ready {
  0%, 35%, 100% { opacity: 0; transform: translateY(6px) scale(0.96); }
  50%, 82% { opacity: 1; transform: translateY(0) scale(1); }
}

:deep(.preview-canvas-bg--landing) {
  background: var(--preview-canvas, var(--color-surface-dim));
}

@media (prefers-reduced-motion: reduce) {
  .how-steps-track__segment,
  .how-step-import__label,
  .how-import-pulse,
  .how-field-fill,
  .how-template-spotlight-1,
  .how-template-spotlight-2,
  .how-template-spotlight-3,
  .how-pdf-ready,
  .scroll-reveal.is-revealed .how-step-card {
    animation: none;
  }

  .how-step-card,
  .how-step-screen {
    transition: none;
  }
}
</style>
