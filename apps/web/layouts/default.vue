<template>
  <div>
    <LayoutAppHeader variant="marketing" />
    <LayoutAppMarketingDrawer />
    <main class="overflow-x-clip max-w-full">
      <slot />
    </main>
    <LayoutAppFooter variant="full" />
  </div>
</template>
