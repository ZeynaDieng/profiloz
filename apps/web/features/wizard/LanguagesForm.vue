<script setup lang="ts">
import type { Language, LanguageLevel } from '@profiloz/shared'

const model = defineModel<Language[]>({ default: () => [] })
const newName = ref('')
const newLevel = ref<LanguageLevel>('PROFESSIONAL')

const levelOptions: Array<{ value: LanguageLevel; label: string }> = [
  { value: 'NATIVE', label: 'Maternelle' },
  { value: 'PROFESSIONAL', label: 'Courant' },
  { value: 'CONVERSATIONAL', label: 'Intermédiaire' },
  { value: 'BASIC', label: 'Notions' },
]

const levelLabels: Record<LanguageLevel, string> = {
  NATIVE: 'Langue maternelle',
  PROFESSIONAL: 'Courant / Professionnel',
  CONVERSATIONAL: 'Intermédiaire',
  BASIC: 'Notions / Débutant',
}

function addLanguage() {
  const name = newName.value.trim()
  if (!name) return
  const current = model.value || []
  model.value = [...current, { name, level: newLevel.value }]
  newName.value = ''
  newLevel.value = 'PROFESSIONAL'
}

function removeLanguage(index: number) {
  const current = [...(model.value || [])]
  current.splice(index, 1)
  model.value = current
}
</script>

<template>
  <div class="space-y-3 w-full">
    <div class="space-y-2">
      <div class="flex gap-2">
        <input
          v-model="newName"
          type="text"
          class="form-input flex-1 text-sm min-w-0"
          placeholder="Ex : Français, Anglais, Espagnol..."
          @keyup.enter.prevent="addLanguage"
        />
        <button
          type="button"
          class="px-5 py-2.5 bg-secondary text-white rounded-lg font-bold text-sm shrink-0 hover:bg-secondary-hover transition-colors"
          @click="addLanguage"
        >
          Ajouter
        </button>
      </div>

      <!-- Sélecteur de niveau sous forme de puces interactives -->
      <div class="flex flex-wrap gap-1.5 pt-1">
        <button
          v-for="opt in levelOptions"
          :key="opt.value"
          type="button"
          class="px-3 py-1 text-xs rounded-full border transition-all font-medium"
          :class="newLevel === opt.value
            ? 'bg-primary text-white border-primary font-bold shadow-xs'
            : 'bg-surface text-on-surface-variant border-outline-variant hover:bg-surface-container-high'"
          @click="newLevel = opt.value"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <!-- Liste des langues ajoutées -->
    <div v-if="model && model.length" class="space-y-2 pt-1">
      <div
        v-for="(lang, index) in model"
        :key="index"
        class="flex items-center justify-between gap-3 p-3 rounded-xl border border-outline-variant bg-surface-container-lowest"
      >
        <div class="flex items-center gap-2 min-w-0">
          <span class="font-semibold text-on-surface text-sm truncate">{{ lang.name }}</span>
          <span v-if="lang.level" class="text-xs text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
            {{ levelLabels[lang.level] }}
          </span>
        </div>
        <button
          type="button"
          class="text-error hover:text-error/80 p-1 shrink-0"
          aria-label="Supprimer la langue"
          @click="removeLanguage(index)"
        >
          <UiPzIcon name="close" class="text-base" />
        </button>
      </div>
    </div>
    <p v-else class="text-on-surface-variant text-xs italic">
      Ajoutez les langues que vous maîtrisez (ex: Français, Anglais...).
    </p>
  </div>
</template>
