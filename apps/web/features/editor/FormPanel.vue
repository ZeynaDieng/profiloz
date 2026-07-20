<script setup lang="ts">
import type { Certification, Education, Experience, Interest, Language, Skill } from '@profiloz/shared'
import { MSG, resolveShowPhoto } from '@profiloz/shared'
import { useAi } from '~/composables/useAi'

// FormPanel pour l'édition dynamique du CV
const resumeStore = useResumeStore()
const { fieldErrors, formError, clearAll, setFieldError, clearField, scrollToFirstError, announceFormError, fieldError } = useFormValidation()
const { enhanceText, loading: aiLoading } = useAi()

const openSection = ref('personal')
const sectionErrors = reactive<Record<string, string>>({})

const personalForm = reactive({
  fullName: '',
  email: '',
  phone: '',
  jobTitle: '',
  location: '',
  linkedinUrl: '',
  photoUrl: undefined as string | undefined,
})

const showExtraContactFields = ref(false)

const summary = ref('')
const educations = ref<Education[]>([])
const experiences = ref<Experience[]>([])
const skills = ref<Skill[]>([])
const languages = ref<Language[]>([])
const certifications = ref<Certification[]>([])
const interests = ref<Interest[]>([])

const isHydratingFromStore = ref(false)

const showPhotoOnCv = computed({
  get: () => resolveShowPhoto(resumeStore.current),
  set: (value: boolean) => resumeStore.setTemplateConfig({ showPhoto: value }),
})

const completionPercentage = computed(() => {
  let score = 0
  if (personalForm.fullName?.trim()) score += 15
  if (personalForm.email?.trim()) score += 10
  if (personalForm.phone?.trim()) score += 10
  if (personalForm.jobTitle?.trim()) score += 10
  if (summary.value?.trim()) score += 15
  if (experiences.value.some((e) => e.company?.trim() || e.position?.trim())) score += 20
  if (educations.value.some((e) => e.institution?.trim() || e.degree?.trim())) score += 10
  if (skills.value.some((s) => s.name?.trim())) score += 10
  return score
})

async function handleEnhanceSummary() {
  const textToProcess = summary.value?.trim() || `Rédige un profil professionnel d'accroche captivant et dynamique pour un ${personalForm.jobTitle || 'professionnel'}.`
  const context = personalForm.jobTitle ? `Poste visé : ${personalForm.jobTitle}` : undefined
  const result = await enhanceText(textToProcess, context)
  if (result) {
    summary.value = result
  }
}

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
  if (r.personalInfo?.location || r.personalInfo?.linkedinUrl) {
    showExtraContactFields.value = true
  }
  summary.value = r.summary ?? ''
  educations.value = r.educations.length
    ? [...r.educations]
    : [{ institution: '', degree: '', field: '', startDate: '', endDate: '' }]
  experiences.value = r.experiences.length
    ? [...r.experiences]
    : [{ company: '', position: '', location: '', startDate: '', endDate: '', isCurrent: false, description: '' }]
  skills.value = [...r.skills]
  languages.value = [...(r.languages || [])]
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

function onPhotoUrlUpdate(value: string | undefined) {
  personalForm.photoUrl = value
  if (isHydratingFromStore.value) return
  resumeStore.updatePersonalInfo({ photoUrl: value })
}

watch(summary, (v) => {
  if (isHydratingFromStore.value) return
  resumeStore.setSummary(v)
})

watch(educations, (v) => {
  if (isHydratingFromStore.value) return
  resumeStore.setEducations(v)
}, { deep: true })

watch(experiences, (v) => {
  if (isHydratingFromStore.value) return
  resumeStore.setExperiences(v)
}, { deep: true })

watch(skills, (v) => {
  if (isHydratingFromStore.value) return
  resumeStore.setSkills(v)
}, { deep: true })

watch(languages, (v) => {
  if (isHydratingFromStore.value) return
  resumeStore.setLanguages(v)
}, { deep: true })

watch(certifications, (v) => {
  if (isHydratingFromStore.value) return
  resumeStore.setCertifications(v)
}, { deep: true })

watch(interests, (v) => {
  if (isHydratingFromStore.value) return
  resumeStore.setInterests(v)
}, { deep: true })

const sections = [
  { id: 'personal', label: 'Informations personnelles', icon: 'person' },
  { id: 'summary', label: 'Profil / Résumé', icon: 'description' },
  { id: 'parcours', label: 'Parcours & Expériences', icon: 'work' },
  { id: 'qualifications', label: 'Compétences & Formation', icon: 'school' },
]

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
  validateAll: () => {
    const ok = validateAll()
    if (!ok) announceFormError(formError.value || undefined)
    return ok
  },
  scrollToFirstError,
})
</script>

<template>
  <div class="flex flex-col h-full bg-surface">
    <!-- En-tête avec barre de complétion du CV -->
    <div class="px-4 py-3 border-b border-outline-variant shrink-0 space-y-2">
      <div class="flex items-center justify-between">
        <h2 class="font-bold text-on-surface text-sm sm:text-base">Contenu du CV</h2>
        <span class="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          {{ completionPercentage }}% complété
        </span>
      </div>

      <p class="text-xs text-on-surface-variant block xl:hidden">
        Remplissez vos informations ci-dessous. Appuyez sur <strong>« Aperçu »</strong> en bas pour voir le rendu A4 de votre CV.
      </p>

      <!-- Barre de progression -->
      <div class="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
        <div
          class="bg-primary h-full transition-all duration-500 rounded-full"
          :style="{ width: `${completionPercentage}%` }"
        />
      </div>

      <Transition name="form-field__error">
        <UiMessageBanner
          v-if="formError"
          variant="error"
          :message="formError"
          class="mt-2"
        />
      </Transition>
    </div>

    <div class="flex-1 overflow-y-auto pb-32 xl:pb-6">
      <div v-for="section in sections" :key="section.id" class="border-b border-outline-variant/50">
        <button
          type="button"
          class="w-full flex items-center gap-3 px-4 py-3 min-h-11 text-left hover:bg-surface-container-low transition-colors"
          :class="{ 'bg-error/5': sectionErrors[section.id] }"
          @click="toggleSection(section.id)"
        >
          <UiPzIcon :name="section.icon" class="text-secondary text-[20px]" />
          <span class="font-semibold text-on-surface flex-1 text-sm sm:text-base">{{ section.label }}</span>
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
            <FeatureWizardPhotoUpload
              :model-value="personalForm.photoUrl"
              v-model:show-on-cv="showPhotoOnCv"
              @update:model-value="onPhotoUrlUpdate"
            />
            <div class="grid grid-cols-1 gap-3">
              <UiFormField label="Nom complet" required :error="fieldError('fullName')">
                <input
                  v-model="personalForm.fullName"
                  type="text"
                  class="form-input w-full text-sm"
                  placeholder="Aminata Diallo"
                  @input="clearField('fullName')"
                >
              </UiFormField>

              <UiFormField label="Poste visé">
                <input
                  v-model="personalForm.jobTitle"
                  type="text"
                  class="form-input w-full text-sm"
                  placeholder="Responsable marketing"
                />
              </UiFormField>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <UiFormField label="E-mail" required :error="fieldError('email')">
                  <input
                    v-model="personalForm.email"
                    type="email"
                    class="form-input w-full text-sm"
                    placeholder="aminata@exemple.com"
                    @input="clearField('email')"
                  >
                </UiFormField>

                <UiFormField label="Téléphone">
                  <input
                    v-model="personalForm.phone"
                    type="tel"
                    class="form-input w-full text-sm"
                    placeholder="+221 77 000 00 00"
                  />
                </UiFormField>
              </div>

              <!-- Masquage des champs secondaires pour simplifier la saisie -->
              <div v-if="showExtraContactFields">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <UiFormField label="Localisation / Ville">
                    <input
                      v-model="personalForm.location"
                      type="text"
                      class="form-input w-full text-sm"
                      placeholder="Dakar, Sénégal"
                    />
                  </UiFormField>

                  <UiFormField label="Lien LinkedIn">
                    <input
                      v-model="personalForm.linkedinUrl"
                      type="url"
                      class="form-input w-full text-sm"
                      placeholder="linkedin.com/in/aminatadiallo"
                    />
                  </UiFormField>
                </div>
              </div>
              <button
                v-else
                type="button"
                class="text-xs font-semibold text-primary hover:underline flex items-center gap-1 pt-1 self-start"
                @click="showExtraContactFields = true"
              >
                <UiPzIcon name="add" class="text-sm" />
                <span>+ Ajouter adresse, LinkedIn...</span>
              </button>
            </div>
          </template>

          <template v-else-if="section.id === 'summary'">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <label class="text-xs font-semibold text-on-surface">Résumé / Présentation</label>
                <button
                  type="button"
                  class="text-[11px] font-semibold text-primary hover:text-primary-hover flex items-center gap-1 bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded transition-colors"
                  :disabled="aiLoading"
                  @click="handleEnhanceSummary"
                >
                  <UiPzIcon name="auto_awesome" class="text-[13px]" />
                  <span>{{ aiLoading ? 'Génération...' : (summary?.trim() ? '✨ Reformuler' : '✨ Générer avec l’IA') }}</span>
                </button>
              </div>
              <textarea
                v-model="summary"
                rows="4"
                class="form-input w-full text-sm resize-y"
                placeholder="Ex : Professionnel passionné avec 5 ans d'expérience..."
              />
            </div>
          </template>

          <template v-else-if="section.id === 'parcours'">
            <FeatureWizardExperienceForm v-model="experiences" :field-errors="fieldErrors" />
          </template>

          <template v-else-if="section.id === 'qualifications'">
            <div class="space-y-6">
              <FeatureWizardEducationForm v-model="educations" :field-errors="fieldErrors" />
              <div class="border-t border-outline-variant/30 pt-4 space-y-2">
                <h3 class="font-bold text-sm text-on-surface flex items-center gap-1.5">
                  <UiPzIcon name="psychology" class="text-secondary text-base" />
                  <span>Compétences</span>
                </h3>
                <FeatureWizardSkillsForm v-model="skills" />
              </div>
              <div class="border-t border-outline-variant/30 pt-4 space-y-2">
                <h3 class="font-bold text-sm text-on-surface flex items-center gap-1.5">
                  <UiPzIcon name="translate" class="text-secondary text-base" />
                  <span>Langues parlées</span>
                </h3>
                <FeatureWizardLanguagesForm v-model="languages" />
              </div>
              <div class="border-t border-outline-variant/30 pt-4 space-y-2">
                <h3 class="font-bold text-sm text-on-surface flex items-center gap-1.5">
                  <UiPzIcon name="workspace_premium" class="text-secondary text-base" />
                  <span>Certifications</span>
                </h3>
                <FeatureWizardCertificationsForm v-model="certifications" />
              </div>
              <div class="border-t border-outline-variant/30 pt-4 space-y-2">
                <h3 class="font-bold text-sm text-on-surface flex items-center gap-1.5">
                  <UiPzIcon name="interests" class="text-secondary text-base" />
                  <span>Centres d'intérêt</span>
                </h3>
                <FeatureWizardInterestsForm v-model="interests" />
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
