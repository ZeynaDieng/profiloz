<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'success' | 'error' | 'info' | 'warning'
    message: string
    title?: string
  }>(),
  { variant: 'info' },
)

const variantConfig = {
  success: {
    icon: 'check_circle',
    class: 'bg-secondary/8 border-secondary/20 text-on-surface',
    iconClass: 'text-secondary',
  },
  error: {
    icon: 'error',
    class: 'bg-error-container border-error/40 text-on-surface font-medium',
    iconClass: 'text-error',
  },
  info: {
    icon: 'info',
    class: 'bg-surface-container-low border-outline-variant/30 text-on-surface',
    iconClass: 'text-secondary',
  },
  warning: {
    icon: 'warning',
    class: 'bg-amber-50 border-amber-200/60 text-on-surface',
    iconClass: 'text-amber-600',
  },
} as const
</script>

<template>
  <div
    role="alert"
    class="flex items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-snug"
    :class="variantConfig[variant].class"
  >
    <UiPzIcon
      :name="variantConfig[variant].icon"
      class="shrink-0 text-[20px] mt-0.5"
      :class="variantConfig[variant].iconClass"
      aria-hidden="true"
    />
    <div class="min-w-0">
      <p v-if="title" class="font-semibold mb-0.5">{{ title }}</p>
      <p>{{ message }}</p>
    </div>
  </div>
</template>
