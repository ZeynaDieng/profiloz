<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const authStore = useAuthStore()

onMounted(() => {
  authStore.loadFromStorage()
  if (!authStore.isAuthenticated) navigateTo('/connexion')
})

function logout() {
  authStore.logout()
  navigateTo('/connexion')
}
</script>

<template>
  <div class="p-margin-mobile md:p-margin-desktop max-w-2xl">
    <h1 class="text-2xl font-bold text-on-surface mb-2">Paramètres</h1>
    <p class="text-on-surface-variant mb-stack-lg">Gérez votre compte Profilo'Z.</p>

    <section class="glass-card rounded-xl p-stack-lg border border-outline-variant mb-stack-md">
      <h2 class="font-bold text-on-surface mb-2">Compte</h2>
      <p v-if="authStore.user" class="text-sm text-on-surface-variant mb-4">{{ authStore.user.email }}</p>
      <button type="button" class="px-5 py-2.5 text-error border border-error/20 rounded-lg font-semibold hover:bg-error/5" @click="logout">
        Se déconnecter
      </button>
    </section>

    <section class="glass-card rounded-xl p-stack-lg border border-outline-variant">
      <h2 class="font-bold text-on-surface mb-2">Préférences</h2>
      <p class="text-sm text-on-surface-variant">Langue : Français (fr-FR)</p>
      <p class="text-xs text-on-surface-variant/70 mt-2">D'autres options seront disponibles prochainement.</p>
    </section>
  </div>
</template>
