<template>
  <div class="min-h-screen flex flex-col">
    <LayoutAppHeader variant="minimal" exit-to="/" />
    <LayoutWizardProgress />
    <main class="flex-1 pb-24">
      <slot />
    </main>
    <slot name="footer" />
  </div>
</template>
