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

defineProps<{
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

// Section ouverte par défaut : Contenu & IA (pour une visibilité immédiate !)
const openSection = ref<string>('content')

function toggleSection(id: string) {
  openSection.value = openSection.value === id ? '' : id
}

// Calcul dynamique du taux de complétion de la lettre
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
  <div class="space-y-4">
    <!-- 🚀 BANNIÈRE HERO IA (TOUT EN HAUT : VISIBILITÉ 100% IMMÉDIATE SUR MOBILE) -->
    <div class="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-primary/15 via-secondary/15 to-primary/10 border border-primary/30 shadow-sm">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
        <div class="space-y-1">
          <div class="flex items-center gap-2 font-extrabold text-sm sm:text-base text-primary">
            <UiPzIcon name="auto_awesome" class="text-lg animate-pulse" />
            <span>Générer ma lettre avec l'IA en 1 clic</span>
          </div>
          <p class="text-xs text-on-surface-variant leading-relaxed">
            Collez une offre d'emploi ou votre poste et l'IA rédige une lettre sur-mesure et captivante.
          </p>
        </div>
        <button
          type="button"
          class="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs sm:text-sm hover:bg-primary-hover shadow-md transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95"
          @click="aiModalOpen = true"
        >
          <UiPzIcon name="auto_awesome" class="text-base" />
          <span>✨ Rédiger ma lettre avec l'IA</span>
        </button>
      </div>
    </div>

    <!-- Barre d'avancement (0% à 100%) -->
    <div class="p-3.5 rounded-xl bg-surface-container border border-outline-variant/60 flex items-center justify-between gap-3">
      <div class="flex items-center gap-2.5">
        <div class="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
          {{ completionScore }}%
        </div>
        <div>
          <p class="text-xs font-bold text-on-surface">Avancement de la lettre</p>
          <p class="text-[11px] text-on-surface-variant">Remplissez les volets ci-dessous</p>
        </div>
      </div>
      <div class="w-24 sm:w-32 h-2 bg-outline-variant/30 rounded-full overflow-hidden shrink-0">
        <div
          class="h-full bg-primary transition-all duration-300 rounded-full"
          :style="{ width: `${completionScore}%` }"
        />
      </div>
    </div>

    <!-- Accordéon 1 (OUVERT PAR DÉFAUT) : ✍️ Contenu de la Lettre & IA -->
    <div class="rounded-xl border border-outline-variant overflow-hidden bg-surface-container-lowest transition-all shadow-sm">
      <button
        type="button"
        class="w-full px-4 py-3.5 flex items-center justify-between text-left bg-surface-container/40 hover:bg-surface-container/70 transition-colors"
        @click="toggleSection('content')"
      >
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
            1
          </div>
          <div>
            <h3 class="font-bold text-sm text-on-surface">Contenu de la Lettre & IA</h3>
            <p class="text-[11px] text-on-surface-variant line-clamp-1">
              {{ content ? 'Lettre rédigée' : 'Rédigez vous-même ou génerer avec l’IA' }}
            </p>
          </div>
        </div>
        <UiPzIcon
          name="expand_more"
          class="text-on-surface-variant transition-transform duration-200"
          :class="openSection === 'content' && 'rotate-180'"
        />
      </button>

      <div v-show="openSection === 'content'" class="p-4 space-y-4 border-t border-outline-variant/40">
        <UiFormField label="Corps de la lettre" required :error="fieldError(fieldErrors, 'content')">
          <div class="space-y-2">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs text-on-surface-variant font-medium">Texte principal de la lettre</span>
              <!-- Bouton IA TOUJOURS VISIBLE ET CLAIR -->
              <button
                type="button"
                class="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors active:scale-95 shrink-0"
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
              class="form-input form-input--white w-full resize-y text-sm"
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

    <!-- Accordéon 2 : 👤 Vos Coordonnées (Expéditeur) -->
    <div class="rounded-xl border border-outline-variant overflow-hidden bg-surface-container-lowest transition-all shadow-sm">
      <button
        type="button"
        class="w-full px-4 py-3.5 flex items-center justify-between text-left bg-surface-container/40 hover:bg-surface-container/70 transition-colors"
        @click="toggleSection('sender')"
      >
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center font-bold text-sm shrink-0">
            2
          </div>
          <div>
            <h3 class="font-bold text-sm text-on-surface">Vos Coordonnées (Expéditeur)</h3>
            <p class="text-[11px] text-on-surface-variant line-clamp-1">
              {{ senderName ? `${senderName} · ${senderLocation || 'Lieu non renseigné'}` : 'Pré-rempli depuis votre CV' }}
            </p>
          </div>
        </div>
        <UiPzIcon
          name="expand_more"
          class="text-on-surface-variant transition-transform duration-200"
          :class="openSection === 'sender' && 'rotate-180'"
        />
      </button>

      <div v-show="openSection === 'sender'" class="p-4 space-y-3 border-t border-outline-variant/40">
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

    <!-- Accordéon 3 : 🏢 L'Entreprise & Poste Visé -->
    <div class="rounded-xl border border-outline-variant overflow-hidden bg-surface-container-lowest transition-all shadow-sm">
      <button
        type="button"
        class="w-full px-4 py-3.5 flex items-center justify-between text-left bg-surface-container/40 hover:bg-surface-container/70 transition-colors"
        @click="toggleSection('recipient')"
      >
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-tertiary/10 text-tertiary flex items-center justify-center font-bold text-sm shrink-0">
            3
          </div>
          <div>
            <h3 class="font-bold text-sm text-on-surface">L'Entreprise & Poste Visé</h3>
            <p class="text-[11px] text-on-surface-variant line-clamp-1">
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

      <div v-show="openSection === 'recipient'" class="p-4 space-y-3 border-t border-outline-variant/40">
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

    <!-- Accordéon 4 (REPLIÉ PAR DÉFAUT) : 🎨 Modèle & Couleurs (Design) -->
    <div class="rounded-xl border border-outline-variant overflow-hidden bg-surface-container-lowest transition-all shadow-sm">
      <button
        type="button"
        class="w-full px-4 py-3.5 flex items-center justify-between text-left bg-surface-container/40 hover:bg-surface-container/70 transition-colors"
        @click="toggleSection('design')"
      >
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
            🎨
          </div>
          <div>
            <h3 class="font-bold text-sm text-on-surface">Modèle & Couleurs (Design)</h3>
            <p class="text-[11px] text-on-surface-variant line-clamp-1">
              Personnaliser l'apparence de la lettre
            </p>
          </div>
        </div>
        <UiPzIcon
          name="expand_more"
          class="text-on-surface-variant transition-transform duration-200"
          :class="openSection === 'design' && 'rotate-180'"
        />
      </button>

      <div v-show="openSection === 'design'" class="p-4 space-y-4 border-t border-outline-variant/40">
        <!-- Palette de Couleurs -->
        <div v-if="accentColors && accentColors.length > 0">
          <p class="text-xs font-bold text-on-surface mb-2">Couleur d'accent</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="color in accentColors"
              :key="color"
              type="button"
              class="w-8 h-8 rounded-full ring-2 ring-offset-2 transition-transform active:scale-95"
              :class="accentColor === color ? 'ring-secondary' : 'ring-transparent'"
              :style="{ backgroundColor: color }"
              :aria-label="`Couleur ${color}`"
              @click="accentColor = color"
            />
          </div>
        </div>

        <!-- Choix du Modèle -->
        <div v-if="showTemplatePicker !== false" class="space-y-2">
          <p class="text-xs font-bold text-on-surface">Modèle de Lettre</p>
          <div class="grid grid-cols-2 gap-2.5">
            <button
              v-for="tpl in COVER_LETTER_TEMPLATE_REGISTRY"
              :key="tpl.slug"
              type="button"
              class="rounded-xl border p-2.5 text-left transition-all"
              :class="
                templateId === tpl.slug
                  ? 'border-secondary bg-secondary/5 ring-2 ring-secondary/20'
                  : 'border-outline-variant hover:border-secondary/50'
              "
              @click="templateId = tpl.slug"
            >
              <p class="font-bold text-xs text-on-surface">{{ tpl.name }}</p>
              <p class="text-[10px] text-on-surface-variant mt-0.5 line-clamp-2">{{ tpl.description }}</p>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 📱 MODAL IA RECONÇU MODERNE, STABLE & ADAPTÉ AUX CLAVIERS MOBILES (BOTTOM SHEET / DRAWER) -->
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

          <!-- Body Scrollable (Résistant au clavier mobile) -->
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

          <!-- Footer Sticky Actions (TOUJOURS VISIBLE MÊME CLAVIER OUVERT) -->
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
