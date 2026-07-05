<script setup lang="ts">
import { MSG } from '@profiloz/shared'
import { hasDossierDownloadAccess } from '~/utils/dossier-access'
import { summarizeEntitlements } from '~/utils/entitlements-summary'
import {
  isGuestDossierComplete,
  loadGuestDossierState,
  nextIncludedDocument,
  reconcileGuestDossierFlags,
  type GuestDossierState,
} from '~/utils/guest-dossier-state'
import { loadLastDownloadContext } from '~/utils/last-download-context'

definePageMeta({ layout: 'guest-flow' })

const authStore = useAuthStore()
const resumeStore = useResumeStore()
const coverLetterStore = useCoverLetterStore()
const paymentService = usePaymentService()
const route = useRoute()
const { downloading, downloadError, lastFilename, downloadKind } = useGuestDownload()

const isLetter = computed(() => route.query.type === 'letter')
const signupRedirect = '/tableau-de-bord'
const dossierState = ref<GuestDossierState | null>(null)

const downloadedFilename = computed(() => {
  const fromQuery = route.query.file
  if (typeof fromQuery === 'string' && fromQuery.trim()) return fromQuery
  if (lastFilename.value) return lastFilename.value
  const last = loadLastDownloadContext()
  if (last?.filename) return last.filename
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

const dossierComplete = computed(() => isGuestDossierComplete(dossierState.value))
const nextDocument = computed(() => nextIncludedDocument(dossierState.value))
const showCrossSell = computed(() => Boolean(nextDocument.value) && hasPaidAccess.value)

const crossSellLink = computed(() => {
  if (nextDocument.value === 'letter') return '/creer/lettre/editeur'
  if (nextDocument.value === 'cv') return '/creer/editeur'
  return isLetter.value ? '/creer/editeur' : '/creer/lettre/editeur'
})

const crossSellTitle = computed(() => {
  if (nextDocument.value === 'letter') return MSG.guide.successCrossSellCvTitle
  if (nextDocument.value === 'cv') return MSG.guide.successCrossSellLetterTitle
  return isLetter.value ? MSG.guide.successCrossSellLetterTitle : MSG.guide.successCrossSellCvTitle
})

const crossSellBody = computed(() => {
  if (nextDocument.value === 'letter') return MSG.guide.successCrossSellCvBody
  if (nextDocument.value === 'cv') return MSG.guide.successCrossSellLetterBody
  return isLetter.value ? MSG.guide.successCrossSellLetterBody : MSG.guide.successCrossSellCvBody
})

const crossSellCta = computed(() => {
  if (nextDocument.value === 'letter') return MSG.guide.successCrossSellCtaLetter
  if (nextDocument.value === 'cv') return MSG.guide.successCrossSellCtaCv
  return isLetter.value ? MSG.guide.successCrossSellCtaCv : MSG.guide.successCrossSellCtaLetter
})

const hasPaidAccess = ref(false)
const entitlements = ref<import('~/services/payment.service').Entitlements | null>(null)
const entitlementsSummary = computed(() => summarizeEntitlements(entitlements.value))

async function refreshEntitlements() {
  try {
    await useGuestSession().ensureSession()
    await syncGuestSessionForEditor()
    entitlements.value = await paymentService.getEntitlements()
    hasPaidAccess.value = hasDossierDownloadAccess(entitlements.value)
  } catch {
    entitlements.value = null
    hasPaidAccess.value = false
  }
}

async function triggerDownload() {
  await downloadKind(isLetter.value ? 'letter' : 'cv')
  dossierState.value = loadGuestDossierState()
  await refreshEntitlements()
}

onMounted(async () => {
  authStore.loadFromStorage()
  resumeStore.rehydrateFromStorage()
  coverLetterStore.rehydrateFromStorage()
  const hasLetterContent = Boolean(coverLetterStore.current?.content?.trim())
  dossierState.value = reconcileGuestDossierFlags(hasLetterContent) ?? loadGuestDossierState()

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
    await refreshEntitlements()
  } catch {
    hasPaidAccess.value = false
  }

  if (hasPaidAccess.value && route.query.file && !authStore.isAuthenticated) {
    await triggerDownload()
    dossierState.value = loadGuestDossierState()
  }
})
</script>

<template>
  <div class="flex flex-col min-h-[calc(100vh-3.25rem)] relative overflow-hidden gradient-mesh pb-28 sm:pb-8">
    <div id="confetti-container" class="absolute inset-0 pointer-events-none overflow-hidden" />

    <div class="relative flex-1 flex flex-col items-center justify-center p-margin-mobile">
      <UiCard variant="glass" padding="lg" class="w-full max-w-2xl text-center animate-zoom-in shadow-lg !p-6 sm:!p-12">
        <div class="text-5xl mb-4 sm:mb-6">🎉</div>
        <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-3 sm:mb-4">Félicitations !</h1>
        <p class="text-base sm:text-lg text-on-surface font-medium mb-2">{{ successHeadline }}</p>
        <p class="text-on-surface-variant text-sm sm:text-base max-w-md mx-auto mb-6">
          {{ dossierComplete ? MSG.guide.successDossierCompleteLead : MSG.guide.successDownloadReady }}
        </p>

        <UiMessageBanner
          v-if="downloadError"
          variant="error"
          :message="downloadError"
          class="mb-4 text-left"
        />

        <div
          v-if="entitlementsSummary"
          class="mb-4 rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-3 text-sm text-on-surface"
        >
          <p class="font-semibold">{{ entitlementsSummary.title }}</p>
          <p v-if="entitlementsSummary.detail" class="text-on-surface-variant mt-0.5">{{ entitlementsSummary.detail }}</p>
          <p v-else-if="entitlements?.canDownloadSnapshot" class="text-on-surface-variant mt-0.5">
            Dossier en cours débloqué — retéléchargements inclus.
          </p>
        </div>

        <div class="mb-6 space-y-3">
          <UiButton
            variant="secondary"
            block
            icon="download"
            :loading="downloading"
            class="min-h-[52px] text-base"
            @click="triggerDownload"
          >
            {{ MSG.guide.successDownloadAgain }}
          </UiButton>
          <p class="text-xs text-on-surface-variant leading-relaxed">
            {{ MSG.guide.successDownloadMobileHint }}
          </p>
          <div class="inline-flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-outline-variant/30 max-w-full w-full justify-center">
            <UiPzIcon name="picture_as_pdf" class="text-error shrink-0" />
            <span class="text-sm text-on-surface font-medium truncate">{{ downloadedFilename }}</span>
          </div>
        </div>

        <UiCard
          v-if="showCrossSell"
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
                <UiButton variant="outline" size="sm" icon="arrow_forward">
                  {{ crossSellCta }}
                </UiButton>
              </NuxtLink>
              <p class="text-xs text-secondary font-semibold mt-2">
                Inclus dans votre offre — aucun paiement supplémentaire.
              </p>
            </div>
          </div>
        </UiCard>

        <UiCard
          v-else-if="dossierComplete && hasPaidAccess"
          variant="default"
          padding="md"
          class="mb-6 text-left !bg-surface-container-low border-outline-variant/30"
        >
          <div class="flex items-start gap-3">
            <UiPzIcon name="check_circle" class="text-secondary text-[28px] shrink-0 mt-0.5" />
            <div>
              <h3 class="font-bold text-on-surface mb-1">{{ MSG.guide.successDossierCompleteTitle }}</h3>
              <p class="text-sm text-on-surface-variant">{{ MSG.guide.successDossierCompleteBody }}</p>
            </div>
          </div>
        </UiCard>

        <div v-if="authStore.isAuthenticated" class="space-y-3">
          <NuxtLink to="/tableau-de-bord" class="block">
            <UiButton block>{{ MSG.guide.successCrossSellDashboard }}</UiButton>
          </NuxtLink>
          <NuxtLink :to="editLink" class="block text-secondary font-semibold hover:underline min-h-11 inline-flex items-center justify-center w-full">
            Continuer à modifier
          </NuxtLink>
        </div>

        <UiCard v-else variant="default" padding="md" class="text-left !bg-surface-container-low">
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
      </UiCard>
    </div>

    <UiStickyActionBar class="sm:hidden">
      <UiButton
        variant="secondary"
        block
        icon="download"
        :loading="downloading"
        class="min-h-[52px]"
        @click="triggerDownload"
      >
        {{ MSG.guide.successDownloadAgain }}
      </UiButton>
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
