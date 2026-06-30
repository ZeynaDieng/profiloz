<script setup lang="ts">
import { ADMIN_NAV_ITEMS } from '@profiloz/shared'

const authStore = useAuthStore()
const route = useRoute()
const colorMode = useColorMode()

const mobileNavOpen = ref(false)

function isActive(item: (typeof ADMIN_NAV_ITEMS)[number]) {
  if (item.exact) return route.path === item.to || route.path === `${item.to}/`
  return route.path.startsWith(item.to)
}

function toggleTheme() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <div class="min-h-screen flex bg-surface-container-low">
    <div
      v-if="mobileNavOpen"
      class="fixed inset-0 z-40 bg-black/40 md:hidden"
      @click="mobileNavOpen = false"
    />

    <aside
      class="fixed md:sticky top-0 z-50 h-screen w-72 flex-col border-r border-outline-variant/30 bg-surface-container-lowest transition-transform md:translate-x-0 md:flex"
      :class="mobileNavOpen ? 'flex translate-x-0' : '-translate-x-full md:translate-x-0'"
    >
      <div class="p-stack-md border-b border-outline-variant/20">
        <UiAppLogo size="md" />
        <p class="text-xs font-semibold text-secondary mt-2 uppercase tracking-wide">Admin Profilo’Z</p>
      </div>

      <nav class="flex-1 overflow-y-auto p-3 space-y-0.5">
        <NuxtLink
          v-for="item in ADMIN_NAV_ITEMS"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium min-h-10"
          :class="isActive(item)
            ? 'bg-secondary-container text-on-secondary-container font-bold'
            : 'text-on-surface-variant hover:bg-surface-container'"
          @click="mobileNavOpen = false"
        >
          <UiPzIcon :name="item.icon" :filled="isActive(item)" class="text-lg" />
          <span class="truncate">{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <div class="p-stack-md border-t border-outline-variant/20 space-y-2">
        <p v-if="authStore.user" class="text-xs text-on-surface-variant truncate">{{ authStore.user.email }}</p>
        <NuxtLink to="/tableau-de-bord" class="text-sm text-secondary font-semibold hover:underline">
          ← Retour au tableau de bord
        </NuxtLink>
      </div>
    </aside>

    <div class="flex-1 min-w-0 flex flex-col min-h-screen">
      <header class="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-outline-variant/30 px-4 md:px-6 py-3">
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="md:hidden w-10 h-10 rounded-lg hover:bg-surface-container flex items-center justify-center"
            aria-label="Menu"
            @click="mobileNavOpen = true"
          >
            <UiPzIcon name="menu" />
          </button>
          <AdminGlobalSearch class="flex-1" />
          <button
            type="button"
            class="w-10 h-10 rounded-lg hover:bg-surface-container flex items-center justify-center shrink-0"
            :aria-label="colorMode.value === 'dark' ? 'Mode clair' : 'Mode sombre'"
            @click="toggleTheme"
          >
            <UiPzIcon :name="colorMode.value === 'dark' ? 'light_mode' : 'dark_mode'" />
          </button>
        </div>
      </header>

      <main class="flex-1 px-4 md:px-6 py-stack-lg max-w-[1400px] w-full mx-auto">
        <slot />
      </main>
    </div>
  </div>
</template>
