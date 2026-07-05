<script setup lang="ts">
const { primaryNavItems, secondaryNavItems, isActive } = useAppNavigation()
</script>

<template>
  <aside class="h-screen w-56 fixed left-0 top-0 flex-col p-stack-md gap-stack-sm bg-surface-container-lowest border-r border-outline-variant z-50 hidden md:flex">
    <div class="mb-stack-lg px-2">
      <UiAppLogo size="md" />
    </div>
    <nav class="flex-1 space-y-1 overflow-y-auto">
      <NuxtLink
        v-for="item in primaryNavItems"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-3 px-4 py-3 rounded-lg font-label-sm transition-all min-h-11"
        :class="
          isActive(item)
            ? 'bg-secondary-container text-on-secondary-container font-bold'
            : 'text-on-surface-variant hover:bg-surface-container'
        "
      >
        <UiPzIcon :name="item.icon" :filled="isActive(item)" />
        <span>{{ item.label }}</span>
      </NuxtLink>

      <div class="pt-4 mt-2 border-t border-outline-variant/50">
        <NuxtLink
          v-for="item in secondaryNavItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-4 py-3 rounded-lg font-label-sm transition-all min-h-11"
          :class="
            isActive(item)
              ? 'bg-secondary-container text-on-secondary-container font-bold'
              : 'text-on-surface-variant hover:bg-surface-container'
          "
        >
          <UiPzIcon :name="item.icon" :filled="isActive(item)" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </div>
    </nav>
    <div class="mt-auto pt-stack-md border-t border-outline-variant space-y-3">
      <BillingEntitlementsSummary compact />
      <NuxtLink
        to="/creer"
        class="w-full btn-primary rounded-lg py-3"
      >
        <UiPzIcon name="add" />
        Nouveau dossier
      </NuxtLink>
    </div>
  </aside>
</template>
