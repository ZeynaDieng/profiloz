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

function moveUp(index: number) {
  if (index <= 0) return
  const item = model.value[index]
  model.value.splice(index, 1)
  model.value.splice(index - 1, 0, item)
  useResumeStore().setTemplateConfig({ customOrder: true })
}

function moveDown(index: number) {
  if (index >= model.value.length - 1) return
  const item = model.value[index]
  model.value.splice(index, 1)
  model.value.splice(index + 1, 0, item)
  useResumeStore().setTemplateConfig({ customOrder: true })
}

const draggedIndex = ref<number | null>(null)

function dragStart(event: DragEvent, index: number) {
  draggedIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', index.toString())
  }
}

function dropItem(event: DragEvent, toIndex: number) {
  const fromIndex = draggedIndex.value
  if (fromIndex === null || fromIndex === toIndex) return

  const item = model.value[fromIndex]
  model.value.splice(fromIndex, 1)
  model.value.splice(toIndex, 0, item)
  draggedIndex.value = null
  useResumeStore().setTemplateConfig({ customOrder: true })
}

function dragEnd() {
  draggedIndex.value = null
}
</script>

<template>
  <div class="space-y-stack-lg w-full">
    <div
      v-for="(item, index) in model"
      :key="index"
      class="p-stack-md rounded-xl border border-outline-variant bg-surface-container-lowest space-y-4 transition-all duration-200"
      :class="{ 
        'border-error/40': Object.keys(fieldErrors ?? {}).some((key) => key.startsWith(`edu-${index}-`)),
        'opacity-50 border-primary scale-[0.98]': draggedIndex === index
      }"
      draggable="true"
      @dragstart="dragStart($event, index)"
      @dragover.prevent
      @drop="dropItem($event, index)"
      @dragend="dragEnd"
    >
      <div class="flex justify-between items-center border-b border-outline-variant/30 pb-2">
        <div class="flex items-center gap-2">
          <!-- Poignée de glissement -->
          <UiPzIcon name="drag_indicator" class="text-on-surface-variant cursor-grab active:cursor-grabbing text-base" />
          <span class="font-label-sm font-bold text-on-surface">Formation {{ index + 1 }}</span>
        </div>
        
        <div class="flex items-center gap-3">
          <!-- Boutons de réorganisation rapides -->
          <div class="flex items-center gap-1">
            <button 
              type="button" 
              class="p-1 rounded hover:bg-surface-container text-on-surface-variant disabled:opacity-30 disabled:hover:bg-transparent"
              :disabled="index === 0"
              title="Monter"
              @click="moveUp(index)"
            >
              <UiPzIcon name="expand_less" class="text-base" />
            </button>
            <button 
              type="button" 
              class="p-1 rounded hover:bg-surface-container text-on-surface-variant disabled:opacity-30 disabled:hover:bg-transparent"
              :disabled="index === model.length - 1"
              title="Descendre"
              @click="moveDown(index)"
            >
              <UiPzIcon name="expand_more" class="text-base" />
            </button>
          </div>
          
          <button type="button" class="text-error text-label-sm font-bold hover:underline" @click="removeItem(index)">Supprimer</button>
        </div>
      </div>
      <UiFormField label="Établissement" required :error="fieldError(index, 'institution')" tooltip="Le nom de l'école ou de l'université (ex: HEC, Université Cheikh Anta Diop).">
        <input v-model="item.institution" type="text" class="form-input w-full" placeholder="Université Cheikh Anta Diop" />
      </UiFormField>
      <UiFormField label="Diplôme" required :error="fieldError(index, 'degree')" tooltip="L'intitulé exact de votre diplôme ou certification (ex: Licence, Master, Certificat de formation).">
        <input v-model="item.degree" type="text" class="form-input w-full" placeholder="Master Marketing" />
      </UiFormField>
      <UiFormField label="Domaine" required :error="fieldError(index, 'field')" tooltip="Votre spécialité d'études (ex: Finance, Marketing, Informatique).">
        <input v-model="item.field" type="text" class="form-input w-full" placeholder="Marketing digital" />
      </UiFormField>
      <div class="grid grid-cols-2 gap-4">
        <UiFormField label="Début" required :error="fieldError(index, 'startDate')" tooltip="L'année de début d'études (ex: '2018').">
          <input v-model="item.startDate" type="text" class="form-input w-full" placeholder="2018" />
        </UiFormField>
        <UiFormField label="Fin" required :error="fieldError(index, 'endDate')" tooltip="L'année d'obtention de votre diplôme ou la date prévue (ex: '2022' ou 'Présent' si toujours en cours).">
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
