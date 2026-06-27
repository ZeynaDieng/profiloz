<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'marketing' | 'dashboard' | 'minimal'
    exitTo?: string
  }>(),
  { variant: 'marketing', exitTo: '/' },
)

const route = useRoute()
const authStore = useAuthStore()
const mobileMenuOpen = ref(false)

const marketingLinks = [
  { href: '#features', label: 'Fonctionnalités' },
  { href: '/#templates', label: 'Modèles', isRoute: true },
  { href: '/tarifs', label: 'Tarifs', isRoute: true },
  { href: '#faq', label: 'FAQ' },
]

onMounted(() => {
  authStore.loadFromStorage()
  authStore.syncSession()
})

watch(
  () => route.path,
  () => {
    mobileMenuOpen.value = false
  },
)

function closeMobileMenu() {
  mobileMenuOpen.value = false
}
</script>

<template>
  <header
    class="sticky top-0 z-50 bg-surface/80 backdrop-blur-md shadow-sm border-b border-outline-variant/30"
  >
    <div class="relative flex items-center justify-between gap-3 px-margin-mobile md:px-margin-desktop py-2.5 md:py-3 min-h-[3.25rem]">
      <UiAppLogo size="sm" class="shrink-0 [&_img]:h-8 md:[&_img]:h-12" />

      <nav v-if="variant === 'marketing'" class="hidden md:flex items-center gap-stack-lg flex-1 justify-center">
        <a href="#features" class="font-label-sm text-secondary font-semibold border-b-2 border-secondary pb-1">
          Fonctionnalités
        </a>
        <NuxtLink to="/#templates" class="font-label-sm text-on-surface-variant font-medium hover:text-secondary transition-colors">
          Modèles
        </NuxtLink>
        <NuxtLink to="/tarifs" class="font-label-sm text-on-surface-variant font-medium hover:text-secondary transition-colors">
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
          class="hidden md:inline-flex bg-primary text-on-primary font-label-sm px-6 py-2.5 rounded-lg font-bold hover:bg-on-surface-variant transition-all whitespace-nowrap min-h-11 items-center"
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
          class="md:hidden min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg text-on-surface hover:bg-surface-container transition-colors"
          :aria-expanded="mobileMenuOpen"
          aria-controls="marketing-mobile-menu"
          aria-label="Menu"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <UiPzIcon :name="mobileMenuOpen ? 'close' : 'menu'" class="text-[22px]" />
        </button>
      </div>

      <div v-else-if="variant === 'dashboard'" class="flex items-center gap-1 sm:gap-2 shrink-0">
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

    <nav
      v-if="variant === 'marketing' && mobileMenuOpen"
      id="marketing-mobile-menu"
      class="md:hidden border-t border-outline-variant/30 bg-surface px-margin-mobile py-4 space-y-1"
    >
      <template v-for="link in marketingLinks" :key="link.href">
        <NuxtLink
          v-if="link.isRoute"
          :to="link.href"
          class="flex items-center min-h-11 px-3 rounded-lg text-on-surface font-medium hover:bg-surface-container"
          @click="closeMobileMenu"
        >
          {{ link.label }}
        </NuxtLink>
        <a
          v-else
          :href="link.href"
          class="flex items-center min-h-11 px-3 rounded-lg text-on-surface font-medium hover:bg-surface-container"
          @click="closeMobileMenu"
        >
          {{ link.label }}
        </a>
      </template>

      <div class="pt-3 px-3">
        <NuxtLink
          to="/creer"
          class="flex items-center justify-center min-h-11 w-full bg-primary text-on-primary rounded-lg font-bold text-sm"
          @click="closeMobileMenu"
        >
          Créer mon dossier
        </NuxtLink>
      </div>

      <div v-if="!authStore.isAuthenticated" class="pt-3 mt-1 border-t border-outline-variant/30 px-3 space-y-2">
        <LayoutAuthStatus />
      </div>
    </nav>
  </header>
</template>
