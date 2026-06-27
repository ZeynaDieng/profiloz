<script setup lang="ts">
import type { Education } from '@profiloz/shared'

const model = defineModel<Education[]>({ required: true })

function addItem() {
  model.value.push({
    institution: '',
    degree: '',
    field: '',
    startDate: '',
    endDate: '',
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
        <span class="font-label-sm font-bold text-on-surface">Formation {{ index + 1 }}</span>
        <button type="button" class="text-error text-label-sm" @click="removeItem(index)">Supprimer</button>
      </div>
      <UiFormField label="Établissement" required>
        <input v-model="item.institution" type="text" class="form-input w-full" />
      </UiFormField>
      <UiFormField label="Diplôme" required>
        <input v-model="item.degree" type="text" class="form-input w-full" />
      </UiFormField>
      <UiFormField label="Domaine" required>
        <input v-model="item.field" type="text" class="form-input w-full" placeholder="Ex. Informatique, Commerce…" />
      </UiFormField>
      <div class="grid grid-cols-2 gap-4">
        <UiFormField label="Début" required>
          <input v-model="item.startDate" type="text" class="form-input w-full" placeholder="2018" />
        </UiFormField>
        <UiFormField label="Fin" required>
          <input v-model="item.endDate" type="text" class="form-input w-full" placeholder="2022" />
        </UiFormField>
      </div>
    </div>
    <button
      type="button"
      class="w-full py-3 border-2 border-dashed border-outline-variant rounded-xl text-secondary font-bold hover:border-secondary"
      @click="addItem"
    >
      + Ajouter une formation
    </button>
  </div>
</template>
