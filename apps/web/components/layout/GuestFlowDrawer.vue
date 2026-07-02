<script setup lang="ts">
const route = useRoute()
const authStore = useAuthStore()
const { open, closeMenu, menuTriggerRef } = useMarketingMenuState()
const closeButtonRef = ref<HTMLButtonElement | null>(null)

useDrawerA11y(open, closeButtonRef, menuTriggerRef)

const links = [
  { to: '/creer', label: 'Créer un CV', icon: 'add' },
  { to: '/creer/lettre', label: 'Créer une lettre', icon: 'mail' },
  { to: '/tarifs', label: 'Tarifs & paiement', icon: 'payments' },
  { to: '/', label: 'Accueil', icon: 'home' },
] as const

onMounted(() => {
  authStore.loadFromStorage()
})

watch(
  () => route.path,
  () => closeMenu(),
)
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-[120] lg:hidden">
      <button
        type="button"
        class="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-label="Fermer le menu"
        @click="closeMenu"
      />

      <nav
        class="absolute inset-y-0 left-0 flex w-[min(88vw,320px)] flex-col bg-surface-container-lowest shadow-[8px_0_40px_rgba(15,23,42,0.14)] border-r border-outline-variant/30"
        aria-label="Menu parcours invité"
      >
        <div class="flex items-center justify-between gap-3 border-b border-outline-variant/20 px-4 pb-3 pt-4">
          <UiAppLogo size="md" />
          <button
            ref="closeButtonRef"
            type="button"
            class="touch-target inline-flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
            aria-label="Fermer le menu"
            @click="closeMenu"
          >
            <UiPzIcon name="close" class="text-[22px]" />
          </button>
        </div>

        <ul class="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <li v-for="link in links" :key="link.to">
            <NuxtLink
              :to="link.to"
              class="mobile-drawer-link group"
              @click="closeMenu"
            >
              <span class="mobile-drawer-link__icon">
                <UiPzIcon :name="link.icon" class="text-[20px] text-secondary" />
              </span>
              <span class="flex-1 font-medium text-[15px]">{{ link.label }}</span>
              <UiPzIcon name="chevron_right" class="text-[20px] text-on-surface-variant/50" />
            </NuxtLink>
          </li>
        </ul>

        <div class="shrink-0 space-y-3 border-t border-outline-variant/20 bg-surface-container-lowest/80 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
          <p class="text-[11px] text-center text-on-surface-variant">
            Paiement sécurisé via PayTech (Wave, Orange Money, carte…)
          </p>
          <NuxtLink
            v-if="!authStore.isAuthenticated"
            to="/connexion"
            class="btn-secondary flex min-h-11 w-full items-center justify-center rounded-xl"
            @click="closeMenu"
          >
            Se connecter
          </NuxtLink>
        </div>
      </nav>
    </div>
  </Teleport>
</template>
