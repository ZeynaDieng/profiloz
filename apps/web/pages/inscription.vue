<script setup lang="ts">
import { MSG } from '@profiloz/shared'
import { registerSchema } from '@profiloz/validators'
import { parseRegisterError } from '~/utils/api-error'

definePageMeta({ layout: 'auth' })

const route = useRoute()
const authStore = useAuthStore()
const resumeStore = useResumeStore()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const success = ref(false)
const error = ref('')

const redirectTo = computed(() => {
  const target = route.query.redirect
  return typeof target === 'string' && target.startsWith('/') ? target : '/tableau-de-bord'
})

const loginLink = computed(() => ({
  path: '/connexion',
  query: route.query.redirect ? { redirect: route.query.redirect } : {},
}))

async function onSubmit() {
  error.value = ''
  if (password.value !== confirmPassword.value) {
    error.value = MSG.validation.passwordMismatch
    return
  }

  const validation = registerSchema.safeParse({
    email: email.value,
    password: password.value,
  })
  if (!validation.success) {
    error.value = validation.error.errors.map((e) => e.message).join('. ')
    return
  }

  loading.value = true
  try {
    const draft = resumeStore.current
    const resumeSnapshot =
      draft?.personalInfo.fullName ? draft : undefined
    const result = await authStore.register(email.value, password.value, resumeSnapshot)
    success.value = true
    const destination = result.migratedResumeId
      ? `/tableau-de-bord/dossiers/${result.migratedResumeId}`
      : redirectTo.value
    setTimeout(() => navigateTo(destination), 1500)
  } catch (err) {
    error.value = parseRegisterError(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  authStore.loadFromStorage()
  if (authStore.isAuthenticated) {
    navigateTo(redirectTo.value)
  }
})
</script>

<template>
  <UiCard variant="glass" padding="lg" class="shadow-sm w-full max-w-[440px] mx-auto">
    <div v-if="!success" class="">
      <div class="text-center mb-stack-lg">
        <h1 class="text-2xl sm:text-3xl font-bold text-on-surface mb-2">Sauvegardez votre CV</h1>
        <p class="text-on-surface-variant text-sm sm:text-base">30 secondes pour ne rien perdre de votre travail.</p>
      </div>

      <form class="flex flex-col gap-stack-md" @submit.prevent="onSubmit">
        <UiFormField label="E-mail">
          <input
            v-model="email"
            type="email"
            required
            autocomplete="email"
            inputmode="email"
            class="form-input form-input--white w-full"
            placeholder="vous@exemple.com"
          >
        </UiFormField>
        <UiFormField label="Mot de passe">
          <input
            v-model="password"
            type="password"
            required
            minlength="8"
            autocomplete="new-password"
            class="form-input form-input--white w-full"
            placeholder="8 car. min, 1 majuscule, 1 chiffre"
          >
        </UiFormField>
        <UiFormField label="Confirmer le mot de passe">
          <input
            v-model="confirmPassword"
            type="password"
            required
            autocomplete="new-password"
            class="form-input form-input--white w-full"
            placeholder="Répétez le mot de passe"
          >
        </UiFormField>
        <Transition name="form-field__error">
          <UiMessageBanner v-if="error" variant="error" :message="error" />
        </Transition>
        <UiButton type="submit" variant="secondary" block :loading="loading" class="mt-1">
          Créer mon compte
        </UiButton>
        <p class="text-center text-on-surface-variant text-sm">
          Déjà inscrit ?
          <NuxtLink :to="loginLink" class="text-secondary font-semibold hover:underline">Se connecter</NuxtLink>
        </p>
      </form>
    </div>

    <div v-else class="text-center py-stack-lg animate-zoom-in">
      <div class="w-16 h-16 bg-secondary-fixed rounded-full flex items-center justify-center mb-4 mx-auto text-secondary">
        <UiPzIcon name="check_circle" class="text-[32px]" />
      </div>
      <h2 class="text-xl font-bold">{{ MSG.success.accountCreated }}</h2>
      <p class="text-on-surface-variant mt-2">Redirection vers votre tableau de bord...</p>
    </div>
  </UiCard>
</template>
