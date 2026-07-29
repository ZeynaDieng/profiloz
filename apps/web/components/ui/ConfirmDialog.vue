<script setup lang="ts">
const { state, accept, reject } = useConfirm()
</script>

<template>
  <UModal
    v-model:open="state.open"
    :title="state.title"
    :description="state.message"
    :ui="{
      content: 'max-w-sm w-[calc(100%-2rem)] mx-auto rounded-2xl bg-surface border border-outline-variant/30 p-5 shadow-2xl',
      footer: 'flex flex-col-reverse sm:flex-row gap-2 w-full mt-4',
      overlay: 'bg-black/40 backdrop-blur-[2px]',
    }"
  >
    <template #footer>
      <UiButton variant="ghost" block @click="reject">
        {{ state.cancelLabel }}
      </UiButton>
      <UiButton
        :variant="state.destructive ? 'danger' : 'secondary'"
        block
        @click="accept"
      >
        {{ state.confirmLabel }}
      </UiButton>
    </template>
  </UModal>
</template>
