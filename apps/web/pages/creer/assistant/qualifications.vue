<template>
  <FeatureWizardSplitLayout :resume="previewResume">
    <div class="wizard-container px-margin-mobile md:px-margin-desktop py-stack-lg max-w-[800px] mx-auto space-y-stack-xl">
      <div>
        <h1 class="text-2xl font-bold text-on-surface">Vos qualifications</h1>
        <p class="text-on-surface-variant">Compétences, certifications et centres d'intérêt.</p>
      </div>

      <section class="space-y-stack-md">
        <h2 class="font-bold text-on-surface text-lg">Compétences</h2>
        <FeatureWizardSkillsForm v-model="skills" />
      </section>

      <section class="space-y-stack-md pt-stack-md border-t border-outline-variant/30">
        <h2 class="font-bold text-on-surface text-lg">Certifications</h2>
        <FeatureWizardCertificationsForm v-model="certifications" />
      </section>

      <section class="space-y-stack-md pt-stack-md border-t border-outline-variant/30">
        <h2 class="font-bold text-on-surface text-lg">Centres d'intérêt</h2>
        <FeatureWizardInterestsForm v-model="interests" />
      </section>
    </div>
  </FeatureWizardSplitLayout>
</template>

<script setup lang="ts">
import type { Certification, Interest, Skill } from '@profiloz/shared'

definePageMeta({ layout: 'wizard', wizardFooter: true })

const resumeStore = useResumeStore()
const { goNext } = useWizardNavigation()
const { previewResume } = useWizardPreviewResume()

useWizardDraftInit()

const skills = ref<Skill[]>([...(resumeStore.current?.skills ?? [])])
const certifications = ref<Certification[]>([...(resumeStore.current?.certifications ?? [])])
const interests = ref<Interest[]>([...(resumeStore.current?.interests ?? [])])

function persist() {
  resumeStore.setSkills(skills.value)
  resumeStore.setCertifications(certifications.value.filter((c) => c.name))
  resumeStore.setInterests(interests.value.filter((i) => i.name))
}

watch(skills, () => resumeStore.setSkills(skills.value), { deep: true })
watch(certifications, () => resumeStore.setCertifications(certifications.value.filter((c) => c.name)), { deep: true })
watch(interests, () => resumeStore.setInterests(interests.value.filter((i) => i.name)), { deep: true })

function onContinue() {
  persist()
  goNext()
}

function onSkip() {
  persist()
  goNext()
}

useWizardStep({ showSkip: true, onContinue, onSkip })
</script>
