<script setup lang="ts">
const route = useRoute()

const items = [
  { to: '/tableau-de-bord', icon: 'description', label: 'CV', match: '/tableau-de-bord', exact: true },
  { to: '/tableau-de-bord/lettres', icon: 'mail', label: 'Lettres', match: '/lettres' },
  { to: '/tableau-de-bord/documents', icon: 'folder_open', label: 'Docs', match: '/documents' },
]

function navClass(item: (typeof items)[number]) {
  const active = item.exact
    ? route.path === item.to || route.path === `${item.to}/`
    : route.path.includes(item.match)
  return active
    ? 'flex flex-col items-center justify-center gap-1 min-h-11 min-w-11 text-secondary font-bold text-label-xs'
    : 'flex flex-col items-center justify-center gap-1 min-h-11 min-w-11 text-on-surface-variant text-label-xs'
}
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 w-full bg-surface-container-lowest border-t border-outline-variant flex justify-around items-end pt-2 z-50 md:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]"
  >
    <NuxtLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      :class="navClass(item)"
    >
      <UiPzIcon :name="item.icon" />
      {{ item.label }}
    </NuxtLink>
    <NuxtLink
      to="/creer"
      class="w-12 h-12 bg-primary text-on-primary rounded-full flex items-center justify-center -translate-y-3 shadow-lg absolute left-1/2 -translate-x-1/2 min-h-12 min-w-12"
      aria-label="Nouveau CV"
    >
      <UiPzIcon name="add" />
    </NuxtLink>
  </nav>
</template>
