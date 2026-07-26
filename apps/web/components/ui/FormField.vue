<script setup lang="ts">
defineProps<{
  label?: string
  required?: boolean
  error?: string
  valid?: boolean
  tooltip?: string
}>()
</script>

<template>
  <div
    class="relative"
    :class="{ 'form-field--error': error }"
    :data-form-error="error ? '' : undefined"
  >
    <label v-if="label" class="font-label-sm text-on-surface flex items-center gap-1.5 mb-1.5">
      <span>{{ label }}</span>
      <span v-if="required" class="text-error" aria-hidden="true">*</span>
      <span v-if="tooltip" class="group relative inline-flex items-center cursor-help" tabindex="0">
        <UiPzIcon name="help_outline" class="text-[15px] text-on-surface-variant/70 hover:text-primary transition-colors" />
        <span class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-200 bg-slate-900/95 border border-slate-800 shadow-xl text-[11px] text-slate-100 p-2.5 rounded-xl leading-relaxed z-[100] font-normal text-left">
          {{ tooltip }}
          <span class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/95"></span>
        </span>
      </span>
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
