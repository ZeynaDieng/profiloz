<script setup lang="ts">
import type { Interest } from '@profiloz/shared'

const model = defineModel<Interest[]>({ default: () => [] })
const newInterest = ref('')

function getInterestName(item: any): string {
  if (!item) return ''
  if (typeof item === 'string') return item
  return item.name || item.interest || item.label || item.value || ''
}

function addInterest() {
  const name = newInterest.value.trim()
  if (!name) return
  const current = model.value || []
  model.value = [...current, { name }]
  newInterest.value = ''
}

function removeInterest(index: number) {
  const current = [...(model.value || [])]
  current.splice(index, 1)
  model.value = current
}
</script>

<template>
  <div class="space-y-3 w-full">
    <div class="flex gap-2">
      <input
        v-model="newInterest"
        type="text"
        class="form-input flex-1 text-sm min-w-0"
        placeholder="Ex : Photographie, Bénévolat, Randonnée"
        @keyup.enter.prevent="addInterest"
      />
      <button
        type="button"
        class="px-4 py-2.5 bg-secondary text-white rounded-lg font-bold text-sm shrink-0 hover:bg-secondary-hover transition-colors flex items-center gap-1"
        @click="addInterest"
      >
        <UiPzIcon name="add" class="text-base" />
        <span>Ajouter</span>
      </button>
    </div>
    <div v-if="model && model.length" class="flex flex-wrap gap-2">
      <span
        v-for="(interest, index) in model"
        :key="index"
        class="inline-flex items-center gap-2 px-3.5 py-1.5 bg-surface-container rounded-full border border-outline-variant text-on-surface text-sm font-medium"
      >
        {{ getInterestName(interest) }}
        <button
          type="button"
          class="text-on-surface-variant hover:text-error transition-colors"
          @click="removeInterest(index)"
        >
          <UiPzIcon name="close" class="text-xs" />
        </button>
      </span>
    </div>
    <p v-else class="text-on-surface-variant text-xs italic">
      Cette section est optionnelle.
    </p>
  </div>
</template>
