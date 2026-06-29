<script setup lang="ts">
import { MSG } from '@profiloz/shared'

definePageMeta({ layout: 'default' })

useSeoMeta({ title: "Paiement réussi | Profilo'Z" })

const route = useRoute()
const authStore = useAuthStore()
const paymentService = usePaymentService()
const { ensureSession } = useGuestSession()

const entitlements = ref<{ creditsBalance: number; unlimitedActive: boolean } | null>(null)

const resumeId = computed(() =>
  typeof route.query.resumeId === 'string' && route.query.resumeId ? route.query.resumeId : null,
)

const returnTo = computed(() => {
  const raw = route.query.returnTo
  if (typeof raw !== 'string' || !raw.startsWith('/')) return null
  return raw
})

const continueDownloadLink = computed(() => {
  if (!returnTo.value) return null
  const url = new URL(returnTo.value, 'http://local')
  url.searchParams.set('download', '1')
  return `${url.pathname}${url.search}`
})

onMounted(async () => {
  authStore.loadFromStorage()
  await ensureSession().catch(() => {})
  await new Promise((r) => setTimeout(r, 1500))
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
    <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-tertiary-fixed-dim text-on-tertiary-fixed-variant mb-6">
      <UiPzIcon name="check_circle" class="text-[36px]" />
    </div>
    <h1 class="text-2xl sm:text-3xl font-bold text-on-surface mb-2">{{ MSG.payment.success }}</h1>
    <p class="text-on-surface-variant mb-6 text-sm sm:text-base">
      {{ MSG.payment.confirming }}
    </p>

    <p v-if="entitlements" class="text-sm text-on-surface mb-6">
      <template v-if="entitlements.unlimitedActive">Accès illimité actif.</template>
      <template v-else>Crédits disponibles : <strong>{{ entitlements.creditsBalance }}</strong></template>
    </p>

    <div class="flex flex-col gap-3">
      <NuxtLink v-if="continueDownloadLink" :to="continueDownloadLink">
        <UiButton variant="secondary" block icon="download">
          {{ MSG.buttons.downloadPdf }}
        </UiButton>
      </NuxtLink>
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
      <NuxtLink v-else to="/creer/editeur">
        <UiButton variant="outline" block>
          Retour à mon CV
        </UiButton>
      </NuxtLink>
    </div>
  </div>
</template>
