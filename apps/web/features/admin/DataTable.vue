<script setup lang="ts">
defineProps<{
  columns: Array<{ key: string; label: string; class?: string }>
  rows: Array<Record<string, unknown>>
  loading?: boolean
  emptyMessage?: string
}>()
</script>

<template>
  <div class="rounded-xl border border-outline-variant/30 overflow-hidden bg-surface-container-lowest/60">
    <div
      class="hidden md:grid gap-3 px-4 py-3 bg-surface-container text-xs font-semibold text-on-surface-variant uppercase tracking-wide"
      :style="{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }"
    >
      <span v-for="col in columns" :key="col.key" :class="col.class">{{ col.label }}</span>
    </div>

    <div v-if="loading" class="p-4 space-y-3">
      <UiSkeleton v-for="i in 5" :key="i" variant="rect" height="3rem" />
    </div>

    <div v-else-if="rows.length === 0" class="p-8 text-center text-on-surface-variant">
      {{ emptyMessage || 'Aucun élément.' }}
    </div>

    <div v-else>
      <div
        v-for="(row, idx) in rows"
        :key="String(row.id ?? idx)"
        class="grid gap-2 md:gap-3 px-4 py-4 border-t border-outline-variant/20 hover:bg-surface-container transition-colors"
        :style="{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }"
      >
        <div v-for="col in columns" :key="col.key" :class="col.class" class="min-w-0">
          <slot :name="`cell-${col.key}`" :row="row">
            <span class="md:hidden text-[10px] uppercase text-on-surface-variant block mb-0.5">{{ col.label }}</span>
            <span class="text-sm text-on-surface break-words">{{ row[col.key] }}</span>
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>
