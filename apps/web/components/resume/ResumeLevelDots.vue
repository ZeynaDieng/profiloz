<script setup lang="ts">
/** Niveau affiché en points ronds de 7,5pt (5 par défaut). */
withDefaults(defineProps<{ filled: number; color: string; offColor: string; total?: number }>(), { total: 5 })
</script>

<template>
  <span class="flex shrink-0 gap-[2.5pt]">
    <span
      v-for="n in total"
      :key="n"
      class="h-[7.5pt] w-[7.5pt] rounded-full"
      :style="{ backgroundColor: n <= filled ? color : offColor }"
    />
  </span>
</template>
