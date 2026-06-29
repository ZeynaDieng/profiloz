<template>
  <div class="min-h-screen flex">
    <LayoutAppSidebar class="hidden md:flex" />
    <main class="flex-1 md:ml-56 min-h-screen flex flex-col">
      <LayoutAppHeader variant="dashboard" />
      <div class="flex-1 has-mobile-nav md:pb-0">
        <slot />
      </div>
    </main>
    <LayoutAppMobileNav class="md:hidden" />
    <LayoutAppDrawer />
  </div>
</template>
