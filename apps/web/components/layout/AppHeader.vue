<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'marketing' | 'dashboard' | 'minimal'
    exitTo?: string
  }>(),
  { variant: 'marketing', exitTo: '/' },
)

const route = useRoute()
const mobileMenuOpen = ref(false)

const marketingLinks = [
  { href: '#features', label: 'Fonctionnalités' },
  { href: '/#templates', label: 'Modèles', isRoute: true },
  { href: '#faq', label: 'FAQ' },
]

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
    <div class="relative flex justify-between items-center gap-2 px-margin-mobile md:px-margin-desktop py-3">
      <UiAppLogo size="sm" class="md:hidden" />
      <UiAppLogo size="md" class="hidden md:inline-flex" />

      <nav v-if="variant === 'marketing'" class="hidden md:flex items-center gap-stack-lg">
        <a href="#features" class="font-label-sm text-secondary font-semibold border-b-2 border-secondary pb-1">
          Fonctionnalités
        </a>
        <NuxtLink to="/#templates" class="font-label-sm text-on-surface-variant font-medium hover:text-secondary transition-colors">
          Modèles
        </NuxtLink>
        <a href="#faq" class="font-label-sm text-on-surface-variant font-medium hover:text-secondary transition-colors">
          FAQ
        </a>
      </nav>

      <div v-if="variant === 'marketing'" class="flex items-center gap-2 sm:gap-stack-md shrink-0">
        <NuxtLink
          to="/connexion"
          class="hidden md:block font-label-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
        >
          Se connecter
        </NuxtLink>
        <NuxtLink
          to="/creer"
          class="bg-primary text-on-primary font-label-sm px-4 sm:px-6 py-2.5 rounded-lg font-bold hover:bg-on-surface-variant transition-all whitespace-nowrap min-h-11 inline-flex items-center"
        >
          <span class="sm:hidden">Créer</span>
          <span class="hidden sm:inline">Créer mon CV</span>
        </NuxtLink>
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

      <div v-else-if="variant === 'dashboard'" class="flex items-center gap-3 shrink-0">
        <NuxtLink
          to="/creer"
          class="text-sm font-semibold text-secondary hover:underline min-h-11 inline-flex items-center"
        >
          <span class="sm:hidden">Nouveau</span>
          <span class="hidden sm:inline">Nouveau CV</span>
        </NuxtLink>
      </div>

      <NuxtLink
        v-else-if="variant === 'minimal'"
        :to="exitTo"
        class="text-on-surface-variant font-label-sm hover:text-primary transition-colors inline-flex items-center gap-1 min-h-11 px-2"
      >
        <UiPzIcon name="close" class="text-[20px]" />
        <span class="hidden sm:inline">Quitter</span>
      </NuxtLink>
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
      <NuxtLink
        to="/connexion"
        class="flex items-center min-h-11 px-3 rounded-lg text-on-surface-variant font-semibold hover:bg-surface-container"
        @click="closeMobileMenu"
      >
        Se connecter
      </NuxtLink>
    </nav>
  </header>
</template>
