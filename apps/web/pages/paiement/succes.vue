<script setup lang="ts">
import { MSG } from '@profiloz/shared'
import type { Entitlements, PurchasedPlanSummary } from '~/services/payment.service'
import {
  guessGuestPdfReturnPath,
  isGuestPdfReturnPath,
  isLetterReturnPath,
  resolvePaymentRef,
  resolvePaymentReturnTo,
} from '~/utils/payment-return'
import {
  consumePaymentGuestSession,
  loadPaymentDraftBackup,
  peekPaymentGuestSession,
} from '~/utils/payment-draft-backup'
import { initGuestDossier, restorePaidGuestSession } from '~/utils/guest-dossier-state'
import { alignGuestSessionFromStoredDrafts } from '~/utils/guest-draft-sync'
import { hasDossierDownloadAccess } from '~/utils/dossier-access'
import {
  accountGatePath,
  classifyPurchaseAudience,
  editorPathFor,
  isSingleDossierService,
  isWalletOffer,
  type PurchaseAudience,
} from '~/utils/payment-journey'
import { hasSkippedAccountGate, saveLastPurchasedPlan } from '~/utils/payment-purchase'

definePageMeta({ layout: 'guest-flow' })

useSeoMeta({ title: "Paiement réussi | Profilo'Z" })

const route = useRoute()
const authStore = useAuthStore()
const paymentService = usePaymentService()
const { ensureSession, applyGuestSessionId } = useGuestSession()
const { phase, message, downloadFromReturnPath } = usePostPaymentDownload()

const entitlements = ref<Entitlements | null>(null)
const purchasedPlan = ref<PurchasedPlanSummary | null>(null)
const autoDownloadError = ref('')
const autoDownloadStarted = ref(false)
const returnTo = ref<string | null>(null)
const paymentRef = ref<string | null>(null)
const confirming = ref(true)

const resumeId = computed(() =>
  typeof route.query.resumeId === 'string' && route.query.resumeId ? route.query.resumeId : null,
)

const hasEditorReturn = computed(() => {
  const path = returnTo.value
  return Boolean(path && isGuestPdfReturnPath(path))
})

/** Achat depuis la landing ou /tarifs sans CV/lettre en cours. */
const isCatalogCheckout = computed(() => Boolean(purchasedPlan.value && !hasEditorReturn.value))

const purchaseAudience = computed<PurchaseAudience>(() =>
  classifyPurchaseAudience(purchasedPlan.value),
)

const isSingleDossierCatalog = computed(
  () => isCatalogCheckout.value && isSingleDossierService(purchaseAudience.value),
)

const isWalletCatalog = computed(
  () => isCatalogCheckout.value && isWalletOffer(purchaseAudience.value),
)

const canAutoDownload = computed(() => hasEditorReturn.value)

const showManualActions = computed(
  () => !confirming.value && (!autoDownloadStarted.value || Boolean(autoDownloadError.value) || phase.value === 'idle'),
)

const dashboardHref = computed(() =>
  isWalletCatalog.value ? '/tableau-de-bord?welcome=1' : '/tableau-de-bord',
)

const signupRedirect = computed(() => dashboardHref.value)

function editorHref(destination: 'cv' | 'letter') {
  if (authStore.isAuthenticated || hasSkippedAccountGate()) {
    return editorPathFor(destination)
  }
  return accountGatePath(destination)
}

async function applyConfirmResult(result: Awaited<ReturnType<typeof paymentService.confirmReturn>>) {
  if (result.entitlements) entitlements.value = result.entitlements
  if (result.purchasedPlan) {
    purchasedPlan.value = result.purchasedPlan
    saveLastPurchasedPlan(result.purchasedPlan)
  }
  if (result.guestSessionClientId) {
    applyGuestSessionId(result.guestSessionClientId)
    const backup = loadPaymentDraftBackup()
    const origin =
      backup?.returnTo && isLetterReturnPath(backup.returnTo)
        ? 'letter'
        : backup?.kind === 'letter'
          ? 'letter'
          : 'cv'
    initGuestDossier(result.guestSessionClientId, origin, { freshPayment: true })
  }
}

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
          ? "Votre brouillon est introuvable sur cet appareil. Rouvrez votre CV depuis le même navigateur, sans vider l'historique, puis cliquez à nouveau sur Télécharger — ne repayez pas."
          : MSG.pdf.error)
  }
}

onMounted(async () => {
  const gsFromQuery = typeof route.query.gs === 'string' ? route.query.gs.trim() : ''
  const gsFromBackup = peekPaymentGuestSession()
  const hasPaymentContext = Boolean(route.query.ref || gsFromQuery || gsFromBackup)

  authStore.loadFromStorage()

  if (gsFromQuery) {
    applyGuestSessionId(gsFromQuery)
  } else if (gsFromBackup) {
    applyGuestSessionId(consumePaymentGuestSession() ?? gsFromBackup)
  } else {
    restorePaidGuestSession()
  }

  if (!gsFromQuery && !gsFromBackup && !hasPaymentContext) {
    alignGuestSessionFromStoredDrafts()
  }

  paymentRef.value = resolvePaymentRef(route.query.ref)
  returnTo.value = resolvePaymentReturnTo(route.query.returnTo)

  try {
    if (paymentRef.value) {
      const result = await paymentService.confirmReturn(paymentRef.value)
      await applyConfirmResult(result)
    }
  } catch {
    // confirmReturn peut échouer si IPN déjà passé — on recharge les droits ci-dessous
  }

  await ensureSession().catch(() => {})
  confirming.value = false

  if (!entitlements.value) {
    try {
      entitlements.value = await paymentService.getEntitlements()
    } catch {
      entitlements.value = null
    }
  }

  if (
    entitlements.value
    && hasDossierDownloadAccess(entitlements.value)
    && autoDownloadError.value.includes('crédits mettent du temps')
  ) {
    autoDownloadError.value = ''
  }

  if (canAutoDownload.value) {
    await runAutoDownload()
  }
})
</script>

<template>
  <div class="page-container max-w-xl mx-auto py-8 md:py-12 pb-28">
    <div
      v-if="confirming || (autoDownloadStarted && !autoDownloadError && phase !== 'idle')"
      class="space-y-6 text-center"
    >
      <UiSkeleton variant="circle" width="4rem" height="4rem" class="mx-auto" />
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-on-surface mb-2">{{ MSG.payment.success }}</h1>
        <p class="text-on-surface-variant text-sm sm:text-base">
          {{ message || 'Activation de votre offre en cours…' }}
        </p>
      </div>
    </div>

    <template v-else>
      <header class="text-center mb-6">
        <div
          class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-tertiary-fixed-dim text-on-tertiary-fixed-variant mb-4"
        >
          <UiPzIcon name="check_circle" class="text-[36px]" />
        </div>
        <h1 class="text-2xl sm:text-3xl font-bold text-on-surface mb-2">{{ MSG.payment.success }}</h1>
        <p class="text-on-surface-variant text-sm sm:text-base max-w-md mx-auto">
          <!-- Parcours 1 : landing, dossier unique -->
          <template v-if="isSingleDossierCatalog">
            Votre offre est maintenant active. Vous pouvez commencer à créer votre CV et votre lettre de motivation.
          </template>
          <!-- Parcours 2 : landing, crédits / abonnement -->
          <template v-else-if="isWalletCatalog">
            <template v-if="entitlements?.unlimitedActive">
              Votre abonnement est actif. Créez un compte pour retrouver vos droits sur tous vos appareils.
            </template>
            <template v-else-if="entitlements && entitlements.creditsBalance > 0">
              Vous disposez maintenant de {{ entitlements.creditsBalance }} crédit{{ entitlements.creditsBalance > 1 ? 's' : '' }}.
              Créez un compte pour les conserver en sécurité.
            </template>
            <template v-else>
              Votre offre est active. Créez un compte pour accéder à votre espace personnel.
            </template>
          </template>
          <!-- Parcours 3 : éditeur (fallback si auto-download échoue) -->
          <template v-else>
            {{ autoDownloadError || 'Votre offre est activée. Téléchargez votre document ci-dessous.' }}
          </template>
        </p>
      </header>

      <!-- Carte offre : variante selon intention -->
      <BillingPurchasedPlanCard
        v-if="purchasedPlan && isCatalogCheckout"
        :plan="purchasedPlan"
        :entitlements="entitlements"
        :variant="isSingleDossierCatalog ? 'service' : 'wallet'"
        class="mb-6"
      />

      <BillingEntitlementsSummary
        v-else-if="entitlements && !isSingleDossierCatalog"
        :entitlements="entitlements"
        :show-link="false"
        class="mb-6"
      />

      <UiMessageBanner
        v-if="autoDownloadError"
        variant="error"
        :message="autoDownloadError"
        class="mb-6 text-left"
      />

      <!-- Actions : parcours landing dossier unique -->
      <div v-if="showManualActions && isSingleDossierCatalog" class="flex flex-col gap-3">
        <NuxtLink :to="editorHref('cv')">
          <UiButton variant="secondary" block icon="edit_note" class="min-h-[52px]">
            Créer mon CV
          </UiButton>
        </NuxtLink>
        <NuxtLink :to="editorHref('letter')">
          <UiButton variant="outline" block icon="mail">
            Créer ma lettre de motivation
          </UiButton>
        </NuxtLink>
        <p class="text-xs text-center text-on-surface-variant px-2">
          Votre dossier (CV + lettre) est inclus — aucun crédit supplémentaire requis.
        </p>
      </div>

      <!-- Actions : parcours landing crédits / abonnement -->
      <div v-else-if="showManualActions && isWalletCatalog" class="flex flex-col gap-3">
        <template v-if="authStore.isAuthenticated">
          <NuxtLink :to="dashboardHref">
            <UiButton variant="secondary" block icon="dashboard" class="min-h-[52px]">
              Aller au tableau de bord
            </UiButton>
          </NuxtLink>
          <NuxtLink to="/creer">
            <UiButton variant="outline" block icon="edit_note">
              Créer mon CV
            </UiButton>
          </NuxtLink>
        </template>
        <template v-else>
          <NuxtLink :to="`/inscription?redirect=${encodeURIComponent(signupRedirect)}`">
            <UiButton variant="secondary" block icon="person_add" class="min-h-[52px]">
              Créer mon compte
            </UiButton>
          </NuxtLink>
          <p class="text-xs text-center text-on-surface-variant px-2">
            Recommandé — vos crédits et votre abonnement seront sauvegardés dans votre espace personnel.
          </p>
          <NuxtLink to="/creer">
            <UiButton variant="ghost" block icon="edit_note">
              Créer mon CV sans compte
            </UiButton>
          </NuxtLink>
        </template>
      </div>

      <!-- Actions : parcours éditeur (fallback manuel) -->
      <div v-else-if="showManualActions" class="flex flex-col gap-3">
        <UiButton
          v-if="canAutoDownload || entitlements?.creditsBalance || entitlements?.canDownloadSnapshot"
          variant="secondary"
          block
          icon="download"
          class="min-h-[52px]"
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
          <UiButton variant="ghost" block icon="dashboard">
            Aller au tableau de bord
          </UiButton>
        </NuxtLink>
      </div>
    </template>

    <UiStickyActionBar
      v-if="showManualActions && !confirming && isSingleDossierCatalog"
      class="sm:hidden"
    >
      <NuxtLink :to="editorHref('cv')" class="block">
        <UiButton variant="secondary" block icon="edit_note" class="min-h-[52px]">
          Créer mon CV
        </UiButton>
      </NuxtLink>
    </UiStickyActionBar>

    <UiStickyActionBar
      v-else-if="showManualActions && !confirming && isWalletCatalog && !authStore.isAuthenticated"
      class="sm:hidden"
    >
      <NuxtLink :to="`/inscription?redirect=${encodeURIComponent(signupRedirect)}`" class="block">
        <UiButton variant="secondary" block icon="person_add" class="min-h-[52px]">
          Créer mon compte
        </UiButton>
      </NuxtLink>
    </UiStickyActionBar>

    <UiStickyActionBar
      v-else-if="showManualActions && !confirming && canAutoDownload"
      class="sm:hidden"
    >
      <UiButton
        variant="secondary"
        block
        icon="download"
        class="min-h-[52px]"
        @click="runAutoDownload"
      >
        {{ MSG.buttons.downloadPdf }}
      </UiButton>
    </UiStickyActionBar>
  </div>
</template>
