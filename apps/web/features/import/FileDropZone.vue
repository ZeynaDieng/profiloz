<script setup lang="ts">
import type { DocumentType } from '@profiloz/shared'

const props = defineProps<{
  accept?: string
  maxSizeMb?: number
}>()

const emit = defineEmits<{
  select: [file: File]
}>()

const isDragging = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)
const error = ref('')

function validate(file: File): boolean {
  error.value = ''
  const maxBytes = (props.maxSizeMb ?? 10) * 1024 * 1024
  if (file.size > maxBytes) {
    error.value = MSG.upload.size
    return false
  }
  return true
}

function onFile(file: File) {
  if (validate(file)) emit('select', file)
}

function onChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) onFile(file)
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) onFile(file)
}
</script>

<template>
  <div
    class="border-2 border-dashed rounded-xl p-stack-lg transition-all glass-card min-h-[280px] flex flex-col items-center justify-center cursor-pointer"
    :class="isDragging ? 'border-secondary bg-secondary/5' : 'border-outline-variant hover:border-secondary'"
    @click="inputRef?.click()"
    @dragover.prevent="isDragging = true"
    @dragleave="isDragging = false"
    @drop.prevent="onDrop"
  >
    <input ref="inputRef" type="file" class="hidden" :accept="accept" @change="onChange" />
    <div class="flex flex-col items-center text-center space-y-4">
      <div class="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-secondary">
        <UiPzIcon name="cloud_upload" class="text-[32px]" />
      </div>
      <div>
        <h2 class="font-bold text-on-surface text-xl">Glissez votre fichier ici</h2>
        <p class="text-on-surface-variant">PDF, DOCX, JPG ou PNG — max {{ maxSizeMb ?? 10 }} Mo</p>
      </div>
      <span class="px-6 py-2 bg-secondary text-on-secondary rounded-lg font-label-sm font-bold">Sélectionner un fichier</span>
      <UiMessageBanner v-if="error" variant="error" :message="error" class="mt-4" />
    </div>
  </div>
</template>
