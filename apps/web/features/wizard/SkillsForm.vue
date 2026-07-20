<script setup lang="ts">
import type { Skill, SkillLevel } from '@profiloz/shared'

const model = defineModel<Skill[]>({ required: true })
const newSkill = ref('')
const levels: SkillLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']
const levelLabels: Record<SkillLevel, string> = {
  BEGINNER: 'Débutant',
  INTERMEDIATE: 'Intermédiaire',
  ADVANCED: 'Avancé',
  EXPERT: 'Expert',
}

function addSkill() {
  const name = newSkill.value.trim()
  if (!name) return
  model.value.push({ name, level: 'INTERMEDIATE' })
  newSkill.value = ''
}

function removeSkill(index: number) {
  model.value.splice(index, 1)
}
</script>

<template>
  <div class="space-y-stack-lg w-full">
    <div class="flex gap-2">
      <input
        v-model="newSkill"
        type="text"
        class="form-input flex-1 min-w-0"
        placeholder="Ex : Figma, TypeScript, Gestion de projet"
        @keyup.enter.prevent="addSkill"
      />
      <button type="button" class="px-6 py-3 bg-secondary text-white rounded-lg font-bold" @click="addSkill">
        Ajouter
      </button>
    </div>
    <div v-if="model.length" class="space-y-3">
      <div
        v-for="(skill, index) in model"
        :key="index"
        class="flex items-center gap-4 p-4 rounded-xl border border-outline-variant bg-surface-container-lowest"
      >
        <span class="flex-1 font-medium text-on-surface">{{ skill.name }}</span>
        <select v-model="skill.level" class="form-input w-auto text-sm">
          <option v-for="level in levels" :key="level" :value="level">
            {{ levelLabels[level] }}
          </option>
        </select>
        <button type="button" class="text-error" @click="removeSkill(index)">
          <UiPzIcon name="close" />
        </button>
      </div>
    </div>
    <p v-else class="text-on-surface-variant text-sm">Ajoutez au moins 3 compétences pour un CV complet.</p>
  </div>
</template>
