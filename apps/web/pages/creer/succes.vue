<script setup lang="ts">
import { MSG } from '@profiloz/shared'
import { hasDossierDownloadAccess } from '~/utils/dossier-access'

definePageMeta({ layout: false })

const authStore = useAuthStore()
const resumeStore = useResumeStore()
const coverLetterStore = useCoverLetterStore()
const paymentService = usePaymentService()
const route = useRoute()

const isLetter = computed(() => route.query.type === 'letter')
const signupRedirect = '/tableau-de-bord'

const downloadedFilename = computed(() => {
  const fromQuery = route.query.file
  if (typeof fromQuery === 'string' && fromQuery.trim()) return fromQuery
  if (isLetter.value && coverLetterStore.current) {
    return buildCoverLetterPdfFilename(coverLetterStore.current.senderName)
  }
  if (resumeStore.current) return buildResumePdfFilename(resumeStore.current)
  return isLetter.value ? 'lettre Profiloz.pdf' : 'cv Profiloz.pdf'
})

const successHeadline = computed(() =>
  isLetter.value ? MSG.guide.successLetterHeadline : MSG.guide.successHeadline,
)

const editLink = computed(() => (isLetter.value ? '/creer/lettre/editeur' : '/creer/editeur'))
const crossSellLink = computed(() =>
  isLetter.value ? '/creer' : '/creer/lettre',
)
const crossSellTitle = computed(() =>
  isLetter.value ? MSG.guide.successCrossSellLetterTitle : MSG.guide.successCrossSellCvTitle,
)
const crossSellBody = computed(() =>
  isLetter.value ? MSG.guide.successCrossSellLetterBody : MSG.guide.successCrossSellCvBody,
)
const crossSellCta = computed(() =>
  isLetter.value ? MSG.guide.successCrossSellCtaCv : MSG.guide.successCrossSellCtaLetter,
)

const hasPaidAccess = ref(false)

onMounted(async () => {
  authStore.loadFromStorage()
  resumeStore.rehydrateFromStorage()
  coverLetterStore.rehydrateFromStorage()

  const container = document.getElementById('confetti-container')
  if (container) {
    const colors = ['#316bf3', '#71f8e4', '#b4c5ff', '#0051d5']
    for (let i = 0; i < 30; i++) {
      const el = document.createElement('div')
      el.className = 'confetti-piece'
      el.style.left = `${Math.random() * 100}%`
      el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)] ?? '#316bf3'
      el.style.animationDelay = `${Math.random() * 2}s`
      container.appendChild(el)
    }
  }

  try {
    await useGuestSession().ensureSession()
    const e = await paymentService.getEntitlements()
    hasPaidAccess.value = hasDossierDownloadAccess(e)
  } catch {
    hasPaidAccess.value = authStore.isAuthenticated
  }
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-background">
    <header class="flex justify-between items-center gap-3 px-margin-mobile py-2.5 border-b border-outline-variant/30 bg-surface/90 backdrop-blur-sm shrink-0">
      <UiAppLogo size="sm" class="shrink-0 [&_img]:h-8" />
      <LayoutAuthStatus icon-only class="sm:hidden" />
      <LayoutAuthStatus compact class="hidden sm:flex" />
    </header>

    <div class="flex-1 flex flex-col items-center justify-center p-margin-mobile relative overflow-hidden gradient-mesh pb-28 sm:pb-8">
      <div id="confetti-container" class="absolute inset-0 pointer-events-none overflow-hidden" />

      <UiCard variant="glass" padding="lg" class="relative w-full max-w-2xl text-center animate-zoom-in shadow-lg !p-6 sm:!p-12">
        <div class="text-5xl mb-4 sm:mb-6">🎉</div>
        <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-3 sm:mb-4">Félicitations !</h1>
        <p class="text-base sm:text-lg text-on-surface font-medium mb-2">{{ successHeadline }}</p>
        <p class="text-on-surface-variant text-sm sm:text-base max-w-md mx-auto mb-8 sm:mb-10">
          {{ MSG.guide.successLead }}
        </p>

        <UiCard
          variant="default"
          padding="md"
          class="mb-6 text-left !bg-secondary/5 border-secondary/20"
        >
          <div class="flex items-start gap-3">
            <UiPzIcon name="redeem" class="text-secondary text-[28px] shrink-0 mt-0.5" />
            <div class="min-w-0">
              <h3 class="font-bold text-on-surface mb-1">{{ crossSellTitle }}</h3>
              <p class="text-sm text-on-surface-variant mb-3">{{ crossSellBody }}</p>
              <NuxtLink :to="crossSellLink">
                <UiButton variant="secondary" size="sm" icon="arrow_forward">
                  {{ crossSellCta }}
                </UiButton>
              </NuxtLink>
              <p v-if="hasPaidAccess" class="text-xs text-secondary font-semibold mt-2">
                Inclus dans votre offre — aucun paiement supplémentaire.
              </p>
            </div>
          </div>
        </UiCard>

        <div v-if="authStore.isAuthenticated" class="space-y-3 mb-6">
          <NuxtLink to="/tableau-de-bord" class="block">
            <UiButton block>{{ MSG.guide.successCrossSellDashboard }}</UiButton>
          </NuxtLink>
          <NuxtLink :to="editLink" class="block text-secondary font-semibold hover:underline min-h-11 inline-flex items-center justify-center w-full">
            Continuer à modifier
          </NuxtLink>
        </div>

        <UiCard v-else variant="default" padding="md" class="mb-6 text-left !bg-surface-container-low">
          <h3 class="font-bold text-primary mb-3">{{ MSG.guide.accountPitch }}</h3>
          <ul class="space-y-2 text-on-surface-variant text-sm mb-4">
            <li v-for="benefit in MSG.guide.accountBenefits" :key="benefit" class="flex items-center gap-2">
              <UiPzIcon name="check" class="text-secondary text-[18px]" />
              {{ benefit }}
            </li>
          </ul>
          <div class="flex flex-col gap-2">
            <NuxtLink :to="`/inscription?redirect=${encodeURIComponent(signupRedirect)}`">
              <UiButton variant="primary" block>{{ MSG.buttons.createAccount }}</UiButton>
            </NuxtLink>
            <NuxtLink to="/" class="text-secondary py-2 text-center font-semibold hover:underline min-h-11 inline-flex items-center justify-center">
              Continuer sans compte
            </NuxtLink>
          </div>
        </UiCard>

        <div class="inline-flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-outline-variant/30 max-w-full">
          <UiPzIcon name="picture_as_pdf" class="text-error shrink-0" />
          <span class="text-sm text-on-surface-variant truncate">{{ downloadedFilename }}</span>
          <UiPzIcon name="download" class="text-on-surface-variant/50 text-[18px] shrink-0" />
        </div>
      </UiCard>
    </div>

    <UiStickyActionBar v-if="!authStore.isAuthenticated" class="sm:hidden">
      <NuxtLink :to="`/inscription?redirect=${encodeURIComponent(signupRedirect)}`" class="block">
        <UiButton variant="secondary" block icon="person_add">
          {{ MSG.buttons.createAccount }}
        </UiButton>
      </NuxtLink>
    </UiStickyActionBar>
  </div>
</template>

<style scoped>
.gradient-mesh {
  background-color: #f8f9ff;
  background-image:
    radial-gradient(at 0% 0%, rgba(49, 107, 243, 0.05) 0px, transparent 50%),
    radial-gradient(at 100% 0%, rgba(113, 248, 228, 0.08) 0px, transparent 50%);
}

:global(.confetti-piece) {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  animation: confetti-fall 3s ease-out forwards;
}

@keyframes confetti-fall {
  0% { transform: translateY(-50px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}
</style>
