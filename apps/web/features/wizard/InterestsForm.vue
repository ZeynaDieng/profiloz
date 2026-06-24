<script setup lang="ts">
import type { Interest } from '@profiloz/shared'

const model = defineModel<Interest[]>({ required: true })
const newInterest = ref('')

function addInterest() {
  const name = newInterest.value.trim()
  if (!name) return
  model.value.push({ name })
  newInterest.value = ''
}

function removeInterest(index: number) {
  model.value.splice(index, 1)
}
</script>

<template>
  <div class="space-y-stack-lg w-full">
    <div class="flex gap-2">
      <input
        v-model="newInterest"
        type="text"
        class="form-input flex-1"
        placeholder="Ex : Photographie, Bénévolat, Randonnée"
        @keyup.enter.prevent="addInterest"
      />
      <button type="button" class="px-6 py-3 bg-secondary text-white rounded-lg font-bold" @click="addInterest">
        Ajouter
      </button>
    </div>
    <div v-if="model.length" class="flex flex-wrap gap-2">
      <span
        v-for="(interest, index) in model"
        :key="index"
        class="inline-flex items-center gap-2 px-4 py-2 bg-surface-container rounded-full border border-outline-variant text-on-surface"
      >
        {{ interest.name }}
        <button type="button" class="text-on-surface-variant hover:text-error" @click="removeInterest(index)">
          <UiPzIcon name="close" class="text-sm" />
        </button>
      </span>
    </div>
    <p v-else class="text-on-surface-variant text-sm">Cette section est optionnelle.</p>
  </div>
</template>
