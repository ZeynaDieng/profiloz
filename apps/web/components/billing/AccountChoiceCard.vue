<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    signupRedirect: string
    recommended?: boolean
    compact?: boolean
    title?: string
    description?: string
    /** Quand true, le bouton compte est secondaire (parcours wallet après paiement). */
    secondaryAccountCta?: boolean
  }>(),
  {
    recommended: true,
    compact: false,
    secondaryAccountCta: false,
  },
)

const emit = defineEmits<{
  continueGuest: []
}>()

const signupHref = computed(() => `/inscription?redirect=${encodeURIComponent(props.signupRedirect)}`)

const cardTitle = computed(() =>
  props.title ?? (props.recommended ? 'Créez un compte gratuit' : 'Sauvegardez votre travail'),
)

const cardDescription = computed(
  () =>
    props.description
    ?? 'Vos documents et votre offre seront associés à votre compte. Retrouvez-les sur tous vos appareils.',
)
</script>

<template>
  <UiCard variant="default" padding="lg" class="text-left !bg-surface-container-low border-outline-variant/30">
    <div v-if="recommended" class="mb-3">
      <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-semibold">
        <UiPzIcon name="star" class="text-[14px]" />
        Recommandé
      </span>
    </div>
    <h3 class="font-bold text-on-surface mb-2">{{ cardTitle }}</h3>
    <p class="text-sm text-on-surface-variant mb-4">{{ cardDescription }}</p>
    <div class="flex flex-col gap-2">
      <NuxtLink :to="signupHref">
        <UiButton
          :variant="secondaryAccountCta ? 'outline' : 'primary'"
          block
          icon="person_add"
        >
          Créer un compte
        </UiButton>
      </NuxtLink>
      <UiButton variant="ghost" block @click="emit('continueGuest')">
        Continuer sans compte
      </UiButton>
    </div>
  </UiCard>
</template>
