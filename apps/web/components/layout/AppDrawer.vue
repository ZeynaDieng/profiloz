<script setup lang="ts">
const route = useRoute()
const { primaryNavItems, secondaryNavItems, isActive } = useAppNavigation()
const { drawerOpen, closeDrawer } = useDrawerState()

watch(
  () => route.path,
  () => closeDrawer(),
)
</script>

<template>
  <UDrawer
    v-model:open="drawerOpen"
    direction="left"
    :handle="false"
    :ui="{
      content: 'mobile-drawer-panel w-[min(88vw,320px)] h-full max-h-dvh rounded-none border-r border-outline-variant/30 bg-surface-container-lowest shadow-[8px_0_40px_rgba(15,23,42,0.14)]',
      overlay: 'bg-black/40 backdrop-blur-[2px]',
    }"
  >
    <template #content>
      <div class="mobile-drawer flex flex-col h-full min-h-0">
        <div class="flex items-center justify-between gap-3 px-4 pt-4 pb-3 border-b border-outline-variant/20">
          <UiAppLogo size="md" />
          <button
            type="button"
            class="touch-target inline-flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
            aria-label="Fermer le menu"
            @click="closeDrawer"
          >
            <UiPzIcon name="close" class="text-[22px]" />
          </button>
        </div>

        <nav class="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-4">
          <div>
            <p class="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/70">
              Principal
            </p>
            <ul class="space-y-0.5">
              <li
                v-for="(item, i) in primaryNavItems"
                :key="item.to"
                class="mobile-drawer-item"
                :class="drawerOpen && 'is-visible'"
                :style="drawerOpen ? { transitionDelay: `${80 + i * 40}ms` } : undefined"
              >
                <NuxtLink
                  :to="item.to"
                  class="mobile-drawer-link group"
                  :class="isActive(item) && 'bg-secondary/10'"
                  @click="closeDrawer"
                >
                  <span
                    class="mobile-drawer-link__icon"
                    :class="isActive(item) && 'bg-secondary/15'"
                  >
                    <UiPzIcon :name="item.icon" :filled="isActive(item)" class="text-[20px] text-secondary" />
                  </span>
                  <span class="flex-1 font-medium text-[15px]" :class="isActive(item) && 'text-secondary font-semibold'">
                    {{ item.label }}
                  </span>
                  <UiPzIcon
                    name="chevron_right"
                    class="text-[20px] text-on-surface-variant/50 group-hover:text-secondary group-hover:translate-x-0.5 transition-all"
                  />
                </NuxtLink>
              </li>
            </ul>
          </div>

          <div>
            <p class="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/70">
              Outils
            </p>
            <ul class="space-y-0.5">
              <li
                v-for="(item, i) in secondaryNavItems"
                :key="item.to"
                class="mobile-drawer-item"
                :class="drawerOpen && 'is-visible'"
                :style="drawerOpen ? { transitionDelay: `${200 + i * 40}ms` } : undefined"
              >
                <NuxtLink
                  :to="item.to"
                  class="mobile-drawer-link group"
                  :class="isActive(item) && 'bg-secondary/10'"
                  @click="closeDrawer"
                >
                  <span
                    class="mobile-drawer-link__icon"
                    :class="isActive(item) && 'bg-secondary/15'"
                  >
                    <UiPzIcon :name="item.icon" :filled="isActive(item)" class="text-[20px] text-secondary" />
                  </span>
                  <span class="flex-1 font-medium text-[15px]" :class="isActive(item) && 'text-secondary font-semibold'">
                    {{ item.label }}
                  </span>
                  <UiPzIcon
                    name="chevron_right"
                    class="text-[20px] text-on-surface-variant/50 group-hover:text-secondary group-hover:translate-x-0.5 transition-all"
                  />
                </NuxtLink>
              </li>
            </ul>
          </div>
        </nav>

        <div class="shrink-0 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-outline-variant/20">
          <NuxtLink
            to="/creer"
            class="btn-primary w-full rounded-xl py-3 premium-shadow-sm"
            @click="closeDrawer"
          >
            <UiPzIcon name="add" />
            Nouveau dossier
          </NuxtLink>
        </div>
      </div>
    </template>
  </UDrawer>
</template>
