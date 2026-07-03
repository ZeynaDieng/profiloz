<template>
  <div class="min-h-dvh flex flex-col bg-background">
    <LayoutAppHeader variant="marketing" />
    <LayoutAppMarketingDrawer />
    <main class="flex-1">
      <slot />
    </main>
    <LayoutAppFooter variant="full" />
  </div>
</template>
