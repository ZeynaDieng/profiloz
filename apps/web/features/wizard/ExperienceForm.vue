<script setup lang="ts">
import type { Experience } from '@profiloz/shared'

const model = defineModel<Experience[]>({ required: true })

function addItem() {
  model.value.push({
    company: '',
    position: '',
    location: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    description: '',
  })
}

function removeItem(index: number) {
  model.value.splice(index, 1)
}
</script>

<template>
  <div class="space-y-stack-lg w-full">
    <div
      v-for="(item, index) in model"
      :key="index"
      class="p-stack-md rounded-xl border border-outline-variant bg-surface-container-lowest space-y-4"
    >
      <div class="flex justify-between items-center">
        <span class="font-label-sm font-bold text-on-surface">Expérience {{ index + 1 }}</span>
        <button type="button" class="text-error text-label-sm" @click="removeItem(index)">Supprimer</button>
      </div>
      <UiFormField label="Entreprise" required>
        <input v-model="item.company" type="text" class="form-input w-full" required />
      </UiFormField>
      <UiFormField label="Poste" required>
        <input v-model="item.position" type="text" class="form-input w-full" required />
      </UiFormField>
      <UiFormField label="Lieu">
        <input v-model="item.location" type="text" class="form-input w-full" />
      </UiFormField>
      <div class="grid grid-cols-2 gap-4">
        <UiFormField label="Début">
          <input v-model="item.startDate" type="text" class="form-input w-full" placeholder="2021" />
        </UiFormField>
        <UiFormField label="Fin">
          <input v-model="item.endDate" type="text" class="form-input w-full" placeholder="Present" :disabled="item.isCurrent" />
        </UiFormField>
      </div>
      <label class="flex items-center gap-2 text-label-sm text-on-surface-variant">
        <input v-model="item.isCurrent" type="checkbox" class="rounded border-outline-variant" />
        Poste actuel
      </label>
      <UiFormField label="Description">
        <textarea v-model="item.description" rows="3" class="form-input w-full resize-none" />
      </UiFormField>
    </div>
    <button
      type="button"
      class="w-full py-3 border-2 border-dashed border-outline-variant rounded-xl text-secondary font-bold hover:border-secondary"
      @click="addItem"
    >
      + Ajouter une expérience
    </button>
  </div>
</template>
