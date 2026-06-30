<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const authStore = useAuthStore()

await authStore.refreshProfile()
</script>

<template>
  <div>
    <AdminPageHeader title="Mon profil" subtitle="Compte administrateur plateforme." />

    <UiCard padding="lg" class="max-w-xl">
      <div class="flex items-center gap-4 mb-6">
        <div class="w-14 h-14 rounded-full bg-secondary/15 text-secondary flex items-center justify-center text-xl font-bold">
          {{ authStore.user?.email?.slice(0, 1).toUpperCase() }}
        </div>
        <div>
          <p class="font-bold text-on-surface">{{ authStore.user?.email }}</p>
          <p class="text-sm text-on-surface-variant">Administrateur plateforme</p>
        </div>
      </div>

      <dl class="space-y-3 text-sm">
        <div class="flex justify-between gap-2"><dt class="text-on-surface-variant">Rôle</dt><dd><AdminStatusBadge status="active" /> Administrateur</dd></div>
        <div class="flex justify-between gap-2"><dt class="text-on-surface-variant">Email</dt><dd>{{ authStore.user?.email }}</dd></div>
      </dl>

      <div class="mt-6 flex flex-wrap gap-2">
        <NuxtLink to="/tableau-de-bord/parametres">
          <UiButton variant="ghost">Paramètres compte utilisateur</UiButton>
        </NuxtLink>
        <NuxtLink to="/tableau-de-bord">
          <UiButton variant="secondary">Tableau de bord client</UiButton>
        </NuxtLink>
      </div>
    </UiCard>
  </div>
</template>
