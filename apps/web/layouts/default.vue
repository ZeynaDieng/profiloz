<template>
  <div>
    <LayoutAppHeader variant="marketing" />
    <LayoutAppMarketingDrawer />
    <main>
      <slot />
    </main>
    <LayoutAppFooter variant="full" />
  </div>
</template>
