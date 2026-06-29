<script setup lang="ts">
import { MSG } from '@profiloz/shared'
import { isGuestPdfReturnPath, resolvePaymentReturnTo } from '~/utils/payment-return'

definePageMeta({ layout: 'default' })

useSeoMeta({ title: "Paiement réussi | Profilo'Z" })

const route = useRoute()
const authStore = useAuthStore()
const paymentService = usePaymentService()
const { ensureSession } = useGuestSession()
const { phase, message, downloadFromReturnPath } = usePostPaymentDownload()

const entitlements = ref<{ creditsBalance: number; unlimitedActive: boolean } | null>(null)
const autoDownloadError = ref('')
const autoDownloadStarted = ref(false)
const returnTo = ref<string | null>(null)

const resumeId = computed(() =>
  typeof route.query.resumeId === 'string' && route.query.resumeId ? route.query.resumeId : null,
)

const isAutoDownloadTarget = computed(
  () => Boolean(returnTo.value && isGuestPdfReturnPath(returnTo.value)),
)

const showManualActions = computed(
  () => !autoDownloadStarted.value || Boolean(autoDownloadError.value) || phase.value === 'idle',
)

onMounted(async () => {
  authStore.loadFromStorage()
  await ensureSession().catch(() => {})

  returnTo.value = resolvePaymentReturnTo(route.query.returnTo)

  if (returnTo.value && isGuestPdfReturnPath(returnTo.value)) {
    autoDownloadStarted.value = true
    try {
      await downloadFromReturnPath(returnTo.value)
      return
    } catch (err) {
      const code = err instanceof Error ? err.message : ''
      autoDownloadError.value =
        code === 'payment-not-confirmed'
          ? 'Votre paiement est en cours de validation. Réessayez le téléchargement dans quelques instants.'
          : MSG.pdf.error
    }
  }

  try {
    const e = await paymentService.getEntitlements()
    entitlements.value = { creditsBalance: e.creditsBalance, unlimitedActive: e.unlimitedActive }
  } catch {
    entitlements.value = null
  }
})

async function retryDownload() {
  if (!returnTo.value) return
  autoDownloadError.value = ''
  autoDownloadStarted.value = true
  try {
    await downloadFromReturnPath(returnTo.value)
  } catch (err) {
    const code = err instanceof Error ? err.message : ''
    autoDownloadError.value =
      code === 'payment-not-confirmed'
        ? 'Votre paiement est en cours de validation. Réessayez le téléchargement dans quelques instants.'
        : MSG.pdf.error
  }
}
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
        {{ autoDownloadError || MSG.payment.confirming }}
      </p>

      <p v-if="entitlements && showManualActions" class="text-sm text-on-surface mb-6">
        <template v-if="entitlements.unlimitedActive">Accès illimité actif.</template>
        <template v-else>Crédits disponibles : <strong>{{ entitlements.creditsBalance }}</strong></template>
      </p>

      <div v-if="showManualActions" class="flex flex-col gap-3">
        <UiButton
          v-if="autoDownloadError && isAutoDownloadTarget"
          variant="secondary"
          block
          icon="download"
          @click="retryDownload"
        >
          {{ MSG.buttons.downloadPdf }}
        </UiButton>
        <NuxtLink v-else-if="resumeId" :to="`/tableau-de-bord/dossiers/${resumeId}`">
          <UiButton variant="secondary" block icon="download">
            Télécharger mon dossier
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
