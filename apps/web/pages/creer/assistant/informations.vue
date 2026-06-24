<template>
  <WizardStep @continue="onContinue">
    <FeatureWizardSplitLayout :resume="resumeStore.current">
      <div class="wizard-container flex flex-col items-center px-margin-mobile md:px-margin-desktop py-stack-lg max-w-[800px] mx-auto">
      <div class="w-full space-y-stack-sm mb-stack-lg text-center md:text-left">
        <h1 class="text-2xl font-bold text-on-surface">Commençons par vos informations</h1>
        <p class="text-on-surface-variant">
          Ces informations apparaîtront en tête de votre CV. La photo est facultative.
        </p>
      </div>
      <form class="grid grid-cols-1 md:grid-cols-2 gap-gutter w-full" @submit.prevent="onContinue">
        <div class="md:col-span-2">
          <FeatureWizardPhotoUpload v-model="form.photoUrl" />
        </div>
        <div class="space-y-stack-lg">
          <UiFormField label="Nom complet" required>
            <input v-model="form.fullName" type="text" class="form-input w-full" placeholder="Jean Dupont" required />
          </UiFormField>
          <UiFormField label="Adresse e-mail" required>
            <input v-model="form.email" type="email" class="form-input w-full" placeholder="jean.dupont@exemple.com" required />
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
  </WizardStep>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'wizard' })

useGuestSession()
const resumeStore = useResumeStore()
const { goNext } = useWizardNavigation()
resumeStore.initDraft()

const form = reactive({
  fullName: resumeStore.current?.personalInfo.fullName ?? '',
  email: resumeStore.current?.personalInfo.email ?? '',
  phone: resumeStore.current?.personalInfo.phone ?? '',
  jobTitle: resumeStore.current?.personalInfo.jobTitle ?? '',
  location: resumeStore.current?.personalInfo.location ?? '',
  linkedinUrl: resumeStore.current?.personalInfo.linkedinUrl ?? '',
  photoUrl: resumeStore.current?.personalInfo.photoUrl as string | undefined,
})

watch(form, () => resumeStore.updatePersonalInfo({ ...form }), { deep: true })

function onContinue() {
  if (!form.fullName || !form.email) return
  resumeStore.updatePersonalInfo({ ...form })
  goNext()
}
</script>
