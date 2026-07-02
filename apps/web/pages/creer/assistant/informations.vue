<script setup lang="ts">
import type { TemplateSlug } from '@profiloz/shared'
import { MSG, TEMPLATE_SLUGS, resolveShowPhoto } from '@profiloz/shared'

definePageMeta({ layout: 'wizard', wizardFooter: true })

useGuestSession()
const resumeStore = useResumeStore()
const route = useRoute()
const { goNext } = useWizardNavigation()
const { previewResume } = useWizardPreviewResume()
const { fieldError, formError, clearAll, setFieldError, clearField, scrollToFirstError } = useFormValidation()

useWizardDraftInit()

onMounted(() => {
  const template = typeof route.query.template === 'string' ? route.query.template.toUpperCase() : ''
  const select = typeof route.query.select === 'string' ? route.query.select.toUpperCase() : ''
  const slug = (template || select) as TemplateSlug
  if (TEMPLATE_SLUGS.includes(slug)) {
    resumeStore.setTemplate(slug)
  }
  syncFormFromStore()
})

function syncFormFromStore() {
  const info = resumeStore.current?.personalInfo
  if (!info) return
  form.fullName = info.fullName ?? ''
  form.email = info.email ?? ''
  form.phone = info.phone ?? ''
  form.jobTitle = info.jobTitle ?? ''
  form.location = info.location ?? ''
  form.linkedinUrl = info.linkedinUrl ?? ''
  form.photoUrl = info.photoUrl
}

const form = reactive({
  fullName: resumeStore.current?.personalInfo.fullName ?? '',
  email: resumeStore.current?.personalInfo.email ?? '',
  phone: resumeStore.current?.personalInfo.phone ?? '',
  jobTitle: resumeStore.current?.personalInfo.jobTitle ?? '',
  location: resumeStore.current?.personalInfo.location ?? '',
  linkedinUrl: resumeStore.current?.personalInfo.linkedinUrl ?? '',
  photoUrl: resumeStore.current?.personalInfo.photoUrl as string | undefined,
})

const showPhotoOnCv = computed({
  get: () => resolveShowPhoto(resumeStore.current),
  set: (value: boolean) => resumeStore.setTemplateConfig({ showPhoto: value }),
})

watch(form, () => resumeStore.updatePersonalInfo({ ...form }), { deep: true })

function onPhotoUrlUpdate(value: string | undefined) {
  form.photoUrl = value
  resumeStore.updatePersonalInfo({ photoUrl: value })
}

function validateStep(): boolean {
  clearAll()
  const result = validatePersonalInfoFields(form)
  for (const [key, message] of Object.entries(result.fieldErrors)) {
    setFieldError(key, message)
  }
  formError.value = result.formError
  return result.formError === ''
}

function onContinue() {
  if (!validateStep()) {
    scrollToFirstError()
    return
  }
  resumeStore.updatePersonalInfo({ ...form })
  goNext()
}

useWizardStep({ onContinue })
</script>

<template>
  <FeatureWizardSplitLayout :resume="previewResume">
      <div class="wizard-container flex flex-col items-center py-stack-lg max-w-[800px] mx-auto w-full">
      <div class="w-full space-y-stack-sm mb-stack-lg text-center md:text-left">
        <p class="text-sm font-medium text-secondary">{{ MSG.guide.infoStep }}</p>
        <h1 class="text-2xl font-bold text-on-surface">Commençons par vos informations</h1>
        <p class="text-on-surface-variant">
          Ces informations apparaîtront en tête de votre CV. La photo est facultative.
        </p>
      </div>

      <Transition name="form-field__error">
        <UiMessageBanner
          v-if="formError"
          variant="error"
          :message="formError"
          class="w-full mb-stack-md"
        />
      </Transition>

      <form class="grid grid-cols-1 md:grid-cols-2 gap-gutter w-full" novalidate @submit.prevent="onContinue">
        <div class="md:col-span-2">
          <FeatureWizardPhotoUpload
            :model-value="form.photoUrl"
            v-model:show-on-cv="showPhotoOnCv"
            @update:model-value="onPhotoUrlUpdate"
          />
        </div>
        <div class="space-y-stack-lg">
          <UiFormField label="Nom complet" required :error="fieldError('fullName')">
            <input
              v-model="form.fullName"
              type="text"
              class="form-input w-full"
              placeholder="Jean Dupont"
              @input="clearField('fullName')"
            >
          </UiFormField>
          <UiFormField label="Adresse e-mail" required :error="fieldError('email')">
            <input
              v-model="form.email"
              type="email"
              class="form-input w-full"
              placeholder="jean.dupont@exemple.com"
              @input="clearField('email')"
            >
          </UiFormField>
          <UiFormField label="Téléphone">
            <input v-model="form.phone" type="tel" class="form-input w-full" placeholder="+221 77 000 00 00" />
          </UiFormField>
        </div>
        <div class="space-y-stack-lg">
          <UiFormField label="Poste visé">
            <input v-model="form.jobTitle" type="text" class="form-input w-full" placeholder="Designer produit senior" />
          </UiFormField>
          <UiFormField label="Localisation">
            <input v-model="form.location" type="text" class="form-input w-full" placeholder="Dakar, Sénégal" />
          </UiFormField>
          <UiFormField label="Profil LinkedIn">
            <input v-model="form.linkedinUrl" type="url" class="form-input w-full" placeholder="linkedin.com/in/jeandupont" />
          </UiFormField>
        </div>
      </form>
      </div>
    </FeatureWizardSplitLayout>
</template>
