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

function getLangName(item: any): string {
  if (!item) return ''
  if (typeof item === 'string') return item
  return item.name || item.language || item.label || item.value || ''
}

function getLangLevel(item: any): LanguageLevel {
  if (!item || typeof item !== 'object') return 'PROFESSIONAL'
  const lvl = String(item.level || '').toUpperCase()
  if (lvl.includes('NATI') || lvl.includes('MATER')) return 'NATIVE'
  if (lvl.includes('PROF') || lvl.includes('COUR')) return 'PROFESSIONAL'
  if (lvl.includes('CONV') || lvl.includes('INTER')) return 'CONVERSATIONAL'
  if (lvl.includes('BAS') || lvl.includes('NOTI') || lvl.includes('DEBU')) return 'BASIC'
  return (item.level as LanguageLevel) || 'PROFESSIONAL'
}

function addLanguage() {
  const name = newName.value.trim()
  if (!name) return
  const current = model.value || []
  model.value = [...current, { name, level: newLevel.value }]
  newName.value = ''
  newLevel.value = 'PROFESSIONAL'
}

function updateName(index: number, name: string) {
  const current = [...(model.value || [])]
  const existing = current[index]
  const level = getLangLevel(existing)
  current[index] = { name, level }
  model.value = current
}

function updateLevel(index: number, level: LanguageLevel) {
  const current = [...(model.value || [])]
  const existing = current[index]
  const name = getLangName(existing)
  current[index] = { name, level }
  model.value = current
}

function removeLanguage(index: number) {
  const current = [...(model.value || [])]
  current.splice(index, 1)
  model.value = current
}
</script>

<template>
  <div class="space-y-3 w-full">
    <!-- Barre d'ajout rapide -->
    <div class="space-y-2">
      <div class="flex gap-2">
        <input
          v-model="newName"
          type="text"
          class="form-input flex-1 text-sm min-w-0"
          placeholder="Ajouter une langue (ex: Français, Anglais...)"
          @keyup.enter.prevent="addLanguage"
        />
        <button
          type="button"
          class="px-4 py-2.5 bg-secondary text-white rounded-lg font-bold text-sm shrink-0 hover:bg-secondary-hover transition-colors flex items-center gap-1"
          @click="addLanguage"
        >
          <UiPzIcon name="add" class="text-base" />
          <span>Ajouter</span>
        </button>
      </div>

      <!-- Sélecteur de niveau pour la nouvelle langue -->
      <div class="flex flex-wrap gap-1.5 pt-0.5">
        <button
          v-for="opt in levelOptions"
          :key="opt.value"
          type="button"
          class="px-2.5 py-1 text-xs rounded-full border transition-all font-medium"
          :class="newLevel === opt.value
            ? 'bg-secondary text-white border-secondary font-bold shadow-xs'
            : 'bg-surface text-on-surface-variant border-outline-variant hover:bg-surface-container-high'"
          @click="newLevel = opt.value"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <!-- Liste des langues ajoutées avec saisie modifiable -->
    <div v-if="model && model.length" class="space-y-3 pt-2">
      <div
        v-for="(lang, index) in model"
        :key="index"
        class="p-3 rounded-xl border border-outline-variant/60 bg-surface-container-lowest space-y-2 shadow-xs"
      >
        <div class="flex items-center justify-between gap-2">
          <!-- Nom de la langue modifiable -->
          <input
            :value="getLangName(lang)"
            type="text"
            class="form-input flex-1 text-sm font-semibold text-on-surface bg-transparent border-b border-transparent hover:border-outline-variant focus:border-secondary focus:bg-white rounded px-2 py-1 transition-all"
            placeholder="Nom de la langue (ex: Français, Anglais...)"
            @input="updateName(index, ($event.target as HTMLInputElement).value)"
          />
          <button
            type="button"
            class="text-error hover:bg-error/10 p-1.5 rounded-lg shrink-0 transition-colors"
            title="Supprimer cette langue"
            @click="removeLanguage(index)"
          >
            <UiPzIcon name="close" class="text-lg" />
          </button>
        </div>

        <!-- Puces de niveau pour la langue -->
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="opt in levelOptions"
            :key="opt.value"
            type="button"
            class="px-2.5 py-0.5 text-[11px] rounded-full border transition-all font-medium"
            :class="getLangLevel(lang) === opt.value
              ? 'bg-secondary/15 text-secondary border-secondary/40 font-bold'
              : 'bg-surface text-on-surface-variant/70 border-outline-variant/40 hover:bg-surface-container'"
            @click="updateLevel(index, opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>
    </div>
    <p v-else class="text-on-surface-variant text-xs italic">
      Aucune langue ajoutée. Saisissez une langue ci-dessus.
    </p>
  </div>
</template>
