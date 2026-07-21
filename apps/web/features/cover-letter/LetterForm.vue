<script setup lang="ts">
import type { CoverLetterTemplateSlug } from '~/types/cover-letter'
import { DEFAULT_CLOSING_TEXT } from '~/types/cover-letter'
import { COVER_LETTER_TEMPLATE_REGISTRY } from '~/features/cover-letter-templates/registry'
import { useAi } from '~/composables/useAi'

const templateId = defineModel<CoverLetterTemplateSlug>('templateId', { required: true })
const accentColor = defineModel<string>('accentColor', { default: '#0051d5' })
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

const props = defineProps<{
  accentColors?: string[]
  showTemplatePicker?: boolean
  fieldErrors?: Record<string, string>
}>()

const { enhanceText, generateLetter, loading: aiLoading } = useAi()
const resumeStore = useResumeStore()

const aiModalOpen = ref(false)
const jobOfferInput = ref('')
const targetCompanyInput = ref('')
const targetPositionInput = ref('')
const showAllColors = ref(false)

// Section ouverte par défaut : Contenu & IA
const openSection = ref<string>('content')

// Ouverture avec défilement automatique vers la section ouverte pour ne plus avoir à glisser !
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

// 6 Couleurs principales présélectionnées (Design Épuré)
const primaryPalette = ['#0051d5', '#1e293b', '#10b981', '#8b5cf6', '#f97316', '#ef4444']

const displayedColors = computed(() => {
  if (!props.accentColors || props.accentColors.length === 0) return primaryPalette
  if (showAllColors.value) return props.accentColors
  return primaryPalette
})

// Calcul dynamique du taux de complétion
const completionScore = computed(() => {
  let score = 0
  if (senderName.value?.trim()) score += 25
  if (companyName.value?.trim()) score += 25
  if (position.value?.trim()) score += 25
  if (content.value?.trim()) score += 25
  return score
})

function fieldError(fieldErrors: Record<string, string> | undefined, key: string) {
  return fieldErrors?.[key] ?? ''
}

async function handleEnhanceContent() {
  const textToEnhance = content.value?.trim()
    ? content.value
    : "Madame, Monsieur,\n\nPar la présente, je vous adresse ma candidature pour le poste. Fort de mes expériences passées, je souhaite apporter mes compétences et mon dynamisme à votre équipe."
  const result = await enhanceText(textToEnhance, position.value ? `Poste : ${position.value}` : undefined)
  if (result) {
    content.value = result
    openSection.value = 'content'
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
    openSection.value = 'content'
  }
}
</script>

<template>
  <div class="space-y-4 pb-12">
    <!-- 🚀 BANNIÈRE HERO IA (ÉPURÉE & CLAIRE SANS SURCHARGE DE TEXTE) -->
    <div class="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-primary/15 via-secondary/15 to-primary/10 border border-primary/25 shadow-xs">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
        <div class="space-y-1">
          <h3 class="text-sm sm:text-base font-extrabold text-on-surface">
            Générer ma lettre avec l'IA en 1 clic
          </h3>
          <p class="text-xs text-on-surface-variant leading-relaxed">
            Collez une offre d'emploi ou votre poste et l'IA rédige une lettre sur-mesure en 5 secondes.
          </p>
        </div>
        <button
          type="button"
          class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs sm:text-sm hover:bg-primary-hover shadow-md transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95"
          @click="aiModalOpen = true"
        >
          <UiPzIcon name="auto_awesome" class="text-base" />
          <span>✨ Rédiger ma lettre avec l'IA</span>
        </button>
      </div>
    </div>

    <!-- 📊 BARRE DE PROGRESSION ÉPURÉE (1 SEULE LIGNE LISIBLE) -->
    <div class="p-3.5 rounded-2xl bg-surface-container/40 border border-outline-variant/40 shadow-2xs space-y-2">
      <div class="flex items-center justify-between gap-3">
        <span class="text-xs font-bold text-on-surface">
          Votre lettre est complétée à <span class="text-primary font-extrabold">{{ completionScore }}%</span>
        </span>
        <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full" :class="completionScore >= 100 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-primary/10 text-primary'">
          {{ completionScore >= 100 ? 'Prête' : `${completionScore}%` }}
        </span>
      </div>
      <div class="w-full h-2 bg-outline-variant/20 rounded-full overflow-hidden p-0.5">
        <div
          class="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          :style="{ width: `${completionScore}%` }"
        />
      </div>
    </div>

    <!-- ACCORDÉON 1 (OUVERT PAR DÉFAUT) : 📝 Contenu de la Lettre & IA -->
    <div class="rounded-2xl border border-outline-variant/40 overflow-hidden bg-surface-container-lowest transition-all shadow-2xs hover:border-outline-variant/70">
      <button
        type="button"
        class="w-full px-4 py-3.5 flex items-center justify-between text-left bg-surface-container/30 hover:bg-surface-container/60 transition-colors"
        @click="toggleSection('content', $event)"
      >
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
            <UiPzIcon name="description" class="text-base" />
          </div>
          <div>
            <h3 class="font-bold text-sm text-on-surface">1. Contenu de la Lettre & IA</h3>
            <p class="text-[11px] text-on-surface-variant line-clamp-1 font-medium">
              {{ content ? 'Lettre rédigée' : 'Rédigez vous-même ou générez avec l’IA' }}
            </p>
          </div>
        </div>
        <UiPzIcon
          name="expand_more"
          class="text-on-surface-variant transition-transform duration-200"
          :class="openSection === 'content' && 'rotate-180'"
        />
      </button>

      <div v-show="openSection === 'content'" class="p-4 sm:p-5 space-y-4 border-t border-outline-variant/30">
        <UiFormField label="Corps de la lettre" required :error="fieldError(fieldErrors, 'content')">
          <div class="space-y-2">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs text-on-surface-variant font-medium">Texte principal de la lettre</span>
              <button
                type="button"
                class="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-xl transition-all active:scale-95 shrink-0"
                :disabled="aiLoading"
                @click="handleEnhanceContent"
              >
                <UiPzIcon name="auto_awesome" class="text-sm" />
                <span>{{ aiLoading ? 'Génération IA...' : '✨ Reformuler avec l’IA' }}</span>
              </button>
            </div>
            <textarea
              v-model="content"
              rows="9"
              class="form-input form-input--white w-full resize-y text-sm leading-relaxed"
              placeholder="Rédigez votre lettre ou cliquez sur le bouton « ✨ Reformuler avec l’IA » ci-dessus..."
            />
          </div>
        </UiFormField>

        <UiFormField label="Formule de politesse de fin">
          <textarea
            v-model="closingText"
            rows="2"
            class="form-input form-input--white w-full resize-y text-sm"
          />
        </UiFormField>
      </div>
    </div>

    <!-- ACCORDÉON 2 : 👤 Vos Coordonnées (Expéditeur) -->
    <div class="rounded-2xl border border-outline-variant/40 overflow-hidden bg-surface-container-lowest transition-all shadow-2xs hover:border-outline-variant/70">
      <button
        type="button"
        class="w-full px-4 py-3.5 flex items-center justify-between text-left bg-surface-container/30 hover:bg-surface-container/60 transition-colors"
        @click="toggleSection('sender', $event)"
      >
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-bold text-sm shrink-0">
            <UiPzIcon name="person" class="text-base" />
          </div>
          <div>
            <h3 class="font-bold text-sm text-on-surface">2. Vos Coordonnées (Expéditeur)</h3>
            <p class="text-[11px] text-on-surface-variant line-clamp-1 font-medium">
              {{ senderName ? `${senderName} · ${senderLocation || 'Lieu non renseigné'}` : 'Pré-rempli automatiquement depuis votre CV' }}
            </p>
          </div>
        </div>
        <UiPzIcon
          name="expand_more"
          class="text-on-surface-variant transition-transform duration-200"
          :class="openSection === 'sender' && 'rotate-180'"
        />
      </button>

      <div v-show="openSection === 'sender'" class="p-4 sm:p-5 space-y-3 border-t border-outline-variant/30">
        <UiFormField label="Nom complet" required :error="fieldError(fieldErrors, 'senderName')">
          <input
            v-model="senderName"
            type="text"
            class="form-input form-input--white w-full"
            placeholder="Ex: Aminata Diallo"
          />
        </UiFormField>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
        <UiFormField label="Ville / Pays">
          <input
            v-model="senderLocation"
            type="text"
            class="form-input form-input--white w-full"
            placeholder="Dakar, Sénégal"
          />
        </UiFormField>
      </div>
    </div>

    <!-- ACCORDÉON 3 : 🏢 L'Entreprise & Poste Visé -->
    <div class="rounded-2xl border border-outline-variant/40 overflow-hidden bg-surface-container-lowest transition-all shadow-2xs hover:border-outline-variant/70">
      <button
        type="button"
        class="w-full px-4 py-3.5 flex items-center justify-between text-left bg-surface-container/30 hover:bg-surface-container/60 transition-colors"
        @click="toggleSection('recipient', $event)"
      >
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center font-bold text-sm shrink-0">
            <UiPzIcon name="business" class="text-base" />
          </div>
          <div>
            <h3 class="font-bold text-sm text-on-surface">3. L'Entreprise & Poste Visé</h3>
            <p class="text-[11px] text-on-surface-variant line-clamp-1 font-medium">
              {{ position ? `${position} ${companyName ? `chez ${companyName}` : ''}` : 'Poste recherché, Nom entreprise' }}
            </p>
          </div>
        </div>
        <UiPzIcon
          name="expand_more"
          class="text-on-surface-variant transition-transform duration-200"
          :class="openSection === 'recipient' && 'rotate-180'"
        />
      </button>

      <div v-show="openSection === 'recipient'" class="p-4 sm:p-5 space-y-3 border-t border-outline-variant/30">
        <UiFormField label="Poste visé" required :error="fieldError(fieldErrors, 'position')">
          <input
            v-model="position"
            type="text"
            class="form-input form-input--white w-full"
            placeholder="Ex: Responsable Marketing Digital"
          />
        </UiFormField>
        <UiFormField label="Entreprise visée" required :error="fieldError(fieldErrors, 'companyName')">
          <input
            v-model="companyName"
            type="text"
            class="form-input form-input--white w-full"
            placeholder="Ex: Wave Mobile Money, Orange, Sonatel..."
          />
        </UiFormField>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <UiFormField label="Nom du recruteur (optionnel)">
            <input
              v-model="recruiterName"
              type="text"
              class="form-input form-input--white w-full"
              placeholder="Ex: Mme Ndiaye, Responsable RH"
            />
          </UiFormField>
          <UiFormField label="Adresse entreprise (optionnel)">
            <input
              v-model="companyAddress"
              type="text"
              class="form-input form-input--white w-full"
              placeholder="Ex: Plateau, Dakar"
            />
          </UiFormField>
        </div>
      </div>
    </div>

    <!-- ACCORDÉON 4 : 🎨 Modèle & Couleurs (Design avec vraies miniatures du modèle) -->
    <div class="rounded-2xl border border-outline-variant/40 overflow-hidden bg-surface-container-lowest transition-all shadow-2xs hover:border-outline-variant/70 mb-8">
      <button
        type="button"
        class="w-full px-4 py-3.5 flex items-center justify-between text-left bg-surface-container/30 hover:bg-surface-container/60 transition-colors"
        @click="toggleSection('design', $event)"
      >
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-bold text-sm shrink-0">
            <UiPzIcon name="palette" class="text-base" />
          </div>
          <div>
            <h3 class="font-bold text-sm text-on-surface">4. Modèle & Couleurs (Design)</h3>
            <p class="text-[11px] text-on-surface-variant line-clamp-1 font-medium">
              Choisir le modèle visuel et la couleur d'accent
            </p>
          </div>
        </div>
        <UiPzIcon
          name="expand_more"
          class="text-on-surface-variant transition-transform duration-200"
          :class="openSection === 'design' && 'rotate-180'"
        />
      </button>

      <div v-show="openSection === 'design'" class="p-4 sm:p-5 space-y-5 border-t border-outline-variant/30">
        <!-- PALETTE DE COULEURS SIMPLIFIÉE -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <p class="text-xs font-bold text-on-surface">Couleur d'accent</p>
            <button
              v-if="accentColors && accentColors.length > 6"
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
              v-for="color in displayedColors"
              :key="color"
              type="button"
              class="w-8 h-8 rounded-full ring-2 ring-offset-2 transition-all hover:scale-110 active:scale-95 shadow-2xs"
              :class="accentColor === color ? 'ring-primary scale-105' : 'ring-transparent opacity-85 hover:opacity-100'"
              :style="{ backgroundColor: color }"
              :aria-label="`Couleur ${color}`"
              @click="accentColor = color"
            />
          </div>
        </div>

        <!-- 🖼️ MODÈLE DE LETTRE AVEC VRAIES MINIATURES DU RENDU FINAL -->
        <div v-if="showTemplatePicker !== false" class="space-y-2.5">
          <p class="text-xs font-bold text-on-surface">Modèle de Lettre (Rendu visuel exact)</p>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <button
              v-for="tpl in COVER_LETTER_TEMPLATE_REGISTRY"
              :key="tpl.slug"
              type="button"
              class="group relative rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-2xs"
              :class="
                templateId === tpl.slug
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'border-outline-variant/60 hover:border-primary/50 bg-surface-container-lowest'
              "
              @click="templateId = tpl.slug"
            >
              <!-- 🖼️ VRAIE MINIATURE FIDÈLE DU DESIGN EN SVG -->
              <div class="w-full aspect-[4/3] rounded-lg bg-surface-container/30 border border-outline-variant/30 mb-2.5 p-2 overflow-hidden flex flex-col justify-between group-hover:bg-surface-container/60 transition-colors">
                <!-- CLASSIQUE : En-tête centré traditionnel -->
                <template v-if="tpl.slug === 'CLASSIQUE'">
                  <div class="flex flex-col items-center space-y-1">
                    <div class="h-1.5 w-1/2 rounded-full bg-on-surface/60" />
                    <div class="h-1 w-1/3 rounded-full bg-on-surface-variant/30" />
                    <div class="h-[1px] w-full bg-outline-variant/60 my-0.5" />
                  </div>
                  <div class="space-y-1 my-1">
                    <div class="h-1 w-full bg-on-surface-variant/30 rounded-full" />
                    <div class="h-1 w-5/6 bg-on-surface-variant/30 rounded-full" />
                    <div class="h-1 w-4/5 bg-on-surface-variant/30 rounded-full" />
                  </div>
                  <div class="h-1 w-1/4 rounded-full bg-on-surface/50 ml-auto" />
                </template>

                <!-- MODERNE : Bandeau supérieur coloré avec titre -->
                <template v-else-if="tpl.slug === 'MODERNE'">
                  <div
                    class="w-full h-3.5 rounded-md p-1 flex items-center justify-between transition-colors mb-1"
                    :style="{ backgroundColor: templateId === tpl.slug ? accentColor : '#0051d5' }"
                  >
                    <div class="h-1.5 w-1/3 bg-white/90 rounded-full" />
                    <div class="h-1 w-1/4 bg-white/60 rounded-full" />
                  </div>
                  <div class="space-y-1 my-1">
                    <div class="h-1 w-full bg-on-surface-variant/30 rounded-full" />
                    <div class="h-1 w-5/6 bg-on-surface-variant/30 rounded-full" />
                  </div>
                  <div
                    class="h-1 w-1/3 rounded-full ml-auto"
                    :style="{ backgroundColor: templateId === tpl.slug ? accentColor : '#0051d5' }"
                  />
                </template>

                <!-- ACCENT : Bandeau latéral coloré sur toute la hauteur -->
                <template v-else-if="tpl.slug === 'ACCENT'">
                  <div class="flex h-full gap-1.5">
                    <div
                      class="w-2 h-full rounded-sm shrink-0 transition-colors"
                      :style="{ backgroundColor: templateId === tpl.slug ? accentColor : '#0051d5' }"
                    />
                    <div class="flex-1 flex flex-col justify-between">
                      <div class="h-1.5 w-2/3 bg-on-surface/60 rounded-full" />
                      <div class="space-y-1">
                        <div class="h-1 w-full bg-on-surface-variant/30 rounded-full" />
                        <div class="h-1 w-4/5 bg-on-surface-variant/30 rounded-full" />
                      </div>
                      <div class="h-1 w-1/3 bg-on-surface-variant/40 rounded-full" />
                    </div>
                  </div>
                </template>

                <!-- PROFESSIONNEL : En-tête 2 colonnes avec barre séparatrice forte -->
                <template v-else-if="tpl.slug === 'PROFESSIONNEL'">
                  <div class="space-y-1">
                    <div class="flex justify-between items-center">
                      <div class="h-1.5 w-1/2 bg-on-surface/70 rounded-full" />
                      <div class="h-1 w-1/3 bg-on-surface-variant/40 rounded-full" />
                    </div>
                    <div
                      class="h-0.5 w-full rounded-full transition-colors"
                      :style="{ backgroundColor: templateId === tpl.slug ? accentColor : '#0051d5' }"
                    />
                  </div>
                  <div class="space-y-1 my-1">
                    <div class="h-1 w-full bg-on-surface-variant/30 rounded-full" />
                    <div class="h-1 w-5/6 bg-on-surface-variant/30 rounded-full" />
                  </div>
                  <div class="h-1 w-1/3 bg-on-surface/50 ml-auto rounded-full" />
                </template>

                <!-- CRÉATIF : Badge d'en-tête créatif et avatar circulaire -->
                <template v-else-if="tpl.slug === 'CREATIF'">
                  <div class="flex items-center gap-1.5 mb-1">
                    <div
                      class="w-3.5 h-3.5 rounded-full shrink-0 transition-colors"
                      :style="{ backgroundColor: templateId === tpl.slug ? accentColor : '#0051d5' }"
                    />
                    <div class="space-y-0.5 flex-1">
                      <div class="h-1.5 w-2/3 bg-on-surface/70 rounded-full" />
                      <div class="h-1 w-1/2 bg-on-surface-variant/40 rounded-full" />
                    </div>
                  </div>
                  <div class="space-y-1 my-1">
                    <div class="h-1 w-full bg-on-surface-variant/30 rounded-full" />
                    <div class="h-1 w-4/5 bg-on-surface-variant/30 rounded-full" />
                  </div>
                  <div
                    class="h-1 w-1/3 rounded-full ml-auto"
                    :style="{ backgroundColor: templateId === tpl.slug ? accentColor : '#0051d5' }"
                  />
                </template>
              </div>

              <div class="flex items-center justify-between">
                <p class="font-extrabold text-xs text-on-surface">{{ tpl.name }}</p>
                <span v-if="templateId === tpl.slug" class="w-2 h-2 rounded-full bg-primary" />
              </div>
              <p class="text-[10px] text-on-surface-variant mt-0.5 line-clamp-1 font-medium">{{ tpl.description }}</p>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 📱 MODAL IA DRAWER MOBILE (BOTTOM SHEET STABLE & ERGONOMIQUE) -->
    <Teleport to="body">
      <div
        v-if="aiModalOpen"
        class="fixed inset-0 z-[250] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      >
        <div
          class="w-full sm:max-w-lg max-h-[90vh] bg-surface rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col border border-outline-variant animate-in slide-in-from-bottom duration-200"
        >
          <!-- Header Modal -->
          <div class="flex items-center justify-between border-b border-outline-variant/40 pb-3.5 shrink-0">
            <div class="flex items-center gap-2.5 font-extrabold text-base text-on-surface">
              <UiPzIcon name="auto_awesome" class="text-primary text-xl" />
              <span>Générer une lettre sur-mesure</span>
            </div>
            <button
              type="button"
              class="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors"
              @click="aiModalOpen = false"
            >
              <UiPzIcon name="close" class="text-lg" />
            </button>
          </div>

          <!-- Body Scrollable -->
          <div class="flex-1 overflow-y-auto py-4 space-y-4 text-left">
            <UiFormField label="Texte de l'offre d'emploi" required>
              <textarea
                v-model="jobOfferInput"
                rows="5"
                class="form-input w-full resize-none text-base sm:text-sm"
                placeholder="Collez ici l'annonce de recrutement (missions demandées, profil recherché)..."
              />
            </UiFormField>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <UiFormField label="Entreprise (optionnel)">
                <input
                  v-model="targetCompanyInput"
                  type="text"
                  class="form-input w-full text-base sm:text-sm"
                  placeholder="Ex: Wave, Orange, Sonatel"
                />
              </UiFormField>
              <UiFormField label="Poste (optionnel)">
                <input
                  v-model="targetPositionInput"
                  type="text"
                  class="form-input w-full text-base sm:text-sm"
                  placeholder="Ex: Commercial B2B"
                />
              </UiFormField>
            </div>
          </div>

          <!-- Footer Sticky Actions -->
          <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-outline-variant/30 shrink-0 bg-surface">
            <button
              type="button"
              class="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
              @click="aiModalOpen = false"
            >
              Annuler
            </button>
            <button
              type="button"
              class="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-primary text-on-primary hover:bg-primary-hover shadow-md flex items-center gap-2 disabled:opacity-50 transition-all active:scale-95"
              :disabled="aiLoading || !jobOfferInput.trim()"
              @click="handleGenerateFromJobOffer"
            >
              <UiPzIcon name="auto_awesome" class="text-base" />
              <span>{{ aiLoading ? 'Génération...' : '✨ Rédiger la lettre' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
