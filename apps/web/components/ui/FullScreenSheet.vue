<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false })

const { isMobile } = useBreakpoints()

defineProps<{
  title?: string
}>()

const modalUi = {
  content: 'bg-background flex flex-col',
  body: 'flex-1 overflow-auto p-0',
  footer: 'border-t border-outline-variant px-margin-mobile py-3 safe-bottom shrink-0',
  overlay: 'bg-black/35',
}

const slideoverUi = {
  content: 'max-w-xl w-full flex flex-col',
  body: 'flex-1 overflow-auto p-0',
  footer: 'border-t border-outline-variant px-gutter py-3 shrink-0',
  overlay: 'bg-black/35',
}
</script>

<template>
  <UModal
    v-if="isMobile"
    v-model:open="open"
    fullscreen
    :title="title"
    :ui="modalUi"
  >
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>
    <template #body>
      <slot />
    </template>
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </UModal>

  <USlideover
    v-else
    v-model:open="open"
    side="right"
    :title="title"
    :ui="slideoverUi"
  >
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>
    <template #body>
      <slot />
    </template>
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </USlideover>
</template>
