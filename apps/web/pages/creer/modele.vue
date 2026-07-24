<script setup lang="ts">
import type { TemplateSlug } from '@profiloz/shared'
import { MSG, TEMPLATE_SLUGS } from '@profiloz/shared'
import { TEMPLATE_FILTERS, TEMPLATE_REGISTRY } from '~/features/templates/registry'
import { resolveTemplatePickerReturn } from '~/utils/template-navigation'

definePageMeta({ layout: 'wizard', wizardFooter: true })

useGuestSession()
const resumeStore = useResumeStore()
const route = useRoute()
const { goNext } = useWizardNavigation()
const formError = ref('')
const toast = useAppToast()

const returnPath = computed(() => resolveTemplatePickerReturn(route))

onMounted(() => {
  if (!resumeStore.current?.personalInfo.fullName) {
    resumeStore.rehydrateFromStorage()
  }
  resumeStore.initDraft()

  const select = typeof route.query.select === 'string' ? route.query.select.toUpperCase() : ''
  const template = typeof route.query.template === 'string' ? route.query.template.toUpperCase() : ''
  const slug = (select || template) as TemplateSlug
  if (slug && TEMPLATE_SLUGS.includes(slug as TemplateSlug)) {
    selectedSlug.value = slug as TemplateSlug
    resumeStore.setTemplate(slug as TemplateSlug)
  } else if (!selectedSlug.value && resumeStore.current?.templateSlug) {
    selectedSlug.value = resumeStore.current.templateSlug
  }
  if (selectedSlug.value) {
    resumeStore.setTemplate(selectedSlug.value)
  }
})

const activeFilter = ref('all')
const selectedSlug = ref<TemplateSlug | null>(
  (route.query.select as TemplateSlug) ?? resumeStore.current?.templateSlug ?? 'PROFESSIONNEL',
)

const filteredTemplates = computed(() => {
  if (activeFilter.value === 'all') return TEMPLATE_REGISTRY
  return TEMPLATE_REGISTRY.filter((t) => t.category === activeFilter.value)
})

function selectTemplate(slug: TemplateSlug) {
  selectedSlug.value = slug
  resumeStore.setTemplate(slug)
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
  resumeStore.setTemplate(selectedSlug.value)
  const back = returnPath.value
  if (back) {
    navigateTo(back)
    return
  }
  navigateTo('/creer/editeur')
}

useWizardStep(computed(() => ({
  onContinue,
  nextLabel: returnPath.value ? 'Appliquer ce modèle' : 'Commencer la rédaction',
})))
</script>

<template>
  <div class="page-container max-w-container-max mx-auto pb-4">
    <header class="mb-stack-lg space-y-3">
      <NuxtLink
        v-if="returnPath"
        :to="returnPath"
        class="inline-flex items-center gap-1 text-sm text-secondary font-semibold hover:underline"
      >
        <UiPzIcon name="arrow_back" class="text-[18px]" />
        Retour
      </NuxtLink>
      <p class="text-sm font-medium text-secondary">{{ MSG.guide.modelStep }}</p>
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-on-surface">Choisissez votre modèle</h1>
        <p class="text-on-surface-variant mt-1 text-sm sm:text-base">
          {{ filteredTemplates.length }} modèles pour un CV clair et professionnel.
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
        v-for="filter in TEMPLATE_FILTERS"
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

    <div class="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 sm:gap-y-7 lg:gap-y-10">
      <FeatureTemplatesPreviewCard
        v-for="template in filteredTemplates"
        :key="template.slug"
        :slug="template.slug"
        :selected="selectedSlug === template.slug"
        :user-snapshot="resumeStore.current"
        class=""
        @select="selectTemplate"
      >
        <div>
          <h4 class="font-bold text-on-surface">{{ template.name }}</h4>
          <p class="text-xs text-on-surface-variant">{{ template.category }}</p>
        </div>
      </FeatureTemplatesPreviewCard>
    </div>
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
