<script setup lang="ts">
/** Œil « voir en grand » au centre d'une carte de modèle : visible sur tactile, au survol sinon. */
defineProps<{ label: string }>()
defineEmits<{ click: [] }>()
</script>

<template>
  <button
    type="button"
    :aria-label="`Voir le modèle ${label} en grand`"
    class="pointer-events-auto w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-outline-variant/60 bg-white/95 text-on-surface shadow-md flex items-center justify-center transition-opacity duration-150 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-secondary"
    @click.stop="$emit('click')"
  >
    <svg class="w-[18px] h-[18px] sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  </button>
</template>
