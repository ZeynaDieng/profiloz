<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'marketing' | 'dashboard' | 'minimal'
    exitTo?: string
  }>(),
  { variant: 'marketing', exitTo: '/' },
)

const authStore = useAuthStore()
const route = useRoute()
const { openMenu } = useMarketingMenuState()
const { toggleDrawer } = useDrawerState()

const isHome = computed(() => route.path === '/')

onMounted(() => {
  authStore.loadFromStorage()
  authStore.syncSession()
})
</script>

<template>
  <header
    class="sticky top-0 z-50 bg-surface/80 backdrop-blur-md shadow-sm border-b border-outline-variant/30"
  >
    <div class="relative flex items-center justify-between gap-3 px-margin-mobile md:px-margin-tablet xl:px-margin-desktop py-2.5 md:py-3 min-h-[3.25rem]">
      <UiAppLogo size="sm" class="shrink-0 [&_img]:h-8 md:[&_img]:h-12" />

      <nav v-if="variant === 'marketing'" class="hidden md:flex items-center gap-stack-lg flex-1 justify-center">
        <a href="#features" class="font-label-sm text-secondary font-semibold border-b-2 border-secondary pb-1">
          Fonctionnalités
        </a>
        <NuxtLink to="/#templates" class="font-label-sm text-on-surface-variant font-medium hover:text-secondary transition-colors">
          Modèles
        </NuxtLink>
        <a
          v-if="isHome"
          href="#tarifs"
          class="font-label-sm text-on-surface-variant font-medium hover:text-secondary transition-colors"
        >
          Tarifs
        </a>
        <NuxtLink
          v-else
          :to="{ path: '/', hash: '#tarifs' }"
          class="font-label-sm text-on-surface-variant font-medium hover:text-secondary transition-colors"
        >
          Tarifs
        </NuxtLink>
        <a href="#faq" class="font-label-sm text-on-surface-variant font-medium hover:text-secondary transition-colors">
          FAQ
        </a>
      </nav>

      <div v-if="variant === 'marketing'" class="flex items-center gap-1 shrink-0">
        <LayoutAuthStatus
          :show-login-link="!authStore.isAuthenticated"
          class="hidden md:flex"
        />
        <NuxtLink
          to="/creer"
          class="hidden md:inline-flex btn-secondary font-label-sm px-6 py-2.5 rounded-xl whitespace-nowrap"
        >
          Créer mon dossier
        </NuxtLink>
        <LayoutAuthStatus
          v-if="authStore.isAuthenticated"
          icon-only
          class="md:hidden"
        />
        <button
          type="button"
          class="md:hidden touch-target inline-flex items-center justify-center rounded-xl text-on-surface hover:bg-surface-container transition-colors"
          aria-label="Menu"
          @click="openMenu($event.currentTarget as HTMLElement)"
        >
          <UiPzIcon name="menu" class="text-[22px]" />
        </button>
      </div>

      <div v-else-if="variant === 'dashboard'" class="flex items-center gap-1 sm:gap-2 shrink-0">
        <BillingEntitlementsSummary compact :show-link="false" class="hidden lg:block max-w-[220px]" />
        <LayoutNotificationBell class="hidden sm:block" />
        <button
          type="button"
          class="md:hidden touch-target inline-flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container"
          aria-label="Menu"
          @click="toggleDrawer($event.currentTarget as HTMLElement)"
        >
          <UiPzIcon name="menu" />
        </button>
        <LayoutAuthStatus icon-only class="sm:hidden" />
        <LayoutAuthStatus compact class="hidden sm:flex" />
        <NuxtLink
          to="/creer"
          class="text-sm font-semibold text-secondary hover:underline min-h-11 inline-flex items-center px-1 sm:px-0"
        >
          <span class="sm:hidden">Nouveau</span>
          <span class="hidden sm:inline">Nouveau dossier</span>
        </NuxtLink>
      </div>

      <div v-else-if="variant === 'minimal'" class="flex items-center gap-1 shrink-0">
        <LayoutAuthStatus icon-only class="sm:hidden" />
        <LayoutAuthStatus compact class="hidden sm:flex" />
        <NuxtLink
          :to="exitTo"
          class="text-on-surface-variant font-label-sm hover:text-primary transition-colors inline-flex items-center gap-1 min-h-11 px-2"
        >
          <UiPzIcon name="close" class="text-[20px]" />
          <span class="hidden sm:inline">Quitter</span>
        </NuxtLink>
      </div>
    </div>
  </header>
</template>
