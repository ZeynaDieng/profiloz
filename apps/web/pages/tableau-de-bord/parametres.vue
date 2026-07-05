<script setup lang="ts">
import { MSG } from '@profiloz/shared'

definePageMeta({ layout: 'dashboard' })

const authStore = useAuthStore()
const { confirm } = useConfirm()

onMounted(async () => {
  authStore.loadFromStorage()
  await authStore.refreshProfile()
  if (!authStore.isAuthenticated) navigateTo('/connexion')
})

async function logout() {
  const ok = await confirm(MSG.auth.logoutConfirm, {
    title: MSG.auth.logoutTitle,
    confirmLabel: 'Se déconnecter',
  })
  if (!ok) return
  authStore.logout()
  await navigateTo('/connexion')
}
</script>

<template>
  <div class="page-container max-w-2xl">
    <header class="mb-stack-lg">
      <h1 class="text-2xl sm:text-3xl font-bold text-on-surface">Paramètres</h1>
      <p class="text-on-surface-variant mt-1">Gérez votre compte Profilo'Z.</p>
    </header>

    <div class="space-y-stack-md">
      <UiCard variant="glass" padding="lg">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
            <UiPzIcon name="redeem" />
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="font-bold text-on-surface mb-3">Mon offre</h2>
            <BillingMyOfferPanel />
          </div>
        </div>
      </UiCard>

      <UiCard variant="glass" padding="lg">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
            <UiPzIcon name="person" />
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="font-bold text-on-surface mb-1">Compte</h2>
            <p v-if="authStore.user" class="text-sm text-on-surface-variant mb-4 break-all">{{ authStore.user.email }}</p>
            <UiButton variant="danger" @click="logout">
              Se déconnecter
            </UiButton>
          </div>
        </div>
      </UiCard>

      <UiCard variant="glass" padding="lg">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant shrink-0">
            <UiPzIcon name="tune" />
          </div>
          <div>
            <h2 class="font-bold text-on-surface mb-1">Préférences</h2>
            <p class="text-sm text-on-surface-variant">Langue : Français (fr-FR)</p>
            <p class="text-xs text-on-surface-variant/70 mt-2">D'autres options seront disponibles prochainement.</p>
          </div>
        </div>
      </UiCard>

      <UiCard v-if="authStore.isPlatformAdmin" variant="glass" padding="lg">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
            <UiPzIcon name="admin_panel_settings" />
          </div>
          <div class="flex-1">
            <h2 class="font-bold text-on-surface mb-1">Administration Profilo’Z</h2>
            <p class="text-sm text-on-surface-variant mb-4">
              Gérez les organisations, abonnements Business et membres de la plateforme.
            </p>
            <NuxtLink to="/admin">
              <UiButton variant="secondary" icon="dashboard">Ouvrir le back-office</UiButton>
            </NuxtLink>
          </div>
        </div>
      </UiCard>
    </div>
  </div>
</template>
