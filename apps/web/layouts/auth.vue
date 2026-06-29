<template>
  <div class="min-h-screen flex flex-col bg-background">
    <header class="w-full flex justify-between items-center gap-3 px-margin-mobile md:px-margin-tablet xl:px-margin-desktop py-3 shrink-0">
      <UiAppLogo size="sm" class="shrink-0 [&_img]:h-9 md:[&_img]:h-12" />
      <LayoutAuthStatus icon-only class="sm:hidden" />
      <LayoutAuthStatus compact class="hidden sm:flex" />
    </header>
    <main class="flex-1 flex flex-col items-stretch sm:items-center justify-start sm:justify-center px-margin-mobile md:px-margin-tablet pb-8 sm:pb-12">
      <div class="w-full max-w-md page-enter">
        <slot />
      </div>
    </main>
    <LayoutAppFooter variant="transactional" />
  </div>
</template>
