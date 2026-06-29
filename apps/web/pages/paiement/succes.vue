<script setup lang="ts">
import { MSG } from '@profiloz/shared'
import {
  guessGuestPdfReturnPath,
  isGuestPdfReturnPath,
  resolvePaymentRef,
  resolvePaymentReturnTo,
} from '~/utils/payment-return'
import { consumePaymentGuestSession } from '~/utils/payment-draft-backup'
import { alignGuestSessionFromStoredDrafts } from '~/utils/guest-draft-sync'

definePageMeta({ layout: 'default' })

useSeoMeta({ title: "Paiement réussi | Profilo'Z" })

const route = useRoute()
const authStore = useAuthStore()
const paymentService = usePaymentService()
const { ensureSession, applyGuestSessionId } = useGuestSession()
const { phase, message, downloadFromReturnPath } = usePostPaymentDownload()

const entitlements = ref<{ creditsBalance: number; unlimitedActive: boolean } | null>(null)
const autoDownloadError = ref('')
const autoDownloadStarted = ref(false)
const returnTo = ref<string | null>(null)
const paymentRef = ref<string | null>(null)

const resumeId = computed(() =>
  typeof route.query.resumeId === 'string' && route.query.resumeId ? route.query.resumeId : null,
)

const canAutoDownload = computed(() => Boolean(paymentRef.value || returnTo.value))

const showManualActions = computed(
  () => !autoDownloadStarted.value || Boolean(autoDownloadError.value) || phase.value === 'idle',
)

async function runAutoDownload() {
  if (!returnTo.value) {
    returnTo.value = guessGuestPdfReturnPath()
  }
  if (!isGuestPdfReturnPath(returnTo.value)) return

  autoDownloadStarted.value = true
  autoDownloadError.value = ''
  try {
    await downloadFromReturnPath(returnTo.value, paymentRef.value)
  } catch (err) {
    const problem = err as { status?: number; detail?: string }
    const code = err instanceof Error ? err.message : ''
    autoDownloadError.value =
      problem.detail ||
      (code === 'payment-not-confirmed'
        ? 'Votre paiement est validé côté PayTech mais les crédits mettent du temps à arriver. Réessayez dans quelques secondes.'
        : code === 'missing-resume' || code === 'missing-letter'
          ? 'Votre brouillon est introuvable sur cet appareil. Rouvrez votre CV depuis le même navigateur (profiloz.com), sans vider l’historique, puis cliquez à nouveau sur Télécharger — ne repayez pas.'
          : MSG.pdf.error)
  }
}

onMounted(async () => {
  authStore.loadFromStorage()

  const gs = route.query.gs
  if (typeof gs === 'string' && gs.trim()) {
    applyGuestSessionId(gs.trim())
  } else {
    const storedGuest = consumePaymentGuestSession()
    if (storedGuest) applyGuestSessionId(storedGuest)
    else alignGuestSessionFromStoredDrafts()
  }

  await ensureSession().catch(() => {})

  paymentRef.value = resolvePaymentRef(route.query.ref)
  returnTo.value = resolvePaymentReturnTo(route.query.returnTo)

  if (paymentRef.value || returnTo.value) {
    await runAutoDownload()
    if (!autoDownloadError.value) return
  }

  try {
    const e = await paymentService.getEntitlements()
    entitlements.value = { creditsBalance: e.creditsBalance, unlimitedActive: e.unlimitedActive }
  } catch {
    entitlements.value = null
  }
})
</script>

<template>
  <div class="page-container max-w-lg mx-auto py-12 md:py-20 text-center">
    <div
      v-if="autoDownloadStarted && !autoDownloadError && phase !== 'idle'"
      class="space-y-6"
    >
      <UiSkeleton variant="circle" width="4rem" height="4rem" class="mx-auto" />
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-on-surface mb-2">{{ MSG.payment.success }}</h1>
        <p class="text-on-surface-variant text-sm sm:text-base">{{ message || MSG.payment.confirming }}</p>
      </div>
    </div>

    <template v-else>
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-tertiary-fixed-dim text-on-tertiary-fixed-variant mb-6">
        <UiPzIcon name="check_circle" class="text-[36px]" />
      </div>
      <h1 class="text-2xl sm:text-3xl font-bold text-on-surface mb-2">{{ MSG.payment.success }}</h1>
      <p class="text-on-surface-variant mb-6 text-sm sm:text-base">
        {{ autoDownloadError || 'Votre paiement est enregistré. Téléchargez votre document ci-dessous.' }}
      </p>

      <p v-if="entitlements && showManualActions" class="text-sm text-on-surface mb-6">
        <template v-if="entitlements.unlimitedActive">Accès illimité actif.</template>
        <template v-else-if="entitlements.creditsBalance > 0">
          Crédits disponibles : <strong>{{ entitlements.creditsBalance }}</strong>
        </template>
      </p>

      <div v-if="showManualActions" class="flex flex-col gap-3">
        <UiButton
          v-if="canAutoDownload || entitlements?.creditsBalance"
          variant="secondary"
          block
          icon="download"
          @click="runAutoDownload"
        >
          {{ MSG.buttons.downloadPdf }}
        </UiButton>
        <NuxtLink v-else-if="resumeId" :to="`/tableau-de-bord/dossiers/${resumeId}`">
          <UiButton variant="secondary" block icon="download">
            Télécharger mon dossier
          </UiButton>
        </NuxtLink>
        <NuxtLink v-else to="/creer/editeur">
          <UiButton variant="outline" block>
            Retour à mon CV
          </UiButton>
        </NuxtLink>
        <NuxtLink v-if="authStore.isAuthenticated" to="/tableau-de-bord">
          <UiButton variant="outline" block>
            Aller à mes dossiers
          </UiButton>
        </NuxtLink>
      </div>
    </template>
  </div>
</template>
