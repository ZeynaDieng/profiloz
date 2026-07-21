<script setup lang="ts">
import type { Certification, Education, Experience, Interest, Language, Skill, TemplateSlug } from '@profiloz/shared'
import { resolveShowPhoto } from '@profiloz/shared'
import { EXTENDED_ACCENT_PALETTE } from '~/utils/template-accent-colors'

// FormPanel pour l'édition dynamique du CV avec ergonomie SaaS Mobile Premium
const resumeStore = useResumeStore()
const { fieldErrors, formError, clearAll, setFieldError, clearField, scrollToFirstError, announceFormError, fieldError } = useFormValidation()
const { enhanceText, loading: aiLoading } = useAi()

const openSection = ref('personal')
const sectionErrors = reactive<Record<string, string>>({})
const showAllColors = ref(false)

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

const currentTemplateSlug = computed<TemplateSlug>(() => resumeStore.current?.templateSlug ?? 'PROFESSIONNEL')
const currentAccentColor = computed<string>(() => resumeStore.current?.templateConfig?.accentColor ?? '#0051d5')

const availableAccentColors = [...EXTENDED_ACCENT_PALETTE]

// 6 Couleurs d'accent stars
const primaryPalette = ['#0051d5', '#1e293b', '#10b981', '#8b5cf6', '#f97316', '#ef4444']

const displayedAccentColors = computed(() => {
  if (!availableAccentColors.value || availableAccentColors.value.length === 0) return primaryPalette
  if (showAllColors.value) return availableAccentColors.value
  return primaryPalette
})

const CV_TEMPLATES: { slug: TemplateSlug; name: string; desc: string }[] = [
  { slug: 'PROFESSIONNEL', name: 'Professionnel', desc: 'Structure rigoureuse et intemporelle' },
  { slug: 'MODERNE', name: 'Moderne', desc: 'Design épuré et contemporain' },
  { slug: 'ETUDIANT', name: 'Étudiant', desc: 'Mise en valeur des formations' },
  { slug: 'DEVELOPPEUR', name: 'Développeur', desc: 'Axé compétences et projets' },
  { slug: 'COMMERCIAL', name: 'Commercial', desc: 'Dynamic et orienté résultats' },
  { slug: 'MANAGER', name: 'Executive', desc: 'Élégant pour cadres et responsables' },
  { slug: 'INTERNATIONAL', name: 'International', desc: 'Format standard bilingue' },
  { slug: 'MINIMALISTE', name: 'Minimaliste', desc: 'Clarté et sobriété absolue' },
]

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
    openSection.value = 'summary'
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
  { id: 'personal', label: '1. Informations personnelles', icon: 'person', shortLabel: 'Profil' },
  { id: 'summary', label: '2. Profil / Résumé IA', icon: 'description', shortLabel: 'Résumé' },
  { id: 'parcours', label: '3. Parcours & Expériences', icon: 'work', shortLabel: 'Expériences' },
  { id: 'qualifications', label: '4. Compétences & Formation', icon: 'school', shortLabel: 'Compétences' },
  { id: 'design', label: '5. Modèle & Couleurs (Design)', icon: 'palette', shortLabel: 'Design' },
]

function toggleSection(id: string, event?: Event) {
  const isOpening = openSection.value !== id
  openSection.value = isOpening ? id : ''

  if (isOpening && event?.currentTarget) {
    nextTick(() => {
      const btn = event.currentTarget as HTMLElement
      btn.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }
}

function scrollToSection(id: string) {
  openSection.value = id
  nextTick(() => {
    const el = document.querySelector(`[data-section-id="${id}"]`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
}

function selectTemplate(slug: TemplateSlug) {
  resumeStore.setTemplate(slug)
}

function selectAccentColor(color: string) {
  resumeStore.setTemplateConfig({ accentColor: color })
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
    <!-- 🚀 BARRE DE PROGRESSION & HÉROS IA -->
    <div class="p-3.5 sm:p-4 border-b border-outline-variant/40 shrink-0 space-y-3 bg-surface-container/20">
      <!-- Progression 1 ligne épurée -->
      <div class="flex items-center justify-between gap-2">
        <span class="text-xs font-bold text-on-surface">
          Votre CV est complété à <span class="text-primary font-extrabold">{{ completionPercentage }}%</span>
        </span>
        <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full" :class="completionPercentage >= 100 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-primary/10 text-primary'">
          {{ completionPercentage >= 100 ? 'Prêt' : `${completionPercentage}%` }}
        </span>
      </div>

      <!-- Barre de progression -->
      <div class="w-full bg-surface-container-high h-2 rounded-full overflow-hidden p-0.5">
        <div
          class="bg-primary h-full transition-all duration-500 rounded-full"
          :style="{ width: `${completionPercentage}%` }"
        />
      </div>

      <!-- BANNIÈRE HERO IA TOUT EN HAUT -->
      <div class="p-3.5 rounded-xl bg-gradient-to-r from-primary/15 via-secondary/15 to-primary/10 border border-primary/25 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div class="space-y-0.5">
          <h3 class="text-xs sm:text-sm font-extrabold text-on-surface flex items-center gap-1.5">
            <span>✨ Booster mon CV avec l'IA en 1 clic</span>
          </h3>
          <p class="text-[11px] text-on-surface-variant leading-relaxed">
            L'IA rédige votre profil, suggère des puces d'expérience et corrige les fautes.
          </p>
        </div>
        <button
          type="button"
          class="w-full sm:w-auto px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs hover:bg-primary-hover shadow-md transition-all flex items-center justify-center gap-1.5 shrink-0 active:scale-95"
          @click="handleEnhanceSummary(); openSection = 'summary'"
        >
          <span>{{ aiLoading ? 'Génération...' : 'Générer mon profil IA' }}</span>
        </button>
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

    <!-- 📱 PUCES DE NAVIGATION RAPIDE PAR SECTIONS (ACCÈS 1 TAP SUR MOBILE) -->
    <div class="flex items-center gap-2 px-3 py-2 overflow-x-auto border-b border-outline-variant/30 bg-surface-container/40 scrollbar-none shrink-0">
      <button
        v-for="sec in sections"
        :key="sec.id"
        type="button"
        class="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
        :class="openSection === sec.id ? 'bg-primary text-on-primary shadow-xs' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'"
        @click="scrollToSection(sec.id)"
      >
        <UiPzIcon :name="sec.icon" class="text-xs" />
        <span>{{ sec.shortLabel }}</span>
      </button>
    </div>

    <div class="flex-1 overflow-y-auto pb-32 xl:pb-6">
      <div
        v-for="section in sections"
        :key="section.id"
        :data-section-id="section.id"
        class="border-b border-outline-variant/40"
      >
        <button
          type="button"
          class="w-full flex items-center gap-3 px-4 py-3.5 min-h-12 text-left hover:bg-surface-container-low transition-colors"
          :class="{ 'bg-error/5': sectionErrors[section.id] }"
          @click="toggleSection(section.id, $event)"
        >
          <UiPzIcon :name="section.icon" class="text-secondary text-[20px] shrink-0" />
          <span class="font-bold text-on-surface flex-1 text-sm sm:text-base">{{ section.label }}</span>
          <UiPzIcon
            v-if="sectionErrors[section.id]"
            name="error"
            class="text-error text-[18px] shrink-0"
            aria-hidden="true"
          />
          <UiPzIcon
            :name="openSection === section.id ? 'expand_less' : 'expand_more'"
            class="text-on-surface-variant shrink-0"
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
              <div class="flex items-center justify-between gap-2">
                <label class="text-xs font-semibold text-on-surface">Résumé / Présentation</label>
                <button
                  type="button"
                  class="text-[11px] font-bold text-primary hover:text-primary-hover flex items-center gap-1 bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-lg transition-colors active:scale-95"
                  :disabled="aiLoading"
                  @click="handleEnhanceSummary"
                >
                  <span>{{ aiLoading ? 'Génération...' : (summary?.trim() ? '✨ Reformuler avec l’IA' : '✨ Générer mon profil IA') }}</span>
                </button>
              </div>
              <textarea
                v-model="summary"
                rows="4"
                class="form-input w-full text-sm resize-y leading-relaxed"
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

          <!-- 🎨 SECTION 5 : MODÈLE & COULEURS DU CV EN GRILLE DE 2 SUR MOBILE -->
          <template v-else-if="section.id === 'design'">
            <div class="space-y-5 pt-2">
              <!-- PALETTE DE COULEURS SIMPLIFIÉE -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <p class="text-xs font-bold text-on-surface">Couleur d'accent du CV</p>
                  <button
                    v-if="availableAccentColors && availableAccentColors.length > 6"
                    type="button"
                    class="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                    @click="showAllColors = !showAllColors"
                  >
                    <span>{{ showAllColors ? 'Voir moins' : '+ Plus de couleurs' }}</span>
                    <UiPzIcon :name="showAllColors ? 'expand_less' : 'expand_more'" class="text-xs" />
                  </button>
                </div>
                <div class="flex flex-wrap gap-2.5">
                  <button
                    v-for="color in displayedAccentColors"
                    :key="color"
                    type="button"
                    class="w-8 h-8 rounded-full ring-2 ring-offset-2 transition-all hover:scale-110 active:scale-95 shadow-2xs"
                    :class="currentAccentColor === color ? 'ring-primary scale-105' : 'ring-transparent opacity-85 hover:opacity-100'"
                    :style="{ backgroundColor: color }"
                    :aria-label="`Couleur ${color}`"
                    @click="selectAccentColor(color)"
                  />
                </div>
              </div>

              <!-- CHOIX DU MODÈLE DE CV EN GRILLE DE 2 SUR MOBILE -->
              <div class="space-y-2.5">
                <p class="text-xs font-bold text-on-surface">Modèles de CV disponibles</p>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <button
                    v-for="tpl in CV_TEMPLATES"
                    :key="tpl.slug"
                    type="button"
                    class="group relative rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-2xs"
                    :class="
                      currentTemplateSlug === tpl.slug
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-outline-variant/60 hover:border-primary/50 bg-surface-container-lowest'
                    "
                    @click="selectTemplate(tpl.slug)"
                  >
                    <!-- Miniature vectorielle du modèle de CV -->
                    <div class="w-full aspect-[3/4] rounded-lg bg-surface-container/30 border border-outline-variant/30 mb-2 p-1.5 overflow-hidden flex flex-col justify-between group-hover:bg-surface-container/60 transition-colors">
                      <div class="space-y-1">
                        <div
                          class="h-2 rounded-sm transition-colors"
                          :style="{ backgroundColor: currentTemplateSlug === tpl.slug ? currentAccentColor : '#0051d5' }"
                        />
                        <div class="h-1 w-2/3 bg-on-surface/60 rounded-full" />
                        <div class="h-1 w-1/2 bg-on-surface-variant/30 rounded-full" />
                      </div>
                      <div class="space-y-1 my-1">
                        <div class="h-1 w-full bg-on-surface-variant/25 rounded-full" />
                        <div class="h-1 w-5/6 bg-on-surface-variant/25 rounded-full" />
                        <div class="h-1 w-4/5 bg-on-surface-variant/25 rounded-full" />
                      </div>
                      <div class="h-1.5 w-full bg-surface-container-high rounded-xs" />
                    </div>

                    <div class="flex items-center justify-between">
                      <p class="font-extrabold text-xs text-on-surface">{{ tpl.name }}</p>
                      <span v-if="currentTemplateSlug === tpl.slug" class="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <p class="text-[10px] text-on-surface-variant mt-0.5 line-clamp-1 font-medium">{{ tpl.desc }}</p>
                  </button>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
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
