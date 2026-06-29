<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    loading?: boolean
    block?: boolean
    icon?: string
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
  }>(),
  {
    variant: 'primary',
    size: 'md',
    loading: false,
    block: false,
    type: 'button',
    disabled: false,
  },
)

const variantClass = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  outline: 'btn-outline',
  danger: 'inline-flex items-center justify-center gap-2 min-h-11 px-5 py-3 rounded-xl bg-error/10 text-error font-bold text-sm hover:bg-error/15',
} as const

const sizeClass = {
  sm: 'min-h-10 px-4 py-2 text-sm rounded-lg',
  md: '',
  lg: 'min-h-12 px-6 py-3.5 text-base rounded-xl',
} as const
</script>

<template>
  <button
    :type="type"
    class="pz-btn disabled:opacity-60"
    :class="[
      variantClass[variant],
      sizeClass[size],
      block && 'w-full',
      loading && 'pz-btn--loading',
    ]"
    :disabled="disabled || loading"
    :aria-busy="loading"
  >
    <UiPzIcon v-if="icon && !loading" :name="icon" class="text-[18px] pz-icon-hover" />
    <slot />
  </button>
</template>
