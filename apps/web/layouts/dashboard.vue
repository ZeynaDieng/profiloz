<script setup lang="ts">
const authStore = useAuthStore()
const router = useRouter()

authStore.loadFromStorage()

function exitImpersonation() {
  authStore.stopImpersonation()
  router.push('/admin/utilisateurs')
}
</script>

<template>
  <div class="min-h-screen flex">
    <LayoutAppSidebar class="hidden md:flex" />
    <main class="flex-1 md:ml-56 min-h-screen flex flex-col">
      <LayoutAppHeader variant="dashboard" />
      <div v-if="authStore.impersonating" class="bg-tertiary/15 border-b border-tertiary/30 px-4 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p class="text-sm text-on-surface">
          Mode support — connecté en tant que <strong>{{ authStore.user?.email }}</strong>
        </p>
        <UiButton variant="ghost" size="sm" @click="exitImpersonation">Quitter l’impersonation</UiButton>
      </div>
      <div class="flex-1 has-mobile-nav md:pb-0">
        <slot />
      </div>
    </main>
    <LayoutAppMobileNav class="md:hidden" />
    <LayoutAppDrawer />
  </div>
</template>
