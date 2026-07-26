<script setup lang="ts">
import type { Experience } from '@profiloz/shared'
import type { ExperienceFieldKey } from '~/utils/experience'
import { useAi } from '~/composables/useAi'

const model = defineModel<Experience[]>({ required: true })

const props = defineProps<{
  fieldErrors?: Record<string, string>
}>()

const { enhanceText, suggestBullets, loading: aiLoading } = useAi()
const activeAiIndex = ref<number | null>(null)
const aiActionType = ref<'enhance' | 'bullets' | null>(null)

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

async function handleEnhanceExperience(index: number) {
  const item = model.value[index]
  if (!item) return
  activeAiIndex.value = index
  aiActionType.value = 'enhance'
  const textToProcess = item.description?.trim() || `Rédige une description professionnelle percutante avec 3-4 puces de missions clés pour le poste de ${item.position || 'professionnel'}.`
  const context = item.position ? `Poste : ${item.position}` : undefined
  const result = await enhanceText(textToProcess, context)
  if (result) {
    item.description = result
  }
  activeAiIndex.value = null
  aiActionType.value = null
}

async function handleSuggestBullets(index: number) {
  const item = model.value[index]
  if (!item) return
  const positionToUse = item.position?.trim() || 'Professionnel Polyvalent'
  activeAiIndex.value = index
  aiActionType.value = 'bullets'
  const bullets = await suggestBullets(positionToUse)
  if (bullets && bullets.length > 0) {
    const formattedBullets = bullets.map((b: string) => `- ${b}`).join('\n')
    item.description = item.description ? `${item.description}\n${formattedBullets}` : formattedBullets
  }
  activeAiIndex.value = null
  aiActionType.value = null
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

      <UiFormField label="Entreprise" required :error="fieldError(index, 'company')" tooltip="Nom de la société, entreprise ou organisation (ex: Orange Sénégal, Google).">
        <input v-model="item.company" type="text" class="form-input w-full" placeholder="Orange Sénégal" />
      </UiFormField>

      <UiFormField label="Poste" required :error="fieldError(index, 'position')" tooltip="L'intitulé précis de votre poste (ex: Chef de projet digital, Développeur web). C'est le titre que le recruteur lira en premier.">
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="text-xs text-on-surface-variant">Nom de vos fonctions</span>
          <button
            v-if="item.position?.trim()"
            type="button"
            class="text-[11px] font-semibold text-primary hover:text-primary-hover flex items-center gap-1 bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded transition-colors"
            :disabled="aiLoading"
            @click="handleSuggestBullets(index)"
          >
            <span>{{ activeAiIndex === index && aiActionType === 'bullets' ? 'Génération...' : '💡 Suggérer des puces IA' }}</span>
          </button>
        </div>
        <input v-model="item.position" type="text" class="form-input w-full" placeholder="Chef de projet digital" />
      </UiFormField>

      <div class="grid grid-cols-2 gap-4">
        <UiFormField label="Ville" required :error="fieldError(index, 'location')" tooltip="La ville où se situait le poste (ex: Dakar, Paris).">
          <input v-model="item.location" type="text" class="form-input w-full" placeholder="Ex. Dakar" />
        </UiFormField>
        <UiFormField label="Pays" tooltip="Le pays où se situait le poste (ex: Sénégal, France).">
          <input v-model="item.country" type="text" class="form-input w-full" placeholder="Ex. Sénégal" />
        </UiFormField>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <UiFormField label="Début" required :error="fieldError(index, 'startDate')" tooltip="L'année ou la date de début (ex: '2021' ou '05/2021').">
          <input v-model="item.startDate" type="text" class="form-input w-full" placeholder="2021" />
        </UiFormField>
        <UiFormField label="Fin" :required="!item.isCurrent" :error="fieldError(index, 'endDate')" tooltip="L'année ou la date de fin (ex: '2024' ou '08/2024'). Laissez vide ou cochez 'Poste actuel' ci-dessous s'il s'agit de votre poste actuel.">
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

      <UiFormField label="Description" tooltip="Décrivez vos missions et vos résultats sous forme de puces courtes. Utilisez des verbes d'action au début de chaque ligne (ex: 'Coordonner l'équipe', 'Augmenter le chiffre d'affaires').">
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="text-xs text-on-surface-variant">Vos réalisations et tâches clés</span>
          <button
            type="button"
            class="text-[11px] font-semibold text-primary hover:text-primary-hover flex items-center gap-1 bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded transition-colors"
            :disabled="aiLoading"
            @click="handleEnhanceExperience(index)"
          >
            <span>{{ activeAiIndex === index && aiActionType === 'enhance' ? 'Génération...' : (item.description?.trim() ? '✨ Embellir' : '✨ Générer avec l’IA') }}</span>
          </button>
        </div>
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
      class="w-full py-3 border-2 border-dashed border-outline-variant rounded-xl text-secondary font-bold hover:border-secondary transition-colors"
      @click="addItem"
    >
      + Ajouter une expérience
    </button>
  </div>
</template>
