<template>
  <div class="min-h-screen flex flex-col">
    <header class="w-full flex justify-between items-center gap-3 px-margin-mobile py-3 md:py-stack-lg">
      <UiAppLogo size="sm" class="shrink-0 [&_img]:h-10 md:[&_img]:h-14" />
      <LayoutAuthStatus icon-only class="sm:hidden" />
      <LayoutAuthStatus compact class="hidden sm:flex" />
    </header>
    <main class="flex-grow flex items-center justify-center px-margin-mobile">
      <slot />
    </main>
    <LayoutAppFooter variant="transactional" />
  </div>
</template>
