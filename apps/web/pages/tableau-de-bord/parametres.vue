<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { MSG } from '@profiloz/shared'

definePageMeta({ layout: 'dashboard' })

const authStore = useAuthStore()
const { confirm } = useConfirm()
const toast = useAppToast()

const autoTourEnabled = ref(true)

onMounted(async () => {
  authStore.loadFromStorage()
  await authStore.refreshProfile()
  if (!authStore.isAuthenticated) navigateTo('/connexion')

  const val = localStorage.getItem('profiloz:settings:auto-onboarding')
  autoTourEnabled.value = val === null ? true : val === 'true'
})

watch(autoTourEnabled, (newVal) => {
  localStorage.setItem('profiloz:settings:auto-onboarding', String(newVal))
})

function resetTour() {
  localStorage.removeItem('profiloz:onboarding-completed')
  toast.success('Le guide interactif a été réinitialisé ! Il s\'affichera à votre prochaine ouverture de l\'éditeur.')
}

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
          <div class="flex-1 space-y-4">
            <h2 class="font-bold text-on-surface">Préférences</h2>
            <div class="space-y-3">
              <label class="flex items-start gap-3 cursor-pointer select-none">
                <input
                  v-model="autoTourEnabled"
                  type="checkbox"
                  class="rounded border-outline-variant text-primary focus:ring-primary mt-1"
                />
                <div class="space-y-0.5">
                  <p class="text-sm font-bold text-on-surface">Lancer le guide automatiquement</p>
                  <p class="text-xs text-on-surface-variant">Active la visite guidée d'aide lors de l'ouverture de l'éditeur de CV.</p>
                </div>
              </label>
            </div>
            <div class="pt-2 border-t border-outline-variant/30">
              <UiButton variant="outline" size="sm" icon="replay" @click="resetTour">
                Réinitialiser la visite guidée
              </UiButton>
            </div>
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
