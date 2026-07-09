<script setup lang="ts">
import type { Education, Experience } from '@profiloz/shared'

definePageMeta({ layout: 'wizard', wizardFooter: true })

const resumeStore = useResumeStore()
const { goNext } = useWizardNavigation()
const { previewResume } = useWizardPreviewResume()
const { fieldErrors, formError, clearAll, setFieldError, announceFormError } = useFormValidation()

useWizardDraftInit()

const educations = ref<Education[]>(
  resumeStore.current?.educations.length
    ? [...resumeStore.current.educations]
    : [{ institution: '', degree: '', field: '', startDate: '', endDate: '' }],
)

const experiences = ref<Experience[]>(
  resumeStore.current?.experiences.length
    ? [...resumeStore.current.experiences]
    : [{ company: '', position: '', location: '', startDate: '', endDate: '', isCurrent: false, description: '' }],
)

function persistEducations() {
  resumeStore.setEducations(
    educations.value.filter(
      (e) => e.institution?.trim() || e.degree?.trim() || e.field?.trim() || e.startDate?.trim() || e.endDate?.trim(),
    ),
  )
}

function persistExperiences() {
  resumeStore.setExperiences(filterExperiencesWithContent(experiences.value))
}

function persist() {
  persistEducations()
  persistExperiences()
}

watch(educations, persistEducations, { deep: true })
watch(experiences, persistExperiences, { deep: true })

function validateStep(): boolean {
  clearAll()
  const result = validateParcoursFields(educations.value, experiences.value)
  for (const [key, message] of Object.entries(result.fieldErrors)) {
    setFieldError(key, message)
  }
  formError.value = result.formError
  return result.formError === ''
}

function onContinue() {
  if (!validateStep()) {
    announceFormError(formError.value || undefined)
    return
  }
  persist()
  goNext()
}

function onSkip() {
  clearAll()
  persist()
  goNext()
}

useWizardStep({ showSkip: true, onContinue, onSkip })
</script>

<template>
  <FeatureWizardSplitLayout :resume="previewResume">
    <div class="wizard-container px-margin-mobile md:px-margin-desktop py-stack-lg max-w-[800px] mx-auto space-y-stack-xl">
      <div>
        <h1 class="text-2xl font-bold text-on-surface">Votre parcours</h1>
        <p class="text-on-surface-variant">Formation et expériences professionnelles.</p>
      </div>

      <Transition name="form-field__error">
        <UiMessageBanner v-if="formError" variant="error" :message="formError" />
      </Transition>

      <section class="space-y-stack-md">
        <h2 class="font-bold text-on-surface text-lg">Formation</h2>
        <FeatureWizardEducationForm v-model="educations" :field-errors="fieldErrors" />
      </section>

      <section class="space-y-stack-md pt-stack-md border-t border-outline-variant/30">
        <h2 class="font-bold text-on-surface text-lg">Expérience professionnelle</h2>
        <FeatureWizardExperienceForm v-model="experiences" :field-errors="fieldErrors" />
      </section>
    </div>
  </FeatureWizardSplitLayout>
</template>
