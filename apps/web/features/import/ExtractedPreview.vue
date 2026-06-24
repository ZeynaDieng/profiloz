<script setup lang="ts">
import type { ResumeSnapshot } from '@profiloz/shared'

defineProps<{
  data: Partial<ResumeSnapshot>
}>()
</script>

<template>
  <div class="space-y-stack-md animate-in fade-in">
    <div class="flex items-center justify-between">
      <h3 class="text-xl font-bold text-on-surface">Aperçu extrait</h3>
      <span class="flex items-center gap-2 text-[#14B8A6] bg-[#14B8A6]/10 px-3 py-1 rounded-full text-xs font-bold">
        <UiPzIcon name="check_circle" class="text-[16px]" />
        Analyse terminée
      </span>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-gutter">
      <div v-if="data.personalInfo" class="glass-card p-stack-md rounded-xl space-y-2">
        <span class="text-xs text-outline uppercase tracking-wider">Informations</span>
        <h4 class="font-bold text-on-surface">{{ data.personalInfo.fullName || '—' }}</h4>
        <p class="text-on-surface-variant text-sm">{{ data.personalInfo.email }}</p>
        <p class="text-on-surface-variant text-sm">{{ data.personalInfo.location }}</p>
      </div>
      <div v-if="data.experiences?.length" class="glass-card p-stack-md rounded-xl space-y-3">
        <span class="text-xs text-outline uppercase tracking-wider">Expérience</span>
        <div v-for="(exp, i) in data.experiences" :key="i" class="border-l-2 border-secondary pl-4">
          <p class="font-bold text-sm">{{ exp.position }}</p>
          <p class="text-xs text-on-surface-variant">{{ exp.company }} • {{ exp.startDate }}</p>
        </div>
      </div>
      <div v-if="data.educations?.length" class="glass-card p-stack-md rounded-xl md:col-span-2 space-y-3">
        <span class="text-xs text-outline uppercase tracking-wider">Formation</span>
        <div v-for="(edu, i) in data.educations" :key="i">
          <p class="font-bold text-sm">{{ edu.degree }}</p>
          <p class="text-xs text-on-surface-variant">{{ edu.institution }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
