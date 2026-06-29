<script setup lang="ts">
const { primaryNavItems, isActive } = useAppNavigation()
const { toggleDrawer } = useDrawerState()

function navClass(item: (typeof primaryNavItems)[number]) {
  return isActive(item)
    ? 'flex flex-col items-center justify-center gap-1 min-h-11 min-w-11 text-secondary font-bold text-label-xs'
    : 'flex flex-col items-center justify-center gap-1 min-h-11 min-w-11 text-on-surface-variant text-label-xs'
}
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 w-full bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant flex justify-around items-end pt-2 z-50 md:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]"
  >
    <NuxtLink
      v-for="item in primaryNavItems"
      :key="item.to"
      :to="item.to"
      :class="navClass(item)"
    >
      <UiPzIcon :name="item.icon" />
      {{ item.label === 'Mes dossiers' ? 'Dossiers' : item.label }}
    </NuxtLink>

    <button
      type="button"
      class="flex flex-col items-center justify-center gap-1 min-h-11 min-w-11 text-on-surface-variant text-label-xs"
      aria-label="Menu"
      @click="toggleDrawer($event.currentTarget as HTMLElement)"
    >
      <UiPzIcon name="menu" />
      Menu
    </button>

    <NuxtLink
      to="/creer"
      class="w-12 h-12 bg-primary text-on-primary rounded-full flex items-center justify-center -translate-y-3 shadow-lg absolute left-1/2 -translate-x-1/2 min-h-12 min-w-12 transition-transform active:scale-95"
      aria-label="Nouveau dossier"
    >
      <UiPzIcon name="add" />
    </NuxtLink>
  </nav>
</template>
