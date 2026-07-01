<script setup lang="ts">
import type { Experience } from '@profiloz/shared'
import type { ExperienceFieldKey } from '~/utils/experience'

const model = defineModel<Experience[]>({ required: true })

const props = defineProps<{
  fieldErrors?: Record<string, string>
}>()

function fieldError(index: number, field: ExperienceFieldKey) {
  return props.fieldErrors?.[`exp-${index}-${field}`] ?? ''
}

function hasItemErrors(index: number) {
  return Object.keys(props.fieldErrors ?? {}).some((key) => key.startsWith(`exp-${index}-`))
}

function addItem() {
  model.value.push({
    company: '',
    position: '',
    location: '',
    country: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    description: '',
    skillsUsed: [],
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
      :class="{ 'border-error/40': hasItemErrors(index) }"
    >
      <div class="flex justify-between items-center">
        <span class="font-label-sm font-bold text-on-surface">Expérience {{ index + 1 }}</span>
        <button type="button" class="text-error text-label-sm" @click="removeItem(index)">Supprimer</button>
      </div>
      <UiFormField label="Entreprise" required :error="fieldError(index, 'company')">
        <input v-model="item.company" type="text" class="form-input w-full" />
      </UiFormField>
      <UiFormField label="Poste" required :error="fieldError(index, 'position')">
        <input v-model="item.position" type="text" class="form-input w-full" />
      </UiFormField>
      <div class="grid grid-cols-2 gap-4">
        <UiFormField label="Ville" required :error="fieldError(index, 'location')">
          <input v-model="item.location" type="text" class="form-input w-full" placeholder="Ex. Dakar" />
        </UiFormField>
        <UiFormField label="Pays">
          <input v-model="item.country" type="text" class="form-input w-full" placeholder="Ex. Sénégal" />
        </UiFormField>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <UiFormField label="Début" required :error="fieldError(index, 'startDate')">
          <input v-model="item.startDate" type="text" class="form-input w-full" placeholder="2021" />
        </UiFormField>
        <UiFormField label="Fin" :required="!item.isCurrent" :error="fieldError(index, 'endDate')">
          <input
            v-model="item.endDate"
            type="text"
            class="form-input w-full"
            placeholder="2024"
            :disabled="item.isCurrent"
          />
        </UiFormField>
      </div>
      <label class="flex items-center gap-2 text-label-sm text-on-surface-variant">
        <input v-model="item.isCurrent" type="checkbox" class="rounded border-outline-variant" />
        Poste actuel
      </label>
      <UiFormField label="Description">
        <textarea
          v-model="item.description"
          rows="3"
          class="form-input w-full resize-none"
          placeholder="Missions, réalisations… (optionnel)"
        />
      </UiFormField>
      <UiFormField label="Compétences utilisées">
        <input
          type="text"
          class="form-input w-full"
          placeholder="Séparées par des virgules — Ex. Vue.js, SQL, Gestion de projet"
          :value="(item.skillsUsed ?? []).join(', ')"
          @input="item.skillsUsed = ($event.target as HTMLInputElement).value.split(',').map((s) => s.trim()).filter(Boolean)"
        />
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
