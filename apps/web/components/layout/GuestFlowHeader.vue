<script setup lang="ts">
withDefaults(
  defineProps<{
    exitTo?: string
    showMenu?: boolean
  }>(),
  {
    exitTo: '/',
    showMenu: true,
  },
)

const authStore = useAuthStore()
const { openMenu } = useMarketingMenuState()

onMounted(() => {
  authStore.loadFromStorage()
})
</script>

<template>
  <header class="sticky top-0 z-50 bg-surface/90 backdrop-blur-md border-b border-outline-variant/30 shrink-0">
    <div class="flex items-center justify-between gap-2 px-margin-mobile py-2.5 min-h-[3.25rem]">
      <NuxtLink to="/" class="shrink-0 min-h-11 inline-flex items-center">
        <UiAppLogo size="sm" class="[&_img]:h-8" />
      </NuxtLink>

      <div class="flex items-center gap-1 shrink-0">
        <LayoutAuthStatus icon-only class="sm:hidden" />
        <LayoutAuthStatus compact class="hidden sm:flex" />
        <button
          v-if="showMenu"
          type="button"
          class="md:hidden touch-target inline-flex items-center justify-center rounded-xl text-on-surface hover:bg-surface-container transition-colors"
          aria-label="Menu"
          @click="openMenu($event.currentTarget as HTMLElement)"
        >
          <UiPzIcon name="menu" class="text-[22px]" />
        </button>
        <NuxtLink
          :to="exitTo"
          class="text-on-surface-variant font-label-sm hover:text-primary transition-colors inline-flex items-center gap-1 min-h-11 px-2"
        >
          <UiPzIcon name="close" class="text-[20px]" />
          <span class="hidden sm:inline">Quitter</span>
        </NuxtLink>
      </div>
    </div>
  </header>
  <LayoutGuestFlowDrawer />
</template>
