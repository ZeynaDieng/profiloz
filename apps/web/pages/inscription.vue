<script setup lang="ts">
import { MSG } from '@profiloz/shared'
import { registerSchema } from '@profiloz/validators'
import { parseRegisterError } from '~/utils/api-error'

definePageMeta({ layout: 'auth' })

useSeoPage({
  title: 'Créer un compte',
  description: "Inscrivez-vous sur Profilo'Z pour sauvegarder vos CV.",
  noindex: true,
})

const route = useRoute()
const authStore = useAuthStore()
const resumeStore = useResumeStore()

const email = ref('')
const firstName = ref('')
const lastName = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const success = ref(false)
const { fieldError, formError, clearAll, setFieldError, setFromZod, scrollToFirstError } = useFormValidation()

const redirectTo = computed(() => {
  const target = route.query.redirect
  return typeof target === 'string' && target.startsWith('/') ? target : '/tableau-de-bord'
})

const loginLink = computed(() => ({
  path: '/connexion',
  query: route.query.redirect ? { redirect: route.query.redirect } : {},
}))

async function onSubmit() {
  clearAll()

  if (!firstName.value.trim()) {
    setFieldError('firstName', 'Le prénom est requis')
    formError.value = 'Veuillez remplir tous les champs obligatoires'
    scrollToFirstError()
    return
  }
  if (!lastName.value.trim()) {
    setFieldError('lastName', 'Le nom est requis')
    formError.value = 'Veuillez remplir tous les champs obligatoires'
    scrollToFirstError()
    return
  }

  if (password.value !== confirmPassword.value) {
    setFieldError('confirmPassword', MSG.validation.passwordMismatch)
    formError.value = MSG.validation.passwordMismatch
    scrollToFirstError()
    return
  }

  const validation = registerSchema.safeParse({
    email: email.value,
    password: password.value,
    firstName: firstName.value,
    lastName: lastName.value,
  })
  if (!validation.success) {
    setFromZod(validation.error, MSG.validation.invalidData)
    scrollToFirstError()
    return
  }

  loading.value = true
  try {
    const draft = resumeStore.current
    const resumeSnapshot =
      draft?.personalInfo.fullName ? draft : undefined
    const result = await authStore.register(
      email.value,
      password.value,
      firstName.value,
      lastName.value,
      resumeSnapshot
    )
    success.value = true
    const destination = result.migratedResumeId
      ? `/tableau-de-bord/dossiers/${result.migratedResumeId}`
      : redirectTo.value
    setTimeout(() => navigateTo(destination), 1500)
  } catch (err) {
    formError.value = parseRegisterError(err)
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
        <Transition name="form-field__error">
          <UiMessageBanner
            v-if="formError && !fieldError('email') && !fieldError('password') && !fieldError('confirmPassword') && !fieldError('firstName') && !fieldError('lastName')"
            variant="error"
            :message="formError"
          />
        </Transition>

        <div class="grid grid-cols-2 gap-3">
          <UiFormField label="Prénom" :error="fieldError('firstName')">
            <input
              v-model="firstName"
              type="text"
              autocomplete="given-name"
              class="form-input form-input--white w-full"
              placeholder="Jean"
            >
          </UiFormField>
          <UiFormField label="Nom" :error="fieldError('lastName')">
            <input
              v-model="lastName"
              type="text"
              autocomplete="family-name"
              class="form-input form-input--white w-full"
              placeholder="Dupont"
            >
          </UiFormField>
        </div>

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
            minlength="8"
            autocomplete="new-password"
            class="form-input form-input--white w-full"
            placeholder="8 car. min, 1 majuscule, 1 chiffre"
          >
        </UiFormField>
        <UiFormField label="Confirmer le mot de passe" :error="fieldError('confirmPassword')">
          <input
            v-model="confirmPassword"
            type="password"
            autocomplete="new-password"
            class="form-input form-input--white w-full"
            placeholder="Répétez le mot de passe"
          >
        </UiFormField>
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
