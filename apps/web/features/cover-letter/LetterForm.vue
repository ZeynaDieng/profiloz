<script setup lang="ts">
import type { CoverLetterTemplateSlug } from '~/types/cover-letter'
import { DEFAULT_CLOSING_TEXT } from '~/types/cover-letter'
import { COVER_LETTER_TEMPLATE_REGISTRY } from '~/features/cover-letter-templates/registry'
import { useAi } from '~/composables/useAi'

const templateId = defineModel<CoverLetterTemplateSlug>('templateId', { required: true })
const senderName = defineModel<string>('senderName', { default: '' })
const senderEmail = defineModel<string>('senderEmail', { default: '' })
const senderPhone = defineModel<string>('senderPhone', { default: '' })
const senderLocation = defineModel<string>('senderLocation', { default: '' })
const companyName = defineModel<string>('companyName', { default: '' })
const companyAddress = defineModel<string>('companyAddress', { default: '' })
const position = defineModel<string>('position', { default: '' })
const recruiterName = defineModel<string>('recruiterName', { default: '' })
const content = defineModel<string>('content', { default: '' })
const closingText = defineModel<string>('closingText', { default: DEFAULT_CLOSING_TEXT })

defineProps<{
  showTemplatePicker?: boolean
  fieldErrors?: Record<string, string>
}>()

const { enhanceText, generateLetter, loading: aiLoading } = useAi()
const resumeStore = useResumeStore()

const aiModalOpen = ref(false)
const jobOfferInput = ref('')
const targetCompanyInput = ref('')
const targetPositionInput = ref('')

function fieldError(fieldErrors: Record<string, string> | undefined, key: string) {
  return fieldErrors?.[key] ?? ''
}

async function handleEnhanceContent() {
  if (!content.value?.trim()) return
  const result = await enhanceText(content.value, position.value ? `Poste : ${position.value}` : undefined)
  if (result) {
    content.value = result
  }
}

async function handleGenerateFromJobOffer() {
  if (!jobOfferInput.value?.trim()) return

  const r = resumeStore.current
  const candidateInfo = r
    ? `Poste : ${r.personalInfo?.jobTitle || ''}\nSummary : ${r.summary || ''}\nExpériences : ${r.experiences.map((e) => `${e.position} chez ${e.company}: ${e.description}`).join(' ; ')}`
    : undefined

  const result = await generateLetter({
    jobOfferText: jobOfferInput.value,
    targetCompany: targetCompanyInput.value || companyName.value,
    targetPosition: targetPositionInput.value || position.value,
    candidateInfo,
  })

  if (result) {
    content.value = result.content
    if (targetCompanyInput.value) companyName.value = targetCompanyInput.value
    if (targetPositionInput.value) position.value = targetPositionInput.value
    aiModalOpen.value = false
    jobOfferInput.value = ''
    targetCompanyInput.value = ''
    targetPositionInput.value = ''
  }
}
</script>

<template>
  <div class="space-y-stack-md">
    <section v-if="showTemplatePicker !== false" class="space-y-3">
      <h2 class="text-sm font-bold text-on-surface">Modèle</h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <button
          v-for="tpl in COVER_LETTER_TEMPLATE_REGISTRY"
          :key="tpl.slug"
          type="button"
          class="rounded-xl border p-3 text-left transition-all"
          :class="
            templateId === tpl.slug
              ? 'border-secondary bg-secondary/5 ring-2 ring-secondary/20'
              : 'border-outline-variant hover:border-secondary/50'
          "
          @click="templateId = tpl.slug"
        >
          <p class="font-bold text-sm text-on-surface">{{ tpl.name }}</p>
          <p class="text-[11px] text-on-surface-variant mt-1 line-clamp-2">{{ tpl.description }}</p>
        </button>
      </div>
    </section>

    <!-- Bannière Assistant IA Générateur de Lettre sur-mesure -->
    <div class="p-4 rounded-xl bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/5 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div>
        <div class="flex items-center gap-1.5 font-bold text-sm text-primary">
          <UiPzIcon name="auto_awesome" class="text-base" />
          <span>Générateur de Lettre sur-mesure IA</span>
        </div>
        <p class="text-xs text-on-surface-variant mt-0.5">
          Collez le texte d'une offre d'emploi et l'IA rédige une lettre personnalisée pour ce poste.
        </p>
      </div>
      <button
        type="button"
        class="shrink-0 px-3 py-1.5 rounded-lg bg-primary text-on-primary font-bold text-xs hover:bg-primary-hover transition-colors flex items-center gap-1.5 shadow-sm"
        @click="aiModalOpen = true"
      >
        <UiPzIcon name="auto_awesome" class="text-sm" />
        <span>Rédiger avec l'IA</span>
      </button>
    </div>

    <section class="space-y-stack-sm">
      <h2 class="text-sm font-bold text-on-surface">Expéditeur</h2>
      <UiFormField label="Nom complet" required :error="fieldError(fieldErrors, 'senderName')">
        <input v-model="senderName" type="text" class="form-input form-input--white w-full" placeholder="Aminata Diallo" />
      </UiFormField>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-stack-sm">
        <UiFormField label="E-mail" :error="fieldError(fieldErrors, 'senderEmail')">
          <input
            v-model="senderEmail"
            type="email"
            class="form-input form-input--white w-full"
            placeholder="aminata@exemple.com"
          />
        </UiFormField>
        <UiFormField label="Téléphone">
          <input
            v-model="senderPhone"
            type="text"
            class="form-input form-input--white w-full"
            placeholder="+221 77 000 00 00"
          />
        </UiFormField>
      </div>
      <UiFormField label="Ville / Adresse">
        <input v-model="senderLocation" type="text" class="form-input form-input--white w-full" placeholder="Dakar, Sénégal" />
      </UiFormField>
    </section>

    <section class="space-y-stack-sm">
      <h2 class="text-sm font-bold text-on-surface">Destinataire</h2>
      <UiFormField label="Entreprise" required :error="fieldError(fieldErrors, 'companyName')">
        <input v-model="companyName" type="text" class="form-input form-input--white w-full" placeholder="Wave Mobile Money" />
      </UiFormField>
      <UiFormField label="Adresse entreprise (optionnel)">
        <textarea
          v-model="companyAddress"
          rows="2"
          class="form-input form-input--white w-full resize-y"
          placeholder="Immeuble SDMO, Plateau, Dakar"
        />
      </UiFormField>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-stack-sm">
        <UiFormField label="Poste visé" required :error="fieldError(fieldErrors, 'position')">
          <input
            v-model="position"
            type="text"
            class="form-input form-input--white w-full"
            placeholder="Responsable marketing digital"
          />
        </UiFormField>
        <UiFormField label="Nom du recruteur (optionnel)">
          <input
            v-model="recruiterName"
            type="text"
            class="form-input form-input--white w-full"
            placeholder="Mme Ndiaye"
          />
        </UiFormField>
      </div>
    </section>

    <section class="space-y-stack-sm">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-bold text-on-surface">Contenu</h2>
        <button
          v-if="content?.trim()"
          type="button"
          class="text-[11px] font-semibold text-primary hover:text-primary-hover flex items-center gap-1 bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-lg transition-colors"
          :disabled="aiLoading"
          @click="handleEnhanceContent"
        >
          <UiPzIcon name="auto_awesome" class="text-[13px]" />
          <span>{{ aiLoading ? 'Reformulation...' : '✨ Reformuler la lettre avec l’IA' }}</span>
        </button>
      </div>
      <UiFormField label="Corps de la lettre" required :error="fieldError(fieldErrors, 'content')">
        <textarea
          v-model="content"
          rows="10"
          class="form-input form-input--white w-full resize-y"
          placeholder="Rédigez votre lettre de motivation ou générez-la avec l'IA d'après une offre..."
        />
      </UiFormField>
      <UiFormField label="Formule de politesse">
        <textarea v-model="closingText" rows="2" class="form-input form-input--white w-full resize-y" />
      </UiFormField>
    </section>

    <!-- Modal Générateur de Lettre IA -->
    <div
      v-if="aiModalOpen"
      class="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div class="bg-surface rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-outline-variant space-y-4">
        <div class="flex items-center justify-between border-b border-outline-variant/30 pb-3">
          <div class="flex items-center gap-2 font-bold text-on-surface">
            <UiPzIcon name="auto_awesome" class="text-primary" />
            <span>Générer une lettre sur-mesure</span>
          </div>
          <button type="button" class="text-on-surface-variant hover:text-on-surface" @click="aiModalOpen = false">
            <UiPzIcon name="close" />
          </button>
        </div>

        <div class="space-y-3">
          <UiFormField label="Texte de l'offre d'emploi" required>
            <textarea
              v-model="jobOfferInput"
              rows="5"
              class="form-input w-full resize-none text-sm"
              placeholder="Collez ici l'annonce de recrutement (missions demandées, profil recherché)..."
            />
          </UiFormField>

          <div class="grid grid-cols-2 gap-3">
            <UiFormField label="Entreprise (optionnel)">
              <input
                v-model="targetCompanyInput"
                type="text"
                class="form-input w-full text-sm"
                placeholder="Ex: Wave, Orange"
              />
            </UiFormField>
            <UiFormField label="Poste (optionnel)">
              <input
                v-model="targetPositionInput"
                type="text"
                class="form-input w-full text-sm"
                placeholder="Ex: Commercial B2B"
              />
            </UiFormField>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button
            type="button"
            class="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container"
            @click="aiModalOpen = false"
          >
            Annuler
          </button>
          <button
            type="button"
            class="px-4 py-2 rounded-xl text-sm font-bold bg-primary text-on-primary hover:bg-primary-hover flex items-center gap-2 disabled:opacity-50"
            :disabled="aiLoading || !jobOfferInput.trim()"
            @click="handleGenerateFromJobOffer"
          >
            <UiPzIcon name="auto_awesome" />
            <span>{{ aiLoading ? 'Génération en cours...' : 'Rédiger la lettre' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
