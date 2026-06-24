<template>
  <WizardStep show-skip @continue="onContinue" @skip="onSkip">
    <FeatureWizardSplitLayout :resume="resumeStore.current">
      <div class="wizard-container px-margin-mobile md:px-margin-desktop py-stack-lg max-w-[800px] mx-auto space-y-stack-xl">
      <div>
        <h1 class="text-2xl font-bold text-on-surface">Votre parcours</h1>
        <p class="text-on-surface-variant">Formation et expériences professionnelles.</p>
      </div>

      <section class="space-y-stack-md">
        <h2 class="font-bold text-on-surface text-lg">Formation</h2>
        <FeatureWizardEducationForm v-model="educations" />
      </section>

      <section class="space-y-stack-md pt-stack-md border-t border-outline-variant/30">
        <h2 class="font-bold text-on-surface text-lg">Expérience professionnelle</h2>
        <FeatureWizardExperienceForm v-model="experiences" />
      </section>
      </div>
    </FeatureWizardSplitLayout>
  </WizardStep>
</template>

<script setup lang="ts">
import type { Education, Experience } from '@profiloz/shared'

definePageMeta({ layout: 'wizard' })

const resumeStore = useResumeStore()
const { goNext } = useWizardNavigation()
resumeStore.initDraft()

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

function persist() {
  resumeStore.setEducations(educations.value.filter((e) => e.institution && e.degree))
  resumeStore.setExperiences(experiences.value.filter((e) => e.company && e.position))
}

function onContinue() {
  persist()
  goNext()
}

function onSkip() {
  persist()
  goNext()
}
</script>
