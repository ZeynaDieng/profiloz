<script setup lang="ts">
import type { Language, LanguageLevel } from '@profiloz/shared'

const model = defineModel<Language[]>({ default: () => [] })
const newName = ref('')
const newLevel = ref<LanguageLevel>('PROFESSIONAL')

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
    <div class="flex flex-col sm:flex-row gap-2">
      <input
        v-model="newName"
        type="text"
        class="form-input flex-1 text-sm min-w-0"
        placeholder="Ex : Français, Anglais, Espagnol..."
        @keyup.enter.prevent="addLanguage"
      />
      <div class="flex gap-2">
        <select v-model="newLevel" class="form-input flex-1 sm:w-auto text-xs sm:text-sm">
          <option value="NATIVE">Maternelle</option>
          <option value="PROFESSIONAL">Courant</option>
          <option value="CONVERSATIONAL">Intermédiaire</option>
          <option value="BASIC">Notions</option>
        </select>
        <button
          type="button"
          class="px-4 py-2.5 bg-secondary text-white rounded-lg font-bold text-sm shrink-0"
          @click="addLanguage"
        >
          Ajouter
        </button>
      </div>
    </div>

    <div v-if="model && model.length" class="space-y-2">
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
