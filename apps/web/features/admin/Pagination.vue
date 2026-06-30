<script setup lang="ts">
const props = defineProps<{
  page: number
  totalPages: number
  total: number
}>()

const emit = defineEmits<{ change: [page: number] }>()
</script>

<template>
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
    <p class="text-sm text-on-surface-variant">{{ total }} élément(s)</p>
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="rounded-lg border border-outline-variant/40 px-3 py-2 text-sm disabled:opacity-40"
        :disabled="props.page <= 1"
        @click="emit('change', props.page - 1)"
      >
        Précédent
      </button>
      <span class="text-sm text-on-surface">{{ props.page }} / {{ props.totalPages }}</span>
      <button
        type="button"
        class="rounded-lg border border-outline-variant/40 px-3 py-2 text-sm disabled:opacity-40"
        :disabled="props.page >= props.totalPages"
        @click="emit('change', props.page + 1)"
      >
        Suivant
      </button>
    </div>
  </div>
</template>
