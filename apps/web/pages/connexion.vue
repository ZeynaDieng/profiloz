<script setup lang="ts">
import { loginSchema } from '@profiloz/validators'
import { parseApiAuthError } from '~/utils/api-error'

definePageMeta({ layout: 'auth' })

const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const redirectTo = computed(() => {
  const target = route.query.redirect
  return typeof target === 'string' && target.startsWith('/') ? target : '/tableau-de-bord'
})

const signupLink = computed(() => ({
  path: '/inscription',
  query: route.query.redirect ? { redirect: route.query.redirect } : {},
}))

async function onSubmit() {
  error.value = ''
  const validation = loginSchema.safeParse({
    email: email.value,
    password: password.value,
  })
  if (!validation.success) {
    error.value = validation.error.errors[0]?.message ?? 'Données invalides'
    return
  }

  loading.value = true
  try {
    await authStore.login(validation.data.email, validation.data.password)
    await navigateTo(redirectTo.value)
  } catch (err) {
    error.value = parseApiAuthError(err, 'Identifiants incorrects.')
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
  <div class="max-w-md w-full glass-card rounded-xl p-stack-lg shadow-sm">
    <div class="text-center mb-stack-lg">
      <h1 class="text-2xl font-bold text-on-surface mb-2">Bon retour</h1>
      <p class="text-on-surface-variant">Retrouvez vos CV et reprenez où vous en étiez.</p>
    </div>
    <form class="flex flex-col gap-stack-md" @submit.prevent="onSubmit">
      <UiFormField label="E-mail">
        <input v-model="email" type="email" required class="form-input form-input--white w-full" />
      </UiFormField>
      <UiFormField label="Mot de passe">
        <input v-model="password" type="password" required class="form-input form-input--white w-full" />
      </UiFormField>
      <p v-if="error" class="text-error text-sm">{{ error }}</p>
      <button type="submit" class="w-full bg-primary text-white py-3 rounded-lg font-bold mt-2" :disabled="loading">
        {{ loading ? 'Connexion...' : 'Se connecter' }}
      </button>
      <p class="text-center text-on-surface-variant text-sm">
        Pas encore de compte ?
        <NuxtLink :to="signupLink" class="text-secondary font-semibold hover:underline">Créer un compte</NuxtLink>
      </p>
      <p class="text-center">
        <NuxtLink to="/creer" class="text-sm text-on-surface-variant hover:text-secondary">Continuer sans compte →</NuxtLink>
      </p>
    </form>
  </div>
</template>
