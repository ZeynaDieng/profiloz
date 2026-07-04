<template>
  <div class="layout-shell flex min-h-dvh flex-col">
    <LayoutAppHeader variant="marketing" />
    <LayoutAppMarketingDrawer />
    <main class="flex-1 overflow-x-clip max-w-full w-full">
      <slot />
    </main>
    <LayoutAppFooter variant="full" />
  </div>
</template>
