<script setup lang="ts">
import type { Education } from '@profiloz/shared'
import type { EducationFieldKey } from '~/utils/education'

const model = defineModel<Education[]>({ required: true })

const props = defineProps<{
  fieldErrors?: Record<string, string>
}>()

function fieldError(index: number, field: EducationFieldKey) {
  return props.fieldErrors?.[`edu-${index}-${field}`] ?? ''
}

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
      :class="{ 'border-error/40': Object.keys(fieldErrors ?? {}).some((key) => key.startsWith(`edu-${index}-`)) }"
    >
      <div class="flex justify-between items-center">
        <span class="font-label-sm font-bold text-on-surface">Formation {{ index + 1 }}</span>
        <button type="button" class="text-error text-label-sm" @click="removeItem(index)">Supprimer</button>
      </div>
      <UiFormField label="Établissement" required :error="fieldError(index, 'institution')">
        <input v-model="item.institution" type="text" class="form-input w-full" />
      </UiFormField>
      <UiFormField label="Diplôme" required :error="fieldError(index, 'degree')">
        <input v-model="item.degree" type="text" class="form-input w-full" />
      </UiFormField>
      <UiFormField label="Domaine" required :error="fieldError(index, 'field')">
        <input v-model="item.field" type="text" class="form-input w-full" placeholder="Ex. Informatique, Commerce…" />
      </UiFormField>
      <div class="grid grid-cols-2 gap-4">
        <UiFormField label="Début" required :error="fieldError(index, 'startDate')">
          <input v-model="item.startDate" type="text" class="form-input w-full" placeholder="2018" />
        </UiFormField>
        <UiFormField label="Fin" required :error="fieldError(index, 'endDate')">
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
