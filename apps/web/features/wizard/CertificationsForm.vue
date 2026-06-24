<script setup lang="ts">
import type { Certification } from '@profiloz/shared'

const model = defineModel<Certification[]>({ required: true })

function addItem() {
  model.value.push({ name: '', issuer: '', issueDate: '' })
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
        <span class="font-label-sm font-bold text-on-surface">Certification {{ index + 1 }}</span>
        <button type="button" class="text-error text-label-sm" @click="removeItem(index)">Supprimer</button>
      </div>
      <UiFormField label="Nom" required>
        <input v-model="item.name" type="text" class="form-input w-full" required />
      </UiFormField>
      <UiFormField label="Organisme">
        <input v-model="item.issuer" type="text" class="form-input w-full" />
      </UiFormField>
      <UiFormField label="Date">
        <input v-model="item.issueDate" type="text" class="form-input w-full" placeholder="2023" />
      </UiFormField>
    </div>
    <button
      type="button"
      class="w-full py-3 border-2 border-dashed border-outline-variant rounded-xl text-secondary font-bold hover:border-secondary"
      @click="addItem"
    >
      + Ajouter une certification
    </button>
  </div>
</template>
