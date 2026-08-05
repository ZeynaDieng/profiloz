<script setup lang="ts">
import type { Certification, Education, Experience, Interest, Language, Skill, TemplateSlug } from '@profiloz/shared'
import { resolveShowPhoto } from '@profiloz/shared'
import { EXTENDED_ACCENT_PALETTE } from '~/utils/template-accent-colors'

// FormPanel pour l'édition dynamique du CV avec ergonomie SaaS Mobile Premium
const resumeStore = useResumeStore()
const { pageCount, isOverflowing } = useResumePageOverflowState()
const { fieldErrors, formError, clearAll, setFieldError, clearField, scrollToFirstError, announceFormError, fieldError } = useFormValidation()
const { enhanceText, loading: aiLoading } = useAi()

const openSection = useState<string>('active-editor-section', () => 'personal')
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
  if (showAllColors.value) return availableAccentColors
  return primaryPalette
})

const CV_TEMPLATES: { slug: TemplateSlug; name: string; desc: string }[] = [
  { slug: 'PROFESSIONNEL', name: 'Professionnel', desc: 'Structure rigoureuse et intemporelle' },
  { slug: 'MODERNE', name: 'Moderne', desc: 'Design épuré et contemporain' },
  { slug: 'ETUDIANT', name: 'Étudiant', desc: 'Mise en valeur des formations' },
  { slug: 'DEVELOPPEUR', name: 'Développeur', desc: 'Axé compétences et projets' },
  { slug: 'COMMERCIAL', name: 'Commercial', desc: 'Dynamique et orienté résultats' },
  { slug: 'MANAGER', name: 'Executive', desc: 'Élégant pour cadres et responsables' },
  { slug: 'INTERNATIONAL', name: 'International', desc: 'Format standard bilingue' },
  { slug: 'MINIMALISTE', name: 'Minimaliste', desc: 'Clarté et sobriété absolue' },
  { slug: 'CREATIF', name: 'Créatif', desc: 'Layout artistique et audacieux' },
  { slug: 'PREMIUM', name: 'Premium', desc: 'Esthétique luxueuse et soignée' },
  { slug: 'CADRE', name: 'Cadre', desc: 'Idéal pour managers et dirigeants' },
  { slug: 'EXECUTIF', name: 'Exécutif', desc: 'Structure haut de gamme et sobre' },
  { slug: 'EPURE', name: 'Épuré', desc: 'Design aéré et moderne' },
  { slug: 'TECH_LEAD', name: 'Tech Lead', desc: 'Parfait pour les profils techniques' },
  { slug: 'ELEGANCE', name: 'Élégance', desc: 'Design minimaliste chic' },
  { slug: 'IMPACT', name: 'Impact', desc: 'Idéal pour le marketing et la comm' },
  { slug: 'CABINET', name: 'Cabinet', desc: 'Style classique pour droit et finance' },
  { slug: 'ACADEMIQUE', name: 'Académique', desc: 'Enseignement et recherche' },
  { slug: 'ATELIER', name: 'Atelier', desc: 'Style chaleureux pour créatifs' },
  { slug: 'CLINIQUE', name: 'Clinique', desc: 'Médical, santé et soin' },
  { slug: 'DUOTONE', name: 'DuoTone', desc: 'Style bicolore contemporain' },
  { slug: 'CHRONOS', name: 'Chronos', desc: 'Présentation avec timeline' },
  { slug: 'ATS_FRIENDLY', name: 'ATS Friendly', desc: 'Optimisé pour les filtres robots' },
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
    fullName: r.personalInfo?.fullName ?? '',
    email: r.personalInfo?.email ?? '',
    phone: r.personalInfo?.phone ?? '',
    jobTitle: r.personalInfo?.jobTitle ?? '',
    location: r.personalInfo?.location ?? '',
    linkedinUrl: r.personalInfo?.linkedinUrl ?? '',
    photoUrl: r.personalInfo?.photoUrl ?? undefined,
  })
  if (r.personalInfo?.location || r.personalInfo?.linkedinUrl) {
    showExtraContactFields.value = true
  }
  summary.value = r.summary ?? ''
  educations.value = r.educations?.length
    ? r.educations.map((e) => ({ ...e }))
    : [{ institution: '', degree: '', field: '', startDate: '', endDate: '' }]
  experiences.value = r.experiences?.length
    ? r.experiences.map((e) => ({ ...e }))
    : [{ company: '', position: '', location: '', startDate: '', endDate: '', isCurrent: false, description: '' }]
  skills.value = r.skills ? r.skills.map((s) => ({ ...s })) : []
  languages.value = r.languages ? r.languages.map((l) => ({ ...l })) : []
  certifications.value = r.certifications ? r.certifications.map((c) => ({ ...c })) : []
  interests.value = r.interests ? r.interests.map((i) => ({ ...i })) : []
  console.log('✏️ [Profilo’Z FormPanel] Formulaire prérempli depuis le store :', {
    fullName: personalForm.fullName,
    jobTitle: personalForm.jobTitle,
    experiencesCount: experiences.value.length,
    educationsCount: educations.value.length,
    skillsCount: skills.value.length,
  })
  nextTick(() => {
    isHydratingFromStore.value = false
  })
}

onMounted(() => {
  loadFromStore()
})

watch(
  () => [resumeStore.current?.id, resumeStore.current?.updatedAt],
  () => {
    if (!isHydratingFromStore.value) {
      loadFromStore()
    }
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
      <!-- Progression 1 ligne épurée avec badge A4 -->
      <div class="flex items-center justify-between gap-2">
        <span class="text-xs font-bold text-on-surface">
          Votre CV est complété à <span class="text-primary font-extrabold">{{ completionPercentage }}%</span>
        </span>

        <span
          v-if="isOverflowing"
          class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-700 border border-amber-500/30 animate-pulse shrink-0"
        >
          <UiPzIcon name="warning" class="text-xs text-amber-600" />
          <span>{{ pageCount }} pages A4</span>
        </span>
        <span
          v-else
          class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 shrink-0"
        >
          <UiPzIcon name="check_circle" class="text-xs text-emerald-600" />
          <span>1 page A4</span>
        </span>
      </div>

      <!-- Barre de progression -->
      <div class="w-full bg-surface-container-high h-2 rounded-full overflow-hidden p-0.5">
        <div
          class="bg-primary h-full transition-all duration-500 rounded-full"
          :style="{ width: `${completionPercentage}%` }"
        />
      </div>

      <!-- Avertissement de dépassement A4 -->
      <div
        v-if="isOverflowing"
        class="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-900 flex items-center justify-between gap-2 shadow-2xs"
      >
        <div class="flex items-center gap-2 min-w-0">
          <UiPzIcon name="warning" class="text-amber-600 text-base shrink-0" />
          <span class="truncate"><strong>Dépassement A4 :</strong> Votre CV comporte {{ pageCount }} pages.</span>
        </div>
      </div>

      <!-- BANNIÈRE HERO IA TOUT EN HAUT -->
      <div class="p-3.5 rounded-xl bg-gradient-to-r from-primary/15 via-secondary/15 to-primary/10 border border-primary/25 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div class="space-y-0.5">
          <h3 class="text-xs sm:text-sm font-extrabold text-on-surface flex items-center gap-1.5">
            <UiPzIcon name="auto_awesome" class="text-sm text-primary" />
            <span>Booster mon CV avec l'IA en 1 clic</span>
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
            <div id="tour-field-photo">
              <FeatureWizardPhotoUpload
                :model-value="personalForm.photoUrl"
                v-model:show-on-cv="showPhotoOnCv"
                @update:model-value="onPhotoUrlUpdate"
              />
            </div>
            <div class="grid grid-cols-1 gap-3">
              <UiFormField id="tour-field-fullname" label="Nom complet" required :error="fieldError('fullName')" tooltip="Saisissez votre prénom et nom tels qu'ils doivent apparaître dans l'en-tête de votre CV.">
                <input
                  v-model="personalForm.fullName"
                  type="text"
                  class="form-input w-full text-sm"
                  placeholder="Aminata Diallo"
                  @input="clearField('fullName')"
                >
              </UiFormField>

              <UiFormField id="tour-field-job" label="Poste visé" tooltip="Le titre exact du poste recherché (ex: Développeur Web, Responsable Commercial). C'est le titre principal de votre profil.">
                <input
                  v-model="personalForm.jobTitle"
                  type="text"
                  class="form-input w-full text-sm"
                  placeholder="Responsable marketing"
                />
              </UiFormField>

              <div id="tour-field-contact" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <UiFormField label="E-mail" required :error="fieldError('email')" tooltip="Utilisez une adresse e-mail professionnelle (ex: prenom.nom@domaine.com).">
                  <input
                    v-model="personalForm.email"
                    type="email"
                    class="form-input w-full text-sm"
                    placeholder="aminata@exemple.com"
                    @input="clearField('email')"
                  >
                </UiFormField>

                <UiFormField label="Téléphone" tooltip="Renseignez un numéro de téléphone valide. Si vous visez des postes à l'étranger, incluez l'indicatif pays (ex: +221 pour le Sénégal).">
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
                  <UiFormField label="Localisation / Ville" tooltip="La ville et le pays où vous résidez actuellement (ex: Dakar, Sénégal).">
                    <input
                      v-model="personalForm.location"
                      type="text"
                      class="form-input w-full text-sm"
                      placeholder="Dakar, Sénégal"
                    />
                  </UiFormField>

                  <UiFormField label="Lien LinkedIn" tooltip="Facultatif mais fortement recommandé. Permet aux recruteurs d'accéder directement à votre profil en ligne.">
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
            <UiFormField id="tour-field-summary" label="Résumé / Présentation" tooltip="Rédigez 2 ou 3 phrases percutantes pour résumer vos compétences, votre expérience et vos objectifs professionnels. C'est l'introduction de votre CV. Utilisez le bouton IA pour générer ou reformuler cette partie instantanément.">
              <div class="flex items-center justify-between gap-2 mb-2">
                <span class="text-xs text-on-surface-variant">Présentez brièvement vos points forts.</span>
                <button
                  type="button"
                  class="text-[11px] font-bold text-primary hover:text-primary-hover flex items-center gap-1 bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-lg transition-colors active:scale-95 shrink-0"
                  :disabled="aiLoading"
                  @click="handleEnhanceSummary"
                >
                  <UiPzIcon name="auto_awesome" class="text-xs" />
                  <span>{{ aiLoading ? 'Génération...' : (summary?.trim() ? 'Reformuler avec l’IA' : 'Générer mon profil IA') }}</span>
                </button>
              </div>
              <textarea
                v-model="summary"
                rows="4"
                class="form-input w-full text-sm resize-y leading-relaxed"
                placeholder="Ex : Professionnel passionné avec 5 ans d'expérience..."
              />
            </UiFormField>
          </template>

          <template v-else-if="section.id === 'parcours'">
            <div id="tour-field-experience" class="space-y-3">
              <div v-if="(resumeStore.current?.templateConfig as any)?.customOrder" class="flex justify-end">
                <button
                  type="button"
                  class="text-[11px] font-bold text-primary hover:text-primary-hover flex items-center gap-1 bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-lg transition-colors active:scale-95 shrink-0"
                  @click="resumeStore.setTemplateConfig({ customOrder: false })"
                >
                  <UiPzIcon name="sort" class="text-xs" />
                  <span>🔄 Réactiver le tri automatique par date</span>
                </button>
              </div>
              <FeatureWizardExperienceForm v-model="experiences" :field-errors="fieldErrors" />
            </div>
          </template>

          <template v-else-if="section.id === 'qualifications'">
            <div class="space-y-6">
              <div v-if="(resumeStore.current?.templateConfig as any)?.customOrder" class="flex justify-end mb-1">
                <button
                  type="button"
                  class="text-[11px] font-bold text-primary hover:text-primary-hover flex items-center gap-1 bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-lg transition-colors active:scale-95 shrink-0"
                  @click="resumeStore.setTemplateConfig({ customOrder: false })"
                >
                  <UiPzIcon name="sort" class="text-xs" />
                  <span>🔄 Réactiver le tri automatique par date</span>
                </button>
              </div>
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

              <!-- CHOIX DU MODÈLE DE CV EN GRILLE DE 2 SUR MOBILE AVEC RENDU A4 RÉEL -->
              <div class="space-y-2.5">
                <p class="text-xs font-bold text-on-surface">Modèles de CV disponibles (Rendu réel)</p>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <FeatureTemplatesPreviewCard
                    v-for="tpl in CV_TEMPLATES"
                    :key="tpl.slug"
                    :slug="tpl.slug"
                    :selected="currentTemplateSlug === tpl.slug"
                    :user-snapshot="resumeStore.current"
                    @select="selectTemplate(tpl.slug)"
                  >
                    <div>
                      <h4 class="font-bold text-xs text-on-surface">{{ tpl.name }}</h4>
                      <p class="text-[10px] text-on-surface-variant line-clamp-1 font-medium">{{ tpl.desc }}</p>
                    </div>
                  </FeatureTemplatesPreviewCard>
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
