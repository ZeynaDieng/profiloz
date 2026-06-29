<script setup lang="ts">
withDefaults(
  defineProps<{
    elevated?: boolean
  }>(),
  {
    elevated: true,
  },
)
</script>

<template>
  <footer
    class="fixed bottom-0 left-0 right-0 z-40 border-t border-outline-variant bg-surface-container-lowest/95 backdrop-blur-md safe-bottom"
    :class="elevated && 'shadow-[0_-8px_24px_rgba(15,23,42,0.06)]'"
  >
    <div class="px-margin-mobile md:px-margin-desktop py-3 max-w-container-max mx-auto">
      <slot />
    </div>
  </footer>
</template>
