<script setup lang="ts">
const route = useRoute()
const authStore = useAuthStore()
const { open, closeMenu, menuTriggerRef } = useMarketingMenuState()
const closeButtonRef = ref<HTMLButtonElement | null>(null)

useDrawerA11y(open, closeButtonRef, menuTriggerRef)

const marketingLinks = [
  { href: '#features', label: 'Fonctionnalités', icon: 'auto_awesome' },
  { href: '/#templates', label: 'Modèles', icon: 'description', isRoute: true },
  { href: '/tarifs', label: 'Tarifs', icon: 'payments', isRoute: true },
  { href: '#faq', label: 'FAQ', icon: 'help' },
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
  <UDrawer
    v-model:open="open"
    direction="left"
    title="Navigation"
    :handle="false"
    :should-scale-background="false"
    :ui="{
      overlay: 'z-[100] bg-black/40 backdrop-blur-[2px]',
      content:
        'z-[101] mobile-drawer-panel w-[min(88vw,320px)] h-full max-h-dvh rounded-none border-r border-outline-variant/30 bg-surface-container-lowest shadow-[8px_0_40px_rgba(15,23,42,0.14)]',
    }"
  >
    <template #content>
      <nav class="mobile-drawer flex flex-col h-full min-h-0">
        <div class="flex items-center justify-between gap-3 px-4 pt-4 pb-3 border-b border-outline-variant/20">
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

        <div class="flex-1 min-h-0 overflow-y-auto px-3 py-4">
          <p class="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/70">
            Navigation
          </p>
          <ul class="space-y-0.5">
            <li
              v-for="(link, i) in marketingLinks"
              :key="link.href"
              class="mobile-drawer-item is-visible"
            >
              <NuxtLink
                v-if="'isRoute' in link && link.isRoute"
                :to="link.href"
                class="mobile-drawer-link group"
                @click="closeMenu"
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
                @click="closeMenu"
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
            @click="closeMenu"
          >
            Créer mon dossier
            <UiPzIcon name="arrow_forward" class="text-[18px]" />
          </NuxtLink>

          <template v-if="authStore.isAuthenticated">
            <NuxtLink
              to="/tableau-de-bord"
              class="mobile-drawer-link group !min-h-10"
              @click="closeMenu"
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
              @click="closeMenu"
            >
              Se connecter
              <UiPzIcon name="arrow_forward" class="text-[16px]" />
            </NuxtLink>
          </div>
        </div>
      </nav>
    </template>
  </UDrawer>
</template>
