<script setup lang="ts">
const route = useRoute()

const items = [
  { to: '/tableau-de-bord', icon: 'folder_shared', label: 'Mes dossiers', match: '/tableau-de-bord', exact: true },
  { to: '/tableau-de-bord/documents', icon: 'folder_open', label: 'Documents', match: '/documents' },
]

function isActive(item: (typeof items)[number]) {
  if (item.exact) {
    return route.path === item.to || route.path === `${item.to}/`
  }
  return route.path.includes(item.match)
}
</script>

<template>
  <aside class="h-screen w-56 fixed left-0 top-0 flex-col p-stack-md gap-stack-sm bg-surface-container-lowest border-r border-outline-variant z-50 hidden md:flex">
    <div class="mb-stack-lg px-2">
      <UiAppLogo size="md" />
    </div>
    <nav class="flex-1 space-y-1">
      <NuxtLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-3 px-4 py-3 rounded-lg font-label-sm transition-all"
        :class="
          isActive(item)
            ? 'bg-secondary-container text-on-secondary-container font-bold'
            : 'text-on-surface-variant hover:bg-surface-container'
        "
      >
        <UiPzIcon :name="item.icon" :filled="isActive(item)" />
        <span>{{ item.label }}</span>
      </NuxtLink>
    </nav>
    <div class="mt-auto pt-stack-md border-t border-outline-variant">
      <NuxtLink
        to="/creer"
        class="w-full bg-primary text-on-primary py-3 rounded-lg font-label-sm font-bold flex items-center justify-center gap-2 hover:opacity-90"
      >
        <UiPzIcon name="add" />
        Nouveau dossier
      </NuxtLink>
    </div>
  </aside>
</template>
