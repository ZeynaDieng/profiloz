<script setup lang="ts">
import { MSG } from '@profiloz/shared'
import type { CoverLetterTemplateSlug } from '~/types/cover-letter'
import {
  COVER_LETTER_TEMPLATE_FILTERS,
  COVER_LETTER_TEMPLATE_REGISTRY,
} from '~/features/cover-letter-templates/registry'
import { AMINATA_PERSONA } from '~/features/demo/aminata-persona'

definePageMeta({ layout: 'wizard' })

useGuestSession()
const coverLetterStore = useCoverLetterStore()
const resumeStore = useResumeStore()
const route = useRoute()
const formError = ref('')
const toast = useAppToast()

onMounted(() => {
  resumeStore.rehydrateFromStorage()
  coverLetterStore.rehydrateFromStorage()
  // Formulaire vide : la démo Aminata reste uniquement dans l’aperçu
  if (coverLetterStore.current?.senderName === AMINATA_PERSONA.fullName) {
    coverLetterStore.startNewDraft()
  }
  coverLetterStore.initDraft()

  if (!selectedSlug.value && coverLetterStore.current?.templateSlug) {
    selectedSlug.value = coverLetterStore.current.templateSlug
  }
  if (selectedSlug.value) {
    coverLetterStore.setTemplate(selectedSlug.value)
  }
})

const activeFilter = ref('all')
const selectedSlug = ref<CoverLetterTemplateSlug>(
  (route.query.select as CoverLetterTemplateSlug) ?? coverLetterStore.current?.templateSlug ?? 'CLASSIQUE',
)

const filteredTemplates = computed(() => {
  if (activeFilter.value === 'all') return COVER_LETTER_TEMPLATE_REGISTRY
  return COVER_LETTER_TEMPLATE_REGISTRY.filter((t) => t.category === activeFilter.value)
})

function selectTemplate(slug: CoverLetterTemplateSlug) {
  selectedSlug.value = slug
  coverLetterStore.setTemplate(slug)
}

function onContinue() {
  formError.value = ''
  if (!selectedSlug.value) {
    formError.value = MSG.wizard.chooseTemplate
    toast.error(MSG.wizard.chooseTemplate)
    nextTick(() => {
      document.querySelector('[role="alert"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
    return
  }
  coverLetterStore.setTemplate(selectedSlug.value)
  if (route.query.flow === 'import') {
    navigateTo('/creer/lettre/editeur')
    return
  }
  navigateTo('/creer/lettre/editeur')
}
</script>

<template>
  <div class="page-container max-w-container-max mx-auto pb-28">
    <NuxtLink to="/creer/lettre" class="text-sm text-secondary font-semibold hover:underline mb-4 inline-flex items-center gap-1 min-h-11">
      <UiPzIcon name="arrow_back" class="text-base" />
      Retour
    </NuxtLink>

    <header class="mb-stack-lg space-y-3">
      <p class="text-sm font-medium text-secondary">{{ MSG.guide.letterModelStep }}</p>
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-on-surface">Choisissez votre modèle</h1>
        <p class="text-on-surface-variant mt-1 text-sm sm:text-base">
          {{ filteredTemplates.length }} modèles pour une lettre claire et professionnelle.
        </p>
      </div>
      <Transition name="form-field__error">
        <UiMessageBanner
          v-if="formError"
          variant="error"
          :message="formError"
          data-form-error
        />
      </Transition>
    </header>

    <div class="flex gap-2 mb-stack-lg overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
      <button
        v-for="filter in COVER_LETTER_TEMPLATE_FILTERS"
        :key="filter.id"
        type="button"
        class="shrink-0 min-h-11 px-4 py-2 rounded-full text-sm font-medium transition-colors"
        :class="
          activeFilter === filter.id
            ? 'bg-secondary text-white'
            : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
        "
        @click="activeFilter = filter.id"
      >
        {{ filter.label }}
      </button>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-gutter">
      <FeatureCoverLetterTemplatesPreviewCard
        v-for="template in filteredTemplates"
        :key="template.slug"
        :slug="template.slug"
        :selected="selectedSlug === template.slug"
        @select="selectTemplate"
      >
        <div>
          <h4 class="font-bold text-on-surface">{{ template.name }}</h4>
          <p class="text-xs text-on-surface-variant">{{ template.category }}</p>
        </div>
      </FeatureCoverLetterTemplatesPreviewCard>
    </div>

    <UiStickyActionBar>
      <UiButton variant="secondary" block @click="onContinue">
        {{ MSG.buttons.continue }}
      </UiButton>
    </UiStickyActionBar>
  </div>
</template>

<style scoped>
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
</style>
