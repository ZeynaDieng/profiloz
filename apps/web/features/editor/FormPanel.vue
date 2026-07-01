<script setup lang="ts">
import type { Certification, Education, Experience, Interest, Skill } from '@profiloz/shared'
import { MSG } from '@profiloz/shared'

const resumeStore = useResumeStore()
const { fieldErrors, formError, clearAll, setFieldError, clearField, scrollToFirstError, fieldError } = useFormValidation()

const openSection = ref('personal')
const sectionErrors = reactive<Record<string, string>>({})

const personalForm = reactive({
  fullName: '',
  email: '',
  phone: '',
  jobTitle: '',
  location: '',
  linkedinUrl: '',
  photoUrl: '' as string | undefined,
})

const summary = ref('')
const educations = ref<Education[]>([])
const experiences = ref<Experience[]>([])
const skills = ref<Skill[]>([])
const certifications = ref<Certification[]>([])
const interests = ref<Interest[]>([])

const isHydratingFromStore = ref(false)

function loadFromStore() {
  const r = resumeStore.current
  if (!r) return

  isHydratingFromStore.value = true
  Object.assign(personalForm, {
    fullName: '',
    email: '',
    phone: '',
    jobTitle: '',
    location: '',
    linkedinUrl: '',
    photoUrl: undefined as string | undefined,
    ...r.personalInfo,
  })
  summary.value = r.summary ?? ''
  educations.value = r.educations.length
    ? [...r.educations]
    : [{ institution: '', degree: '', field: '', startDate: '', endDate: '' }]
  experiences.value = r.experiences.length
    ? [...r.experiences]
    : [{ company: '', position: '', location: '', startDate: '', endDate: '', isCurrent: false, description: '' }]
  skills.value = [...r.skills]
  certifications.value = [...r.certifications]
  interests.value = [...r.interests]
  nextTick(() => {
    isHydratingFromStore.value = false
  })
}

onMounted(() => {
  loadFromStore()
})

watch(
  () => resumeStore.current?.id,
  (id, previousId) => {
    if (id && id !== previousId) loadFromStore()
  },
)

watch(personalForm, () => {
  if (isHydratingFromStore.value) return
  resumeStore.updatePersonalInfo({ ...personalForm })
}, { deep: true })
watch(summary, (v) => {
  if (isHydratingFromStore.value) return
  resumeStore.setSummary(v)
})
watch(educations, (v) => {
  if (isHydratingFromStore.value) return
  resumeStore.setEducations(
    v.filter((e) => e.institution?.trim() || e.degree?.trim() || e.field?.trim() || e.startDate?.trim() || e.endDate?.trim()),
  )
}, { deep: true })
watch(experiences, (v) => {
  if (isHydratingFromStore.value) return
  resumeStore.setExperiences(filterExperiencesWithContent(v))
}, { deep: true })
watch(skills, (v) => {
  if (isHydratingFromStore.value) return
  resumeStore.setSkills(v)
}, { deep: true })
watch(certifications, (v) => {
  if (isHydratingFromStore.value) return
  resumeStore.setCertifications(v.filter((c) => c.name))
}, { deep: true })
watch(interests, (v) => {
  if (isHydratingFromStore.value) return
  resumeStore.setInterests(v.filter((i) => i.name))
}, { deep: true })

const sections = [
  { id: 'personal', label: 'Informations', icon: 'person' },
  { id: 'summary', label: 'Profil', icon: 'article' },
  { id: 'parcours', label: 'Parcours', icon: 'work_history' },
  { id: 'qualifications', label: 'Qualifications', icon: 'stars' },
] as const

function toggleSection(id: string) {
  openSection.value = openSection.value === id ? '' : id
}

function applyValidationResult(
  personal: ReturnType<typeof validatePersonalInfoFields>,
  parcours: ReturnType<typeof validateParcoursFields>,
) {
  clearAll()
  for (const key of Object.keys(sectionErrors)) {
    delete sectionErrors[key]
  }

  for (const [key, message] of Object.entries(personal.fieldErrors)) {
    setFieldError(key, message)
  }
  for (const [key, message] of Object.entries(parcours.fieldErrors)) {
    setFieldError(key, message)
  }

  if (personal.formError) sectionErrors.personal = personal.formError
  if (parcours.formError) sectionErrors.parcours = parcours.formError

  formError.value = personal.formError || parcours.formError || ''
}

function validateAll(): boolean {
  const personal = validatePersonalInfoFields(personalForm)
  const parcours = validateParcoursFields(educations.value, experiences.value)
  applyValidationResult(personal, parcours)

  const firstSection = firstResumeEditorSectionWithErrors(fieldErrors)
  if (firstSection) {
    openSection.value = firstSection
  }

  return !formError.value
}

provideResumeEditorValidation({
  validateAll,
  scrollToFirstError,
})
</script>

<template>
  <div class="flex flex-col h-full bg-surface">
    <div class="px-4 py-3 border-b border-outline-variant shrink-0">
      <h2 class="font-bold text-on-surface">Modifier le contenu</h2>
      <p class="text-xs text-on-surface-variant mt-0.5">
        <span class="lg:hidden">Les changements s’affichent dans l’aperçu.</span>
        <span class="hidden lg:inline">Les changements s'affichent instantanément à droite.</span>
      </p>
      <Transition name="form-field__error">
        <UiMessageBanner
          v-if="formError"
          variant="error"
          :message="formError"
          class="mt-3"
        />
      </Transition>
    </div>

    <div class="flex-1 overflow-y-auto">
      <div v-for="section in sections" :key="section.id" class="border-b border-outline-variant/50">
        <button
          type="button"
          class="w-full flex items-center gap-3 px-4 py-3 min-h-11 text-left hover:bg-surface-container-low transition-colors"
          :class="{ 'bg-error/5': sectionErrors[section.id] }"
          @click="toggleSection(section.id)"
        >
          <UiPzIcon :name="section.icon" class="text-secondary text-[20px]" />
          <span class="font-semibold text-on-surface flex-1">{{ section.label }}</span>
          <UiPzIcon
            v-if="sectionErrors[section.id]"
            name="error"
            class="text-error text-[18px] shrink-0"
            aria-hidden="true"
          />
          <UiPzIcon
            :name="openSection === section.id ? 'expand_less' : 'expand_more'"
            class="text-on-surface-variant"
          />
        </button>

        <div v-show="openSection === section.id" class="px-4 pb-4 space-y-4">
          <UiMessageBanner
            v-if="sectionErrors[section.id]"
            variant="error"
            :message="sectionErrors[section.id]"
          />

          <template v-if="section.id === 'personal'">
            <FeatureWizardPhotoUpload v-model="personalForm.photoUrl" />
            <div class="grid grid-cols-1 gap-3">
              <UiFormField label="Nom complet" required :error="fieldError('fullName')">
                <input
                  v-model="personalForm.fullName"
                  type="text"
                  class="form-input w-full"
                  @input="clearField('fullName')"
                >
              </UiFormField>
              <UiFormField label="E-mail" required :error="fieldError('email')">
                <input
                  v-model="personalForm.email"
                  type="email"
                  class="form-input w-full"
                  @input="clearField('email')"
                >
              </UiFormField>
              <UiFormField label="Téléphone">
                <input v-model="personalForm.phone" type="tel" class="form-input w-full" />
              </UiFormField>
              <UiFormField label="Poste visé">
                <input v-model="personalForm.jobTitle" type="text" class="form-input w-full" />
              </UiFormField>
              <UiFormField label="Localisation">
                <input v-model="personalForm.location" type="text" class="form-input w-full" />
              </UiFormField>
              <UiFormField label="LinkedIn">
                <input v-model="personalForm.linkedinUrl" type="url" class="form-input w-full" />
              </UiFormField>
            </div>
          </template>

          <template v-else-if="section.id === 'summary'">
            <UiFormField label="Résumé professionnel">
              <textarea
                v-model="summary"
                rows="4"
                class="form-input w-full resize-none"
                placeholder="Quelques lignes sur votre profil..."
              />
            </UiFormField>
          </template>

          <template v-else-if="section.id === 'parcours'">
            <div class="space-y-stack-md">
              <p class="text-sm font-bold text-on-surface">Formation</p>
              <FeatureWizardEducationForm v-model="educations" :field-errors="fieldErrors" />
            </div>
            <div class="space-y-stack-md pt-4 border-t border-outline-variant/30">
              <p class="text-sm font-bold text-on-surface">Expérience</p>
              <FeatureWizardExperienceForm v-model="experiences" :field-errors="fieldErrors" />
            </div>
          </template>

          <template v-else-if="section.id === 'qualifications'">
            <div class="space-y-stack-md">
              <p class="text-sm font-bold text-on-surface">Compétences</p>
              <FeatureWizardSkillsForm v-model="skills" />
            </div>
            <div class="space-y-stack-md pt-4 border-t border-outline-variant/30">
              <p class="text-sm font-bold text-on-surface">Certifications</p>
              <FeatureWizardCertificationsForm v-model="certifications" />
            </div>
            <div class="space-y-stack-md pt-4 border-t border-outline-variant/30">
              <p class="text-sm font-bold text-on-surface">Centres d'intérêt</p>
              <FeatureWizardInterestsForm v-model="interests" />
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
