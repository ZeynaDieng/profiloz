<script setup lang="ts">
import { MSG } from '@profiloz/shared'
import { loginSchema } from '@profiloz/validators'
import { parseApiAuthError } from '~/utils/api-error'

definePageMeta({ layout: 'auth' })

const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const { fieldError, formError, clearAll, setFromZod, scrollToFirstError } = useFormValidation()

const redirectTo = computed(() => {
  const target = route.query.redirect
  return typeof target === 'string' && target.startsWith('/') ? target : '/tableau-de-bord'
})

const signupLink = computed(() => ({
  path: '/inscription',
  query: route.query.redirect ? { redirect: route.query.redirect } : {},
}))

async function onSubmit() {
  clearAll()
  const validation = loginSchema.safeParse({
    email: email.value,
    password: password.value,
  })
  if (!validation.success) {
    setFromZod(validation.error, MSG.validation.invalidData)
    scrollToFirstError()
    return
  }

  loading.value = true
  try {
    await authStore.login(validation.data.email, validation.data.password)
    await navigateTo(redirectTo.value)
  } catch (err) {
    formError.value = parseApiAuthError(err, MSG.auth.loginError)
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
  <UiCard variant="glass" padding="lg" class="shadow-sm">
    <div class="text-center mb-stack-lg">
      <h1 class="text-2xl sm:text-3xl font-bold text-on-surface mb-2">Bon retour</h1>
      <p class="text-on-surface-variant text-sm sm:text-base">Retrouvez vos CV et reprenez où vous en étiez.</p>
    </div>
    <form class="flex flex-col gap-stack-md" @submit.prevent="onSubmit">
      <Transition name="form-field__error">
        <UiMessageBanner
          v-if="formError && !fieldError('email') && !fieldError('password')"
          variant="error"
          :message="formError"
        />
      </Transition>
      <UiFormField label="E-mail" :error="fieldError('email')">
        <input
          v-model="email"
          type="email"
          autocomplete="email"
          inputmode="email"
          class="form-input form-input--white w-full"
          placeholder="vous@exemple.com"
        >
      </UiFormField>
      <UiFormField label="Mot de passe" :error="fieldError('password')">
        <input
          v-model="password"
          type="password"
          autocomplete="current-password"
          class="form-input form-input--white w-full"
          placeholder="Votre mot de passe"
        >
      </UiFormField>
      <UiButton type="submit" block :loading="loading" class="mt-1">
        Se connecter
      </UiButton>
      <p class="text-center text-on-surface-variant text-sm">
        Pas encore de compte ?
        <NuxtLink :to="signupLink" class="text-secondary font-semibold hover:underline">Créer un compte</NuxtLink>
      </p>
      <p class="text-center pt-1">
        <NuxtLink to="/creer" class="text-sm text-on-surface-variant hover:text-secondary inline-flex items-center gap-1 min-h-11">
          Continuer sans compte
          <UiPzIcon name="arrow_forward" class="text-base" />
        </NuxtLink>
      </p>
    </form>
  </UiCard>
</template>
