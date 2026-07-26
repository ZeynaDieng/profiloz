<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label?: string
  required?: boolean
  error?: string
  valid?: boolean
  tooltip?: string
}>()

// État partagé pour s'assurer qu'UNE seule bulle d'aide est ouverte à la fois
const activeTooltip = useState<string | null>('active-form-tooltip', () => null)
const isOpen = computed({
  get: () => !!props.label && activeTooltip.value === props.label,
  set: (val) => {
    activeTooltip.value = val ? (props.label || 'default') : null
  }
})
</script>

<template>
  <div
    class="relative"
    :class="{ 'form-field--error': error }"
    :data-form-error="error ? '' : undefined"
  >
    <label v-if="label" class="font-label-sm text-on-surface flex items-center gap-1.5 mb-1.5 select-none">
      <span>{{ label }}</span>
      <span v-if="required" class="text-error" aria-hidden="true">*</span>
      
      <span v-if="tooltip" class="inline-flex items-center">
        <!-- Icône d'aide interactive (Clic pour Mobile, Hover pour Desktop) -->
        <button
          type="button"
          class="inline-flex items-center justify-center p-0.5 rounded-full hover:bg-surface-container focus:outline-none transition-colors"
          :class="isOpen ? 'text-primary bg-primary/10' : 'text-on-surface-variant/60 hover:text-primary'"
          aria-label="Aide"
          @click="isOpen = !isOpen"
        >
          <UiPzIcon name="help_outline" class="text-[15px]" />
        </button>

        <!-- Tooltip Desktop (Hover) -->
        <span class="hidden lg:block group relative">
          <span class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-surface/95 border border-outline-variant shadow-xl text-[11px] text-on-surface-variant p-3 rounded-2xl leading-relaxed z-[100] font-medium backdrop-blur-md">
            {{ tooltip }}
            <span class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-surface/95"></span>
          </span>
        </span>
      </span>
    </label>

    <!-- Tooltip Expansif Mobile (Inline Card) -->
    <div
      v-if="tooltip && isOpen"
      class="lg:hidden mb-2.5 p-3 rounded-xl bg-gradient-to-r from-primary/10 via-secondary/5 to-transparent border border-primary/20 text-xs text-on-surface-variant leading-relaxed flex items-start gap-2.5 animate-fade-in shadow-xs"
    >
      <UiPzIcon name="info" class="text-primary text-[15px] mt-0.5 shrink-0" />
      <div class="flex-1 font-medium leading-normal pr-1 select-text">
        {{ tooltip }}
      </div>
      <button
        type="button"
        class="text-on-surface-variant/50 hover:text-on-surface p-0.5 hover:bg-surface-container rounded-md shrink-0 transition-colors"
        @click="isOpen = false"
      >
        <UiPzIcon name="close" class="text-sm font-bold" />
      </button>
    </div>

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
