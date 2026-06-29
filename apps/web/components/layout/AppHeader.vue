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
const { toggleDrawer } = useDrawerState()

const marketingLinks = [
  { href: '#features', label: 'Fonctionnalités', icon: 'auto_awesome' },
  { href: '/#templates', label: 'Modèles', icon: 'description', isRoute: true },
  { href: '/tarifs', label: 'Tarifs', icon: 'payments', isRoute: true },
  { href: '#faq', label: 'FAQ', icon: 'help' },
] as const

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
    <div class="relative flex items-center justify-between gap-3 px-margin-mobile md:px-margin-tablet xl:px-margin-desktop py-2.5 md:py-3 min-h-[3.25rem]">
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
          class="hidden md:inline-flex bg-primary text-on-primary font-label-sm px-6 py-2.5 rounded-xl font-bold hover:bg-on-surface-variant transition-all whitespace-nowrap min-h-11 items-center"
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
          :aria-expanded="mobileMenuOpen"
          aria-label="Menu"
          @click="mobileMenuOpen = true"
        >
          <UiPzIcon name="menu" class="text-[22px]" />
        </button>
      </div>

      <div v-else-if="variant === 'dashboard'" class="flex items-center gap-1 sm:gap-2 shrink-0">
        <button
          type="button"
          class="md:hidden touch-target inline-flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container"
          aria-label="Menu"
          @click="toggleDrawer"
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

    <!-- Marketing : drawer navigation mobile -->
    <UDrawer
      v-if="variant === 'marketing'"
      v-model:open="mobileMenuOpen"
      direction="left"
      :handle="false"
      :ui="{
        content: 'mobile-drawer-panel w-[min(88vw,320px)] h-full max-h-dvh rounded-none border-r border-outline-variant/30 bg-surface-container-lowest shadow-[8px_0_40px_rgba(15,23,42,0.14)]',
        overlay: 'bg-black/40 backdrop-blur-[2px]',
      }"
    >
      <template #content>
        <nav class="mobile-drawer flex flex-col h-full min-h-0">
          <div class="flex items-center justify-between gap-3 px-4 pt-4 pb-3 border-b border-outline-variant/20">
            <UiAppLogo size="md" />
            <button
              type="button"
              class="touch-target inline-flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              aria-label="Fermer le menu"
              @click="closeMobileMenu"
            >
              <UiPzIcon name="close" class="text-[22px]" />
            </button>
          </div>

          <div class="flex-1 min-h-0 overflow-y-auto px-3 py-4">
            <p class="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/70">
              Navigation
            </p>
            <ul class="space-y-0.5">
              <li
                v-for="(link, i) in marketingLinks"
                :key="link.href"
                class="mobile-drawer-item"
                :class="mobileMenuOpen && 'is-visible'"
                :style="mobileMenuOpen ? { transitionDelay: `${80 + i * 45}ms` } : undefined"
              >
                <NuxtLink
                  v-if="'isRoute' in link && link.isRoute"
                  :to="link.href"
                  class="mobile-drawer-link group"
                  @click="closeMobileMenu"
                >
                  <span class="mobile-drawer-link__icon">
                    <UiPzIcon :name="link.icon" class="text-[20px] text-secondary" />
                  </span>
                  <span class="flex-1 font-medium text-[15px]">{{ link.label }}</span>
                  <UiPzIcon name="chevron_right" class="text-[20px] text-on-surface-variant/50 group-hover:text-secondary group-hover:translate-x-0.5 transition-all" />
                </NuxtLink>
                <a
                  v-else
                  :href="link.href"
                  class="mobile-drawer-link group"
                  @click="closeMobileMenu"
                >
                  <span class="mobile-drawer-link__icon">
                    <UiPzIcon :name="link.icon" class="text-[20px] text-secondary" />
                  </span>
                  <span class="flex-1 font-medium text-[15px]">{{ link.label }}</span>
                  <UiPzIcon name="chevron_right" class="text-[20px] text-on-surface-variant/50 group-hover:text-secondary group-hover:translate-x-0.5 transition-all" />
                </a>
              </li>
            </ul>
          </div>

          <div
            class="shrink-0 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-outline-variant/20 bg-surface-container-lowest/80 space-y-3"
          >
            <NuxtLink
              to="/creer"
              class="btn-primary flex items-center justify-center min-h-11 w-full rounded-xl premium-shadow-sm"
              @click="closeMobileMenu"
            >
              Créer mon dossier
              <UiPzIcon name="arrow_forward" class="text-[18px]" />
            </NuxtLink>

            <template v-if="authStore.isAuthenticated">
              <NuxtLink
                to="/tableau-de-bord"
                class="mobile-drawer-link group !min-h-10"
                @click="closeMobileMenu"
              >
                <span class="mobile-drawer-link__icon !w-9 !h-9">
                  <UiPzIcon name="dashboard" class="text-[20px] text-secondary" />
                </span>
                <span class="flex-1 font-medium text-sm">Mon tableau de bord</span>
                <UiPzIcon name="chevron_right" class="text-[18px] text-on-surface-variant/50" />
              </NuxtLink>
            </template>

            <div
              v-else
              class="flex items-center justify-between gap-3 rounded-xl border border-outline-variant/25 bg-surface-container-low/80 px-3 py-2.5"
            >
              <span
                class="inline-flex items-center gap-1.5 text-[11px] font-semibold text-on-surface-variant"
                title="Mode invité — connectez-vous pour sauvegarder"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" aria-hidden="true" />
                Invité
              </span>
              <NuxtLink
                to="/connexion"
                class="text-sm font-semibold text-secondary hover:underline inline-flex items-center gap-0.5 min-h-9"
                @click="closeMobileMenu"
              >
                Se connecter
                <UiPzIcon name="arrow_forward" class="text-[16px]" />
              </NuxtLink>
            </div>
          </div>
        </nav>
      </template>
    </UDrawer>
  </header>
</template>
