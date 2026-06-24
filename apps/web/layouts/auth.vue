<template>
  <div class="min-h-screen flex flex-col">
    <header class="w-full flex justify-center py-stack-md md:py-stack-lg">
      <UiAppLogo size="lg" class="md:hidden" />
      <UiAppLogo size="xl" class="hidden md:inline-flex" />
    </header>
    <main class="flex-grow flex items-center justify-center px-margin-mobile">
      <slot />
    </main>
    <LayoutAppFooter variant="transactional" />
  </div>
</template>
