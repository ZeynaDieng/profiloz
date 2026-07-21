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

// Section ouverte par défaut : Contenu & IA (pour une action immédiate !)
const openSection = ref<string>('content')

function toggleSection(id: string) {
  openSection.value = openSection.value === id ? '' : id
}

// 6 Couleurs principales présélectionnées (Design Épuré)
const primaryPalette = ['#0051d5', '#1e293b', '#10b981', '#8b5cf6', '#f97316', '#ef4444']

const displayedColors = computed(() => {
  if (!props.accentColors || props.accentColors.length === 0) return primaryPalette
  if (showAllColors.value) return props.accentColors
  return primaryPalette
})

// Calcul dynamique du taux de complétion et des étapes restantes
const completionScore = computed(() => {
  let score = 0
  if (senderName.value?.trim()) score += 25
  if (companyName.value?.trim()) score += 25
  if (position.value?.trim()) score += 25
  if (content.value?.trim()) score += 25
  return score
})

const remainingStepsCount = computed(() => {
  let steps = 4
  if (senderName.value?.trim()) steps--
  if (companyName.value?.trim()) steps--
  if (position.value?.trim()) steps--
  if (content.value?.trim()) steps--
  return Math.max(0, steps)
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
    <!-- 🚀 3. HÉROS IA EMBLEMÉTIQUE (Canva / Linear Style) -->
    <div class="relative overflow-hidden p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-primary/15 via-secondary/10 to-primary/5 border border-primary/25 shadow-xs transition-all hover:border-primary/40">
      <div class="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div class="space-y-1.5 max-w-xl">
          <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/15 text-primary text-[11px] font-extrabold tracking-wide uppercase">
            <UiPzIcon name="auto_awesome" class="text-xs animate-pulse" />
            <span>Générateur IA Sur-Mesure</span>
          </div>
          <h3 class="text-base sm:text-lg font-extrabold text-on-surface leading-tight">
            Rédigez une lettre captivante en moins de 30 secondes
          </h3>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant pt-0.5">
            <span class="flex items-center gap-1 font-medium"><UiPzIcon name="check_circle" class="text-emerald-500 text-sm" /> IA entraînée pour les recruteurs</span>
            <span class="flex items-center gap-1 font-medium"><UiPzIcon name="bolt" class="text-amber-500 text-sm" /> +10 000 lettres générées</span>
          </div>
        </div>

        <button
          type="button"
          class="w-full sm:w-auto px-5 py-3 rounded-xl bg-primary text-on-primary font-extrabold text-xs sm:text-sm hover:bg-primary-hover shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95 group"
          @click="aiModalOpen = true"
        >
          <UiPzIcon name="auto_awesome" class="text-base group-hover:rotate-12 transition-transform" />
          <span>✨ Rédiger ma lettre avec l'IA</span>
        </button>
      </div>
    </div>

    <!-- 📊 2. CARTE DE PROGRESSION ENGAGEANTE -->
    <div class="p-4 rounded-2xl bg-surface-container/50 border border-outline-variant/40 shadow-2xs backdrop-blur-sm space-y-2.5 transition-all">
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-2.5">
          <div
            class="w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-xs transition-colors shrink-0"
            :class="completionScore >= 100 ? 'bg-emerald-500 text-white' : 'bg-primary/10 text-primary'"
          >
            {{ completionScore >= 100 ? '✓' : `${completionScore}%` }}
          </div>
          <div>
            <h4 class="text-xs sm:text-sm font-bold text-on-surface">
              Votre lettre est complétée à <span class="text-primary font-extrabold">{{ completionScore }}%</span>
            </h4>
            <p class="text-[11px] text-on-surface-variant font-medium">
              <template v-if="completionScore >= 100">🎉 Votre lettre est 100% prête à être exportée en PDF !</template>
              <template v-else>Encore {{ remainingStepsCount }} étape{{ remainingStepsCount > 1 ? 's' : '' }} simple{{ remainingStepsCount > 1 ? 's' : '' }} avant votre PDF HD</template>
            </p>
          </div>
        </div>
        <div class="text-right shrink-0">
          <span class="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full" :class="completionScore >= 100 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-primary/10 text-primary'">
            <UiPzIcon name="schedule" class="text-xs" />
            <span>{{ completionScore >= 100 ? 'Prêt' : '~1 min' }}</span>
          </span>
        </div>
      </div>

      <!-- Barre de progression animée -->
      <div class="w-full h-2 bg-outline-variant/20 rounded-full overflow-hidden p-0.5">
        <div
          class="h-full bg-gradient-to-r from-primary via-secondary to-primary rounded-full transition-all duration-500 ease-out shadow-2xs"
          :style="{ width: `${completionScore}%` }"
        />
      </div>
    </div>

    <!-- 6. ACCORDÉONS UNIFORMISÉS AVEC ICÔNES -->

    <!-- ACCORDÉON 1 (OUVERT PAR DÉFAUT) : 📝 Contenu de la Lettre & IA -->
    <div class="rounded-2xl border border-outline-variant/40 overflow-hidden bg-surface-container-lowest transition-all shadow-2xs hover:border-outline-variant/70">
      <button
        type="button"
        class="w-full px-4 py-3.5 flex items-center justify-between text-left bg-surface-container/30 hover:bg-surface-container/60 transition-colors"
        @click="toggleSection('content')"
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
              <!-- Bouton IA TOUJOURS VISIBLE ET REHAUSSÉ -->
              <button
                type="button"
                class="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-xl transition-all active:scale-95 shrink-0"
                :disabled="aiLoading"
                @click="handleEnhanceContent"
              >
                <UiPzIcon name="auto_awesome" class="text-sm animate-pulse" />
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
        @click="toggleSection('sender')"
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
        @click="toggleSection('recipient')"
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

    <!-- ACCORDÉON 4 : 🎨 Modèle & Couleurs (Design Visuel Canva Style) -->
    <div class="rounded-2xl border border-outline-variant/40 overflow-hidden bg-surface-container-lowest transition-all shadow-2xs hover:border-outline-variant/70">
      <button
        type="button"
        class="w-full px-4 py-3.5 flex items-center justify-between text-left bg-surface-container/30 hover:bg-surface-container/60 transition-colors"
        @click="toggleSection('design')"
      >
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-bold text-sm shrink-0">
            <UiPzIcon name="palette" class="text-base" />
          </div>
          <div>
            <h3 class="font-bold text-sm text-on-surface">4. Modèle & Couleurs (Design)</h3>
            <p class="text-[11px] text-on-surface-variant line-clamp-1 font-medium">
              Choisir le modèle visuel et la palette de couleur
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
        <!-- 5. PALETTE DE COULEURS SIMPLIFIÉE + "+ PLUS DE COULEURS" -->
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

        <!-- 4. MODÈLE DE LETTRE VISUEL AVEC MINIATURES SVG (Canva / Resume.io Style) -->
        <div v-if="showTemplatePicker !== false" class="space-y-2.5">
          <p class="text-xs font-bold text-on-surface">Modèle de Lettre (Choisissez avec les yeux)</p>
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
              <!-- Miniature Vectorielle du Design -->
              <div class="w-full aspect-[4/3] rounded-lg bg-surface-container/40 border border-outline-variant/20 mb-2 p-2 flex flex-col justify-between overflow-hidden group-hover:bg-surface-container/70 transition-colors">
                <!-- Header preview mini -->
                <div class="space-y-1">
                  <div
                    class="h-1.5 rounded-full transition-all"
                    :class="tpl.slug === 'ACCENT' ? 'w-full bg-primary' : 'w-1/2 bg-on-surface/40'"
                    :style="templateId === tpl.slug ? { backgroundColor: accentColor } : {}"
                  />
                  <div class="h-1 w-1/3 rounded-full bg-on-surface-variant/30" />
                </div>
                <!-- Body lines mini -->
                <div class="space-y-1 my-1">
                  <div class="h-1 w-full bg-on-surface-variant/25 rounded-full" />
                  <div class="h-1 w-5/6 bg-on-surface-variant/25 rounded-full" />
                  <div class="h-1 w-4/5 bg-on-surface-variant/25 rounded-full" />
                </div>
                <!-- Signature line mini -->
                <div class="h-1 w-1/4 rounded-full bg-primary/40 ml-auto" />
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
