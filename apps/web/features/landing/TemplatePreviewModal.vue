<script setup lang="ts">
import type { TemplateSlug } from '@profiloz/shared'
import type { CoverLetterTemplateSlug } from '~/types/cover-letter'
import { buildPreviewSnapshot } from '~/features/templates/demoSnapshot'
import { buildCoverLetterDemoSnapshot } from '~/features/cover-letter-templates/demoSnapshot'
import { cvTemplateStartLink, letterTemplateStartLink } from '~/utils/template-links'
import { cvLandingPreviewColors, landingPreviewStyle } from '~/utils/landing-accents'

const props = defineProps<{
  open: boolean
  title: string
  kind: 'cv' | 'letter'
  templateSlug: TemplateSlug | CoverLetterTemplateSlug
}>()

const emit = defineEmits<{ close: [] }>()

const previewStyle = computed(() => landingPreviewStyle(props.templateSlug, props.kind))

const resume = computed(() => {
  if (props.kind !== 'cv') return null
  const colors = cvLandingPreviewColors(props.templateSlug as TemplateSlug)
  return buildPreviewSnapshot(props.templateSlug as TemplateSlug, colors.accent)
})
const letter = computed(() =>
  props.kind === 'letter' ? buildCoverLetterDemoSnapshot(props.templateSlug as CoverLetterTemplateSlug) : null,
)

const useLink = computed(() =>
  props.kind === 'cv'
    ? cvTemplateStartLink(props.templateSlug)
    : letterTemplateStartLink(props.templateSlug),
)

function onBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) emit('close')
}

watch(
  () => props.open,
  (isOpen) => {
    if (!import.meta.client) return
    document.body.style.overflow = isOpen ? 'hidden' : ''
  },
)

onUnmounted(() => {
  if (import.meta.client) document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="preview-modal">
      <div
        v-if="open"
        class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/40 backdrop-blur-[2px]"
        role="dialog"
        aria-modal="true"
        :aria-label="`Aperçu ${title}`"
        @click="onBackdropClick"
      >
        <div
          class="preview-modal__sheet w-full sm:max-w-2xl lg:max-w-3xl max-h-[92vh] sm:max-h-[88vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-surface-container-lowest overflow-hidden premium-shadow"
          @click.stop
        >
          <div class="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-outline-variant/20 shrink-0">
            <div>
              <p class="text-xs font-semibold text-secondary uppercase tracking-wide">Aperçu</p>
              <h3 class="landing-subtitle">{{ title }}</h3>
            </div>
            <button
              type="button"
              class="touch-target inline-flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors"
              aria-label="Fermer"
              @click="emit('close')"
            >
              <UiPzIcon name="close" class="text-[22px]" />
            </button>
          </div>

          <div
            class="flex-1 overflow-auto p-4 sm:p-8 preview-canvas-bg--landing min-h-[60vh] sm:min-h-[480px] flex items-center justify-center"
            :style="previewStyle"
          >
            <div class="w-full max-w-[420px] aspect-[3/4] rounded-xl overflow-hidden premium-shadow-sm bg-white preview-modal__document">
              <FeatureTemplatesA4PreviewFit v-if="kind === 'cv' && resume" :resume="resume" />
              <div
                v-else-if="kind === 'letter' && letter"
                class="h-full w-full"
                :style="previewStyle"
              >
                <FeatureCoverLetterTemplatesA4PreviewFit :letter="letter" />
              </div>
            </div>
          </div>

          <div class="px-4 sm:px-6 py-4 border-t border-outline-variant/20 shrink-0 safe-bottom flex gap-2">
            <button type="button" class="btn-outline flex-1" @click="emit('close')">Fermer</button>
            <NuxtLink :to="useLink" class="btn-secondary flex-1" @click="emit('close')">
              Utiliser ce modèle
            </NuxtLink>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
