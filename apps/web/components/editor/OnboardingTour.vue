<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'

const props = defineProps<{
  modelValue: boolean // active state
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

interface TourStep {
  target: string
  title: string
  content: string
  section?: string
}

const steps: TourStep[] = [
  {
    target: '#tour-template-selector',
    title: '🎨 Choix du modèle',
    content: 'Cliquez ici pour changer de design de CV à tout moment. Toutes vos données seront conservées et adaptées instantanément au nouveau style graphique.',
  },
  {
    target: '[data-section-id="personal"]',
    title: '📞 Informations personnelles',
    content: 'Saisissez vos coordonnées de contact. Assurez-vous de bien vérifier votre adresse e-mail et votre numéro de téléphone afin de rester joignable par les recruteurs.',
    section: 'personal',
  },
  {
    target: '[data-section-id="summary"]',
    title: '💡 Votre profil professionnel',
    content: 'Rédigez 2 ou 3 phrases percutantes pour vous présenter. **Astuce :** Cliquez sur le bouton "Générer mon profil IA" juste au-dessus pour que Gemini rédige une présentation percutante en un clic !',
    section: 'summary',
  },
  {
    target: '[data-section-id="parcours"]',
    title: '💼 Parcours & Expériences',
    content: 'Ajoutez vos postes du plus récent au plus ancien. Pour chaque expérience, cliquez sur **"✨ Améliorer avec l\'IA"** pour reformuler vos tâches sous forme de puces courtes et vendeuses.',
    section: 'parcours',
  },
  {
    target: '[data-section-id="qualifications"]',
    title: '🎓 Compétences & Formations',
    content: 'Renseignez vos diplômes et vos compétences clés. C\'est crucial pour aider votre CV à passer les filtres robotisés des recruteurs (systèmes ATS).',
    section: 'qualifications',
  },
  {
    target: '#tour-color-picker',
    title: '🎨 Palette de couleurs',
    content: 'Personnalisez instantanément votre modèle en cliquant sur l\'un de ces cercles pour modifier la couleur d\'accentuation principale.',
  },
  {
    target: '#tour-preview-panel',
    title: '👁️ Aperçu en temps réel',
    content: 'Cette zone de droite affiche votre document final. Elle se met à jour en temps réel à chaque fois que vous tapez une lettre dans le formulaire.',
  },
  {
    target: '#tour-download-btn',
    title: '🚀 Téléchargement PDF',
    content: 'Votre CV vous convient ? Cliquez ici pour lancer le téléchargement de votre fichier PDF de haute qualité. Vous pourrez ensuite créer votre lettre assortie gratuitement !',
  },
]

const activeStep = ref(0)
const spotlightStyle = ref<Record<string, string>>({ display: 'none' })
const tooltipStyle = ref<Record<string, string>>({ display: 'none' })

const openSectionState = useState<string>('active-editor-section')

const currentStep = computed(() => steps[activeStep.value])

function updatePosition() {
  if (!props.modelValue || activeStep.value >= steps.length) {
    spotlightStyle.value = { display: 'none' }
    tooltipStyle.value = { display: 'none' }
    return
  }

  const step = currentStep.value
  if (!step) return

  // Si l'étape requiert d'ouvrir une section du formulaire
  if (step.section) {
    openSectionState.value = step.section
  }

  nextTick(() => {
    const el = document.querySelector(step.target) as HTMLElement
    if (!el || el.getBoundingClientRect().width === 0) {
      // Si l'élément cible n'est pas affiché sur cet écran (ex: preview sur mobile), on passe au suivant
      handleNext()
      return
    }

    const rect = el.getBoundingClientRect()
    const scrollY = window.scrollY
    const scrollX = window.scrollX

    // Ajustement de la surbrillance (spotlight)
    const padding = 6
    spotlightStyle.value = {
      display: 'block',
      top: `${rect.top - padding}px`,
      left: `${rect.left - padding}px`,
      width: `${rect.width + padding * 2}px`,
      height: `${rect.height + padding * 2}px`,
    }

    // Calcul de la position de l'infobulle
    const tooltipPadding = 12
    const isMobile = window.innerWidth < 1024

    if (isMobile) {
      // Sur mobile, on fixe la carte en bas de l'écran pour une ergonomie optimale
      tooltipStyle.value = {
        display: 'block',
        position: 'fixed',
        bottom: '24px',
        left: '16px',
        right: '16px',
        width: 'calc(100vw - 32px)',
        zIndex: '10001',
      }
    } else {
      // Sur desktop, on la positionne intelligemment à côté ou sous l'élément ciblé
      let top = rect.bottom + tooltipPadding
      let left = rect.left + rect.width / 2

      // Si l'élément est trop bas sur l'écran, on affiche l'infobulle au-dessus
      if (rect.bottom > window.innerHeight - 250) {
        top = rect.top - tooltipPadding - 180 // hauteur estimée
      }

      // Si l'élément cible est sur la droite de l'écran (ex: aperçu ou téléchargement)
      if (rect.left > window.innerWidth - 350) {
        left = rect.left - 300 // décaler à gauche
      } else {
        left = Math.max(16, left - 150) // centrer par rapport à l'infobulle (largeur ~300px)
      }

      tooltipStyle.value = {
        display: 'block',
        position: 'fixed',
        top: `${Math.max(16, top)}px`,
        left: `${left}px`,
        width: '320px',
        zIndex: '10001',
      }
    }
  })
}

function handleNext() {
  if (activeStep.value < steps.length - 1) {
    activeStep.value++
    updatePosition()
  } else {
    handleClose()
  }
}

function handlePrev() {
  if (activeStep.value > 0) {
    activeStep.value--
    updatePosition()
  }
}

function handleClose() {
  emit('update:modelValue', false)
  localStorage.setItem('profiloz:onboarding-completed', 'true')
}

// Relancer le recalcul des positions si la taille de la fenêtre change
let resizeTimeout: any
function onResize() {
  clearTimeout(resizeTimeout)
  resizeTimeout = setTimeout(updatePosition, 100)
}

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    activeStep.value = 0
    updatePosition()
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', updatePosition, true)
  } else {
    window.removeEventListener('resize', onResize)
    window.removeEventListener('scroll', updatePosition, true)
  }
})

// Suivre l'avancement manuel du formulaire pour synchroniser les positions
watch(openSectionState, () => {
  if (props.modelValue) {
    // Laisser un court délai pour l'animation d'ouverture CSS avant de mesurer les coordonnées
    setTimeout(updatePosition, 300)
  }
})
</script>

<template>
  <div v-if="modelValue" class="onboarding-tour-root">
    <!-- Voile d'ombrage transparent bloquant les clics en dehors de l'élément actif -->
    <div class="fixed inset-0 bg-slate-950/70 backdrop-blur-[1px] z-[9999]" @click="handleClose" />

    <!-- Projecteur animé en surbrillance autour de la cible -->
    <div
      class="spotlight-highlight"
      :style="spotlightStyle"
    />

    <!-- Carte d'aide / Infobulle -->
    <div
      class="tooltip-card rounded-2xl bg-surface/90 border border-outline-variant/60 shadow-2xl p-5 flex flex-col gap-3 transition-all duration-300"
      :style="tooltipStyle"
    >
      <!-- En-tête -->
      <div class="flex items-center justify-between border-b border-outline-variant/30 pb-2">
        <h4 class="text-sm font-extrabold text-on-surface flex items-center gap-1.5">
          {{ currentStep?.title }}
        </h4>
        <span class="text-[10px] font-bold text-primary px-2 py-0.5 rounded-full bg-primary/10 select-none">
          Étape {{ activeStep + 1 }} sur {{ steps.length }}
        </span>
      </div>

      <!-- Contenu explicatif -->
      <p class="text-xs text-on-surface-variant leading-relaxed select-text" v-html="currentStep?.content" />

      <!-- Barre d'actions -->
      <div class="flex items-center justify-between mt-2 pt-2 border-t border-outline-variant/30">
        <button
          type="button"
          class="text-[11px] font-bold text-on-surface-variant hover:text-primary transition-colors py-1.5"
          @click="handleClose"
        >
          Passer
        </button>

        <div class="flex items-center gap-2">
          <button
            v-if="activeStep > 0"
            type="button"
            class="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-surface-container text-on-surface hover:bg-surface-container-high active:scale-95 transition-all"
            @click="handlePrev"
          >
            Retour
          </button>
          <button
            type="button"
            class="px-4 py-1.5 rounded-lg text-xs font-bold bg-primary text-on-primary hover:bg-primary-hover active:scale-95 transition-all shadow-sm"
            @click="handleNext"
          >
            {{ activeStep === steps.length - 1 ? 'Terminer' : 'Suivant' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes spotlight-pulse {
  0%, 100% {
    border-color: rgba(0, 81, 213, 0.85);
    box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.65), 0 0 12px rgba(0, 81, 213, 0.4);
  }
  50% {
    border-color: rgba(113, 248, 228, 0.95);
    box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.65), 0 0 20px rgba(113, 248, 228, 0.7);
  }
}

.spotlight-highlight {
  position: fixed;
  z-index: 10000;
  border-radius: 12px;
  pointer-events: none;
  border: 2.5px solid #0051d5;
  box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.65);
  animation: spotlight-pulse 2s infinite ease-in-out;
  transition: top 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              left 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.tooltip-card {
  z-index: 10001;
  backdrop-filter: blur(16px);
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.3), 0 8px 10px -6px rgb(0 0 0 / 0.3);
}
</style>
