<script setup lang="ts">
definePageMeta({ layout: 'default' })

useSeoMeta({ title: "Paiement réussi | Profilo'Z" })

const route = useRoute()
const authStore = useAuthStore()
const paymentService = usePaymentService()

const entitlements = ref<{ creditsBalance: number; unlimitedActive: boolean } | null>(null)

// Le crédit est ajouté côté serveur via l'IPN PayTech (asynchrone).
// On rafraîchit l'état des droits après un court délai pour laisser l'IPN arriver.
onMounted(async () => {
  authStore.loadFromStorage()
  if (!authStore.isAuthenticated) return
  await new Promise((r) => setTimeout(r, 1500))
  try {
    const e = await paymentService.getEntitlements()
    entitlements.value = { creditsBalance: e.creditsBalance, unlimitedActive: e.unlimitedActive }
  } catch {
    entitlements.value = null
  }
})

const resumeId = computed(() =>
  typeof route.query.resumeId === 'string' && route.query.resumeId ? route.query.resumeId : null,
)
</script>

<template>
  <div class="max-w-lg mx-auto px-margin-mobile py-20 text-center">
    <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-tertiary-fixed-dim text-on-tertiary-fixed-variant mb-6">
      <UiPzIcon name="check_circle" class="text-[36px]" />
    </div>
    <h1 class="text-2xl font-bold text-on-surface mb-2">Merci pour votre paiement&nbsp;!</h1>
    <p class="text-on-surface-variant mb-6">
      Votre paiement est en cours de confirmation. Vos crédits seront crédités dans quelques instants.
    </p>

    <p v-if="entitlements" class="text-sm text-on-surface mb-6">
      <template v-if="entitlements.unlimitedActive">Accès illimité actif.</template>
      <template v-else>Crédits disponibles : <strong>{{ entitlements.creditsBalance }}</strong></template>
    </p>

    <div class="flex flex-col sm:flex-row gap-3 justify-center">
      <NuxtLink
        v-if="resumeId"
        :to="`/tableau-de-bord/dossiers/${resumeId}`"
        class="inline-flex items-center justify-center min-h-11 px-6 py-2.5 bg-primary text-on-primary rounded-lg font-bold"
      >
        Télécharger mon dossier
      </NuxtLink>
      <NuxtLink
        to="/tableau-de-bord"
        class="inline-flex items-center justify-center min-h-11 px-6 py-2.5 border border-outline-variant rounded-lg font-bold text-on-surface hover:bg-surface-container-low"
      >
        Aller à mes dossiers
      </NuxtLink>
    </div>
  </div>
</template>
