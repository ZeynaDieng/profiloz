<script setup lang="ts">
import { getSectionLabel } from '~/utils/labels'

const props = defineProps<{
  score: number
  missingSections: string[]
  resumeTitle?: string
  resumeId?: string
}>()

const statusLabel = computed(() => {
  if (props.score >= 85) return 'Excellent'
  if (props.score >= 65) return 'Bon profil'
  if (props.score >= 40) return 'En progression'
  return 'À compléter'
})

const suggestions = computed(() => {
  const defaults = [
    'Ajouter une compétence',
    'Ajouter une certification',
    'Ajouter une expérience',
  ]
  if (props.missingSections.length) {
    return props.missingSections.slice(0, 4).map((s) => getSectionLabel(s))
  }
  return defaults
})
</script>

<template>
  <aside class="glass-card rounded-xl p-stack-md border border-outline-variant">
    <div class="flex items-center justify-between mb-2">
      <h2 class="font-bold text-on-surface">Profil complété</h2>
      <span class="text-lg font-bold text-secondary">{{ score }}%</span>
    </div>

    <div class="w-full h-2 bg-outline-variant/20 rounded-full overflow-hidden mb-4">
      <div
        class="h-full rounded-full transition-all bg-secondary"
        :style="{ width: `${score}%` }"
      />
    </div>

    <p class="text-sm text-on-surface-variant mb-4">{{ statusLabel }}</p>

    <p v-if="resumeTitle" class="text-xs text-on-surface-variant mb-4">
      CV : <span class="font-semibold">{{ resumeTitle }}</span>
    </p>

    <div class="space-y-2">
      <p class="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Suggestions</p>
      <ul class="space-y-2 list-none">
        <li
          v-for="(suggestion, i) in suggestions"
          :key="i"
          class="flex gap-2 text-sm text-on-surface-variant"
        >
          <span class="text-secondary shrink-0" aria-hidden="true">·</span>
          <span>{{ suggestion }}</span>
        </li>
      </ul>
    </div>

    <NuxtLink
      v-if="resumeId"
      :to="`/creer/editeur?id=${resumeId}`"
      class="mt-4 inline-flex items-center gap-1 text-secondary text-sm font-bold hover:underline"
    >
      Améliorer ce CV
      <UiPzIcon name="open_in_new" class="text-[14px]" />
    </NuxtLink>
  </aside>
</template>
