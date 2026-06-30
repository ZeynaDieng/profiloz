<script setup lang="ts">
const authStore = useAuthStore()
const route = useRoute()

const adminNav = [
  { to: '/admin', label: 'Vue d’ensemble', icon: 'dashboard', exact: true },
  { to: '/admin/organisations', label: 'Organisations', icon: 'domain', exact: false },
]

function isActive(item: (typeof adminNav)[number]) {
  if (item.exact) return route.path === item.to || route.path === `${item.to}/`
  return route.path.startsWith(item.to)
}
</script>

<template>
  <div class="min-h-screen flex bg-surface-container-low">
    <aside class="hidden md:flex w-60 flex-col border-r border-outline-variant/30 bg-surface-container-lowest p-stack-md">
      <div class="mb-stack-lg px-2">
        <UiAppLogo size="md" />
        <p class="text-xs font-semibold text-secondary mt-2 uppercase tracking-wide">Admin Profilo’Z</p>
      </div>
      <nav class="space-y-1 flex-1">
        <NuxtLink
          v-for="item in adminNav"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-4 py-3 rounded-lg font-label-sm min-h-11"
          :class="isActive(item)
            ? 'bg-secondary-container text-on-secondary-container font-bold'
            : 'text-on-surface-variant hover:bg-surface-container'"
        >
          <UiPzIcon :name="item.icon" :filled="isActive(item)" />
          {{ item.label }}
        </NuxtLink>
      </nav>
      <div class="pt-stack-md border-t border-outline-variant/30 space-y-2">
        <p v-if="authStore.user" class="text-xs text-on-surface-variant px-2 truncate">{{ authStore.user.email }}</p>
        <NuxtLink to="/tableau-de-bord" class="text-sm text-secondary font-semibold px-2 hover:underline">
          ← Retour au tableau de bord
        </NuxtLink>
      </div>
    </aside>

    <main class="flex-1 min-h-screen">
      <header class="md:hidden sticky top-0 z-40 bg-surface/90 backdrop-blur border-b border-outline-variant/30 px-margin-mobile py-3 flex items-center justify-between">
        <UiAppLogo size="sm" />
        <NuxtLink to="/tableau-de-bord" class="text-sm text-secondary font-semibold">Quitter</NuxtLink>
      </header>
      <div class="page-container max-w-6xl mx-auto py-stack-lg">
        <slot />
      </div>
    </main>
  </div>
</template>
