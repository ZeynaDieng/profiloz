<script setup lang="ts">
import { DOCUMENT_STATUS_LABELS, DOCUMENT_TYPE_LABELS, formatFileSize } from '~/utils/labels'

defineProps<{
  doc: {
    id: string
    type: string
    status: string
    originalName: string
    sizeBytes: number
    createdAt: string
  }
  deleting?: boolean
}>()

defineEmits<{ delete: [] }>()

function statusClass(status: string) {
  if (status === 'PARSED') return 'bg-secondary/10 text-secondary'
  if (status === 'PROCESSING') return 'bg-primary/10 text-primary'
  if (status === 'FAILED') return 'bg-error/10 text-error'
  return 'bg-surface-container text-on-surface-variant'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<template>
  <UiCard variant="glass" padding="md">
    <div class="flex items-start gap-3">
      <div class="w-11 h-11 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
        <UiPzIcon name="description" />
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-on-surface truncate">{{ doc.originalName }}</p>
        <p class="text-xs text-on-surface-variant mt-0.5">
          {{ DOCUMENT_TYPE_LABELS[doc.type] ?? doc.type }}
          · {{ formatFileSize(doc.sizeBytes) }}
        </p>
        <div class="flex flex-wrap items-center gap-2 mt-2">
          <span class="px-2.5 py-1 rounded-full text-xs font-semibold" :class="statusClass(doc.status)">
            {{ DOCUMENT_STATUS_LABELS[doc.status] ?? doc.status }}
          </span>
          <span class="text-xs text-on-surface-variant">{{ formatDate(doc.createdAt) }}</span>
        </div>
      </div>
      <button
        type="button"
        class="touch-target inline-flex items-center justify-center text-error hover:bg-error/5 rounded-xl shrink-0 disabled:opacity-50"
        :disabled="deleting"
        aria-label="Supprimer"
        @click="$emit('delete')"
      >
        <UiPzIcon name="delete" class="text-lg" />
      </button>
    </div>
  </UiCard>
</template>
