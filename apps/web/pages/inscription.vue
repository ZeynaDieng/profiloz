<script setup lang="ts">
import { registerSchema } from '@profiloz/validators'

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

function parseRegisterError(err: unknown): string {
  if (err && typeof err === 'object') {
    const problem = err as {
      status?: number
      detail?: string
      errors?: Array<{ field: string; message: string }>
    }
    if (problem.errors?.length) {
      return problem.errors.map((e) => e.message).join('. ')
    }
    if (problem.status === 409) {
      return 'Un compte existe déjà avec cet e-mail.'
    }
    if (problem.detail) {
      return problem.detail
    }
  }
  return 'Impossible de créer le compte. Vérifiez vos informations et réessayez.'
}

async function onSubmit() {
  error.value = ''
  if (password.value !== confirmPassword.value) {
    error.value = 'Les mots de passe ne correspondent pas'
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
    await authStore.register(email.value, password.value, resumeSnapshot)
    success.value = true
    setTimeout(() => navigateTo(redirectTo.value), 1500)
  } catch (err) {
    error.value = parseRegisterError(err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-[440px] glass-card rounded-xl p-stack-lg shadow-sm">
    <div class="text-center mb-stack-lg">
      <h1 class="text-2xl font-bold text-on-surface mb-2">Sauvegardez votre CV</h1>
      <p class="text-on-surface-variant">30 secondes pour ne rien perdre de votre travail.</p>
    </div>

    <form v-if="!success" class="flex flex-col gap-stack-md" @submit.prevent="onSubmit">
      <UiFormField label="E-mail">
        <input v-model="email" type="email" required class="form-input form-input--white w-full" placeholder="vous@exemple.com" />
      </UiFormField>
      <UiFormField label="Mot de passe">
        <input v-model="password" type="password" required minlength="8" class="form-input form-input--white w-full" placeholder="8 car. min, 1 majuscule, 1 chiffre" />
      </UiFormField>
      <UiFormField label="Confirmer le mot de passe">
        <input v-model="confirmPassword" type="password" required class="form-input form-input--white w-full" />
      </UiFormField>
      <p v-if="error" class="text-error text-sm">{{ error }}</p>
      <button type="submit" class="w-full bg-primary text-white py-3 rounded-lg font-bold mt-2" :disabled="loading">
        {{ loading ? 'Création...' : 'Créer mon compte' }}
      </button>
      <p class="text-center text-on-surface-variant">
        Déjà inscrit ?
        <NuxtLink :to="loginLink" class="text-secondary font-semibold hover:underline">Se connecter</NuxtLink>
      </p>
    </form>

    <div v-else class="text-center py-stack-lg">
      <div class="w-16 h-16 bg-secondary-fixed rounded-full flex items-center justify-center mb-4 mx-auto text-secondary">
        <UiPzIcon name="check_circle" class="text-[32px]" />
      </div>
      <h2 class="text-xl font-bold">Compte créé</h2>
      <p class="text-on-surface-variant mt-2">Redirection vers votre tableau de bord...</p>
    </div>
  </div>
</template>
