<script setup lang="ts">
import {
  editorPathFor,
  type EditorDestination,
} from '~/utils/payment-journey'
import { markAccountGateSkipped } from '~/utils/payment-purchase'

definePageMeta({ layout: 'guest-flow' })

useSeoPage({ title: 'Commencer', noindex: true })

const route = useRoute()
const authStore = useAuthStore()

const destination = computed<EditorDestination>(() =>
  route.query.to === 'letter' ? 'letter' : 'cv',
)

const editorTarget = computed(() => editorPathFor(destination.value))

const headline = computed(() =>
  destination.value === 'letter'
    ? 'Créer votre lettre de motivation'
    : 'Créer votre CV',
)

onMounted(() => {
  authStore.loadFromStorage()
  if (authStore.isAuthenticated) {
    void navigateTo(editorTarget.value, { replace: true })
  }
})

function continueWithoutAccount() {
  markAccountGateSkipped()
  void navigateTo(editorTarget.value)
}

const signupRedirect = computed(() => editorTarget.value)
</script>

<template>
  <div class="page-container max-w-lg mx-auto py-10 md:py-16">
    <header class="text-center mb-8">
      <h1 class="text-2xl sm:text-3xl font-bold text-on-surface mb-2">{{ headline }}</h1>
      <p class="text-on-surface-variant text-sm sm:text-base max-w-md mx-auto">
        Votre offre est active. Avant de commencer, souhaitez-vous créer un compte pour sauvegarder votre dossier ?
      </p>
    </header>

    <BillingAccountChoiceCard
      :signup-redirect="signupRedirect"
      @continue-guest="continueWithoutAccount"
    />
  </div>
</template>
