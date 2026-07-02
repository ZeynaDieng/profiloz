<script setup lang="ts">
import type {
  Education,
  Experience,
  ExtractionConfidence,
  ExtractionMeta,
  Language,
  LanguageLevel,
  ResumeSnapshot,
} from '@profiloz/shared'
import {
  EXTRACTION_LOW_CONFIDENCE,
  MSG,
} from '@profiloz/shared'

type ImportData = Partial<ResumeSnapshot> & { _extraction?: ExtractionMeta }

const props = defineProps<{ data: ImportData }>()
const emit = defineEmits<{ confirm: [ImportData]; cancel: [] }>()

const LANGUAGE_LEVELS: Array<{ value: LanguageLevel; label: string }> = [
  { value: 'BASIC', label: 'Notions' },
  { value: 'CONVERSATIONAL', label: 'Intermédiaire' },
  { value: 'PROFESSIONAL', label: 'Courant' },
  { value: 'NATIVE', label: 'Bilingue / Maternelle' },
]

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value ?? null)) as T
}

// Copie de travail éditable (on ne mute jamais la prop d'origine).
const form = reactive({
  personalInfo: clone(props.data.personalInfo ?? {}),
  summary: props.data.summary ?? '',
  experiences: clone(props.data.experiences ?? []) as Experience[],
  educations: clone(props.data.educations ?? []) as Education[],
  skills: clone(props.data.skills ?? []),
  languages: clone(props.data.languages ?? []) as Language[],
  certifications: clone(props.data.certifications ?? []),
  interests: clone(props.data.interests ?? []),
})

const confidence = computed<ExtractionConfidence | undefined>(() => props.data._extraction?.confidence)

const overall = computed(() => Math.round((confidence.value?.overall ?? 0) * 100))
const ocrConfidence = computed(() => props.data._extraction?.ocrConfidence)
const ocrConfidencePct = computed(() =>
  typeof ocrConfidence.value === 'number' ? Math.round(ocrConfidence.value * 100) : null,
)
const lowOcrScan = computed(() => typeof ocrConfidence.value === 'number' && ocrConfidence.value < 0.5)

function pct(score?: number): number | null {
  return typeof score === 'number' ? Math.round(score * 100) : null
}
function isLow(score?: number): boolean {
  return typeof score === 'number' && score < EXTRACTION_LOW_CONFIDENCE
}
function sectionLow(scores?: number[]): boolean {
  return Array.isArray(scores) && scores.some((s) => isLow(s))
}

// --- Expériences ---
function addExperience() {
  form.experiences.push({ position: '', company: '' })
}
function removeExperience(index: number) {
  form.experiences.splice(index, 1)
}
function mergeWithNext(index: number) {
  const a = form.experiences[index]
  const b = form.experiences[index + 1]
  if (!a || !b) return
  a.position ||= b.position
  a.company ||= b.company
  a.location ||= b.location
  a.startDate ||= b.startDate
  a.endDate ||= b.endDate
  a.isCurrent ||= b.isCurrent
  a.description = [a.description, b.description].filter(Boolean).join('\n')
  form.experiences.splice(index + 1, 1)
}

// --- Formations ---
function addEducation() {
  form.educations.push({ degree: '', institution: '' })
}
function removeEducation(index: number) {
  form.educations.splice(index, 1)
}

// --- Compétences ---
const newSkill = ref('')
function addSkill(name?: string) {
  const value = (name ?? newSkill.value).trim()
  if (!value) return
  if (!form.skills.some((s) => s.name.toLowerCase() === value.toLowerCase())) {
    form.skills.push({ name: value })
  }
  if (!name) newSkill.value = ''
}
function removeSkill(index: number) {
  form.skills.splice(index, 1)
}

// --- Langues ---
function addLanguage() {
  form.languages.push({ name: '' })
}
function removeLanguage(index: number) {
  form.languages.splice(index, 1)
}

// --- Centres d'intérêt ---
const newInterest = ref('')
function addInterest(name?: string) {
  const value = (name ?? newInterest.value).trim()
  if (!value) return
  if (!form.interests.some((i) => i.name.toLowerCase() === value.toLowerCase())) {
    form.interests.push({ name: value })
  }
  if (!name) newInterest.value = ''
}
function removeInterest(index: number) {
  form.interests.splice(index, 1)
}

// --- Certifications ---
const newCertification = ref('')
function addCertification(name?: string) {
  const value = (name ?? newCertification.value).trim()
  if (!value) return
  if (!form.certifications.some((c) => c.name.toLowerCase() === value.toLowerCase())) {
    form.certifications.push({ name: value })
  }
  if (!name) newCertification.value = ''
}
function removeCertification(index: number) {
  form.certifications.splice(index, 1)
}

function buildResult(): ImportData {
  return {
    personalInfo: form.personalInfo,
    summary: form.summary.trim() || undefined,
    experiences: form.experiences.filter((e) => e.position?.trim() || e.company?.trim()),
    educations: form.educations.filter((e) => e.degree?.trim() || e.institution?.trim()),
    skills: form.skills.filter((s) => s.name.trim()),
    languages: form.languages.filter((l) => l.name.trim()),
    certifications: form.certifications.filter((c) => c.name.trim()),
    interests: form.interests.filter((i) => i.name.trim()),
  }
}

const inputClass =
  'w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant text-sm text-on-surface focus:outline-none focus:border-secondary'

function fieldClass(score?: number): string {
  return isLow(score)
    ? `${inputClass} border-amber-500/70 bg-amber-500/5 ring-1 ring-amber-500/20`
    : inputClass
}

const extractionMeta = computed(() => props.data._extraction)
const partialImport = computed(() => extractionMeta.value?.partialImport === true)
const extractionWarnings = computed(() => extractionMeta.value?.warnings ?? [])
const extractionErrors = computed(() => extractionMeta.value?.errors ?? [])
const partialImportMessage = computed(() => {
  const parts = ['Import partiel — vérifiez attentivement chaque section avant de continuer.']
  for (const w of extractionWarnings.value) parts.push(w)
  for (const e of extractionErrors.value) parts.push(e)
  return parts.join(' ')
})
</script>

<template>
  <div class="space-y-stack-md">
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <div>
        <h3 class="text-xl font-bold text-on-surface">Vérifiez les informations extraites</h3>
        <p class="text-sm text-on-surface-variant">
          Corrigez ou complétez les champs ci-dessous avant de générer votre dossier.
        </p>
      </div>
      <span
        class="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold"
        :class="overall >= 75 ? 'text-[#14B8A6] bg-[#14B8A6]/10' : 'text-amber-600 bg-amber-500/10'"
      >
        <UiPzIcon name="verified" class="text-[16px]" />
        Confiance globale {{ overall }}%
      </span>
    </div>

    <UiMessageBanner
      v-if="lowOcrScan"
      variant="warning"
      :message="`Qualité de scan faible (${ocrConfidencePct} %). Le préremplissage automatique est limité — vérifiez chaque section ou importez un PDF texte / DOCX pour un meilleur résultat.`"
      class="rounded-xl"
    />

    <UiMessageBanner
      v-if="partialImport || extractionWarnings.length || extractionErrors.length"
      variant="warning"
      :message="partialImportMessage"
      class="rounded-xl"
    />

    <div class="glass-card p-stack-md rounded-xl space-y-3">
      <span class="text-xs text-outline uppercase tracking-wider">Informations personnelles</span>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label class="space-y-1">
          <span class="text-xs text-on-surface-variant flex items-center gap-2">
            Nom complet
            <em v-if="isLow(confidence?.personalInfo?.fullName)" class="not-italic text-[10px] text-amber-600 font-bold">à confirmer</em>
          </span>
          <input v-model="form.personalInfo.fullName" :class="fieldClass(confidence?.personalInfo?.fullName)" placeholder="Prénom Nom" />
        </label>
        <label class="space-y-1">
          <span class="text-xs text-on-surface-variant flex items-center gap-2">
            Poste / Titre
            <em v-if="isLow(confidence?.personalInfo?.jobTitle)" class="not-italic text-[10px] text-amber-600 font-bold">à confirmer</em>
          </span>
          <input v-model="form.personalInfo.jobTitle" :class="fieldClass(confidence?.personalInfo?.jobTitle)" placeholder="Ex. Développeur" />
        </label>
        <label class="space-y-1">
          <span class="text-xs text-on-surface-variant flex items-center gap-2">
            Email
            <em v-if="isLow(confidence?.personalInfo?.email)" class="not-italic text-[10px] text-amber-600 font-bold">à confirmer</em>
          </span>
          <input v-model="form.personalInfo.email" :class="fieldClass(confidence?.personalInfo?.email)" placeholder="email@exemple.com" />
        </label>
        <label class="space-y-1">
          <span class="text-xs text-on-surface-variant flex items-center gap-2">
            Téléphone
            <em v-if="isLow(confidence?.personalInfo?.phone)" class="not-italic text-[10px] text-amber-600 font-bold">à confirmer</em>
          </span>
          <input v-model="form.personalInfo.phone" :class="fieldClass(confidence?.personalInfo?.phone)" placeholder="+221 ..." />
        </label>
        <label class="space-y-1">
          <span class="text-xs text-on-surface-variant flex items-center gap-2">
            Ville / Localisation
            <em v-if="isLow(confidence?.personalInfo?.location)" class="not-italic text-[10px] text-amber-600 font-bold">à confirmer</em>
          </span>
          <input v-model="form.personalInfo.location" :class="fieldClass(confidence?.personalInfo?.location)" placeholder="Ville, Pays" />
        </label>
        <label class="space-y-1">
          <span class="text-xs text-on-surface-variant flex items-center gap-2">
            LinkedIn
            <em v-if="isLow(confidence?.personalInfo?.linkedinUrl)" class="not-italic text-[10px] text-amber-600 font-bold">à confirmer</em>
          </span>
          <input v-model="form.personalInfo.linkedinUrl" :class="fieldClass(confidence?.personalInfo?.linkedinUrl)" placeholder="linkedin.com/in/..." />
        </label>
        <label class="space-y-1 md:col-span-2">
          <span class="text-xs text-on-surface-variant flex items-center gap-2">
            Site / Portfolio
            <em v-if="isLow(confidence?.personalInfo?.websiteUrl)" class="not-italic text-[10px] text-amber-600 font-bold">à confirmer</em>
          </span>
          <input v-model="form.personalInfo.websiteUrl" :class="fieldClass(confidence?.personalInfo?.websiteUrl)" placeholder="https://..." />
        </label>
      </div>
    </div>

    <div class="glass-card p-stack-md rounded-xl space-y-2">
      <span class="text-xs text-outline uppercase tracking-wider flex items-center gap-2">
        Profil
        <em v-if="isLow(confidence?.summary)" class="not-italic text-[10px] text-amber-600 font-bold normal-case">à confirmer</em>
      </span>
      <textarea v-model="form.summary" rows="3" :class="fieldClass(confidence?.summary)" placeholder="Quelques lignes de présentation…" />
    </div>

    <div class="glass-card p-stack-md rounded-xl space-y-3">
      <div class="flex items-center justify-between">
        <span class="text-xs text-outline uppercase tracking-wider">Expériences ({{ form.experiences.length }})</span>
        <button type="button" class="text-xs font-bold text-secondary flex items-center gap-1" @click="addExperience">
          <UiPzIcon name="add" class="text-[14px]" /> Ajouter
        </button>
      </div>
      <div
        v-for="(exp, i) in form.experiences"
        :key="i"
        class="border rounded-lg p-3 space-y-2 relative"
        :class="isLow(confidence?.experiences?.[i]) ? 'border-amber-500/50 bg-amber-500/5' : 'border-outline-variant'"
      >
        <div class="flex items-center justify-between gap-2">
          <span
            v-if="pct(confidence?.experiences?.[i]) !== null"
            class="text-[10px] font-bold px-2 py-0.5 rounded-full"
            :class="isLow(confidence?.experiences?.[i]) ? 'bg-amber-500/10 text-amber-600' : 'bg-[#14B8A6]/10 text-[#14B8A6]'"
          >
            {{ pct(confidence?.experiences?.[i]) }}%
          </span>
          <div class="flex gap-2 ml-auto">
            <button
              v-if="i < form.experiences.length - 1"
              type="button"
              class="text-xs text-on-surface-variant hover:text-secondary flex items-center gap-1"
              @click="mergeWithNext(i)"
            >
              <UiPzIcon name="merge" class="text-[14px]" /> Fusionner ↓
            </button>
            <button type="button" class="text-xs text-error hover:underline" @click="removeExperience(i)">
              Supprimer
            </button>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input v-model="exp.position" :class="inputClass" placeholder="Poste" />
          <input v-model="exp.company" :class="inputClass" placeholder="Entreprise" />
          <input v-model="exp.location" :class="inputClass" placeholder="Ville" />
          <input v-model="exp.country" :class="inputClass" placeholder="Pays" />
          <div class="flex gap-2 md:col-span-2">
            <input v-model="exp.startDate" :class="inputClass" placeholder="Début" />
            <input v-model="exp.endDate" :class="inputClass" placeholder="Fin" />
          </div>
        </div>
        <textarea v-model="exp.description" rows="2" :class="inputClass" placeholder="Description / missions" />
      </div>
      <p v-if="!form.experiences.length" class="text-sm text-on-surface-variant">{{ MSG.empty.noExperience }}</p>
    </div>

    <div class="glass-card p-stack-md rounded-xl space-y-3">
      <div class="flex items-center justify-between">
        <span class="text-xs text-outline uppercase tracking-wider">Formations ({{ form.educations.length }})</span>
        <button type="button" class="text-xs font-bold text-secondary flex items-center gap-1" @click="addEducation">
          <UiPzIcon name="add" class="text-[14px]" /> Ajouter
        </button>
      </div>
      <div
        v-for="(edu, i) in form.educations"
        :key="i"
        class="border rounded-lg p-3 space-y-2"
        :class="isLow(confidence?.educations?.[i]) ? 'border-amber-500/50 bg-amber-500/5' : 'border-outline-variant'"
      >
        <div class="flex items-center justify-between">
          <span
            v-if="pct(confidence?.educations?.[i]) !== null"
            class="text-[10px] font-bold px-2 py-0.5 rounded-full"
            :class="isLow(confidence?.educations?.[i]) ? 'bg-amber-500/10 text-amber-600' : 'bg-[#14B8A6]/10 text-[#14B8A6]'"
          >
            {{ pct(confidence?.educations?.[i]) }}%
          </span>
          <button type="button" class="text-xs text-error hover:underline ml-auto" @click="removeEducation(i)">
            Supprimer
          </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input v-model="edu.degree" :class="inputClass" placeholder="Diplôme" />
          <input v-model="edu.institution" :class="inputClass" placeholder="Établissement" />
          <input v-model="edu.field" :class="inputClass" placeholder="Domaine" />
          <input v-model="edu.location" :class="inputClass" placeholder="Ville" />
          <div class="flex gap-2 md:col-span-2">
            <input v-model="edu.startDate" :class="inputClass" placeholder="Début" />
            <input v-model="edu.endDate" :class="inputClass" placeholder="Fin" />
          </div>
        </div>
      </div>
      <p v-if="!form.educations.length" class="text-sm text-on-surface-variant">{{ MSG.empty.noEducation }}</p>
    </div>

    <div
      class="glass-card p-stack-md rounded-xl space-y-3"
      :class="sectionLow(confidence?.skills) ? 'ring-1 ring-amber-500/30' : ''"
    >
      <span class="text-xs text-outline uppercase tracking-wider flex items-center gap-2">
        Compétences ({{ form.skills.length }})
        <em v-if="sectionLow(confidence?.skills)" class="not-italic text-[10px] text-amber-600 font-bold normal-case">à confirmer</em>
      </span>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="(skill, i) in form.skills"
          :key="i"
          class="text-xs bg-surface-container-high px-2 py-1 rounded-md text-on-surface-variant flex items-center gap-1"
        >
          {{ skill.name }}
          <button type="button" class="text-error" @click="removeSkill(i)"><UiPzIcon name="close" class="text-[12px]" /></button>
        </span>
      </div>
      <div class="flex gap-2">
        <input
          v-model="newSkill"
          :class="inputClass"
          placeholder="Ajouter une compétence"
          @keydown.enter.prevent="addSkill()"
        />
        <button type="button" class="px-3 py-2 bg-secondary text-white rounded-lg text-sm font-bold" @click="addSkill()">
          Ajouter
        </button>
      </div>
    </div>

    <div
      class="glass-card p-stack-md rounded-xl space-y-3"
      :class="sectionLow(confidence?.languages) ? 'ring-1 ring-amber-500/30' : ''"
    >
      <div class="flex items-center justify-between">
        <span class="text-xs text-outline uppercase tracking-wider flex items-center gap-2">
          Langues ({{ form.languages.length }})
          <em v-if="sectionLow(confidence?.languages)" class="not-italic text-[10px] text-amber-600 font-bold normal-case">à confirmer</em>
        </span>
        <button type="button" class="text-xs font-bold text-secondary flex items-center gap-1" @click="addLanguage">
          <UiPzIcon name="add" class="text-[14px]" /> Ajouter
        </button>
      </div>
      <div v-for="(lang, i) in form.languages" :key="i" class="flex gap-2 items-center">
        <input v-model="lang.name" :class="inputClass" placeholder="Langue" />
        <select v-model="lang.level" class="px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant text-sm">
          <option :value="undefined">Niveau</option>
          <option v-for="lvl in LANGUAGE_LEVELS" :key="lvl.value" :value="lvl.value">{{ lvl.label }}</option>
        </select>
        <button type="button" class="text-xs text-error hover:underline" @click="removeLanguage(i)">Suppr.</button>
      </div>
      <p v-if="!form.languages.length" class="text-sm text-on-surface-variant">{{ MSG.empty.noLanguage }}</p>
    </div>

    <div class="glass-card p-stack-md rounded-xl space-y-3">
      <span class="text-xs text-outline uppercase tracking-wider">Certifications ({{ form.certifications.length }})</span>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="(cert, i) in form.certifications"
          :key="i"
          class="text-xs bg-surface-container-high px-2 py-1 rounded-md text-on-surface-variant flex items-center gap-1"
        >
          {{ cert.name }}
          <button type="button" class="text-error" @click="removeCertification(i)"><UiPzIcon name="close" class="text-[12px]" /></button>
        </span>
      </div>
      <div class="flex gap-2">
        <input
          v-model="newCertification"
          :class="inputClass"
          placeholder="Ajouter une certification"
          @keydown.enter.prevent="addCertification()"
        />
        <button type="button" class="px-3 py-2 bg-secondary text-white rounded-lg text-sm font-bold" @click="addCertification()">
          Ajouter
        </button>
      </div>
    </div>

    <div class="glass-card p-stack-md rounded-xl space-y-3">
      <span class="text-xs text-outline uppercase tracking-wider">Centres d'intérêt ({{ form.interests.length }})</span>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="(interest, i) in form.interests"
          :key="i"
          class="text-xs bg-surface-container-high px-2 py-1 rounded-md text-on-surface-variant flex items-center gap-1"
        >
          {{ interest.name }}
          <button type="button" class="text-error" @click="removeInterest(i)"><UiPzIcon name="close" class="text-[12px]" /></button>
        </span>
      </div>
      <div class="flex gap-2">
        <input
          v-model="newInterest"
          :class="inputClass"
          placeholder="Ajouter un centre d'intérêt"
          @keydown.enter.prevent="addInterest()"
        />
        <button type="button" class="px-3 py-2 bg-secondary text-white rounded-lg text-sm font-bold" @click="addInterest()">
          Ajouter
        </button>
      </div>
    </div>

    <div class="flex flex-col sm:flex-row sm:justify-end gap-3 border-t border-outline-variant pt-stack-md sticky bottom-0 bg-background/95 backdrop-blur-sm pb-[max(1rem,env(safe-area-inset-bottom))] -mx-margin-mobile px-margin-mobile md:static md:bg-transparent md:backdrop-blur-none md:pb-0 md:mx-0 md:px-0">
      <UiButton variant="ghost" block class="sm:w-auto" @click="emit('cancel')">
        Annuler
      </UiButton>
      <UiButton variant="secondary" block class="sm:w-auto" @click="emit('confirm', buildResult())">
        {{ MSG.buttons.continue }}
      </UiButton>
    </div>
  </div>
</template>
