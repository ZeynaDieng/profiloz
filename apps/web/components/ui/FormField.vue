<script setup lang="ts">
defineProps<{
  label?: string
  required?: boolean
  error?: string
  valid?: boolean
}>()
</script>

<template>
  <div class="relative">
    <label v-if="label" class="font-label-sm text-on-surface block mb-2">
      {{ label }}
      <span v-if="required" class="text-error" aria-hidden="true">*</span>
    </label>

    <div class="relative">
      <slot />

      <UiPzIcon
        v-if="valid && !error"
        name="check_circle"
        class="form-field__valid absolute right-3 top-1/2 -translate-y-1/2 text-secondary text-[20px] pointer-events-none"
        aria-hidden="true"
      />
    </div>

    <Transition name="form-field__error">
      <UiMessageBanner
        v-if="error"
        variant="error"
        :message="error"
        class="mt-2"
      />
    </Transition>
  </div>
</template>
