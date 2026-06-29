<script setup lang="ts">
import type { ResumeSnapshot } from '@profiloz/shared'
import { MSG } from '@profiloz/shared'
import { formatEducationPeriod } from '~/utils/education'

defineProps<{
  data: Partial<ResumeSnapshot>
}>()
</script>

<template>
  <div class="space-y-stack-md animate-in fade-in">
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <h3 class="text-xl font-bold text-on-surface">Aperçu extrait</h3>
      <span class="flex items-center gap-2 text-[#14B8A6] bg-[#14B8A6]/10 px-3 py-1 rounded-full text-xs font-bold">
        <UiPzIcon name="check_circle" class="text-[16px]" />
        Analyse terminée
      </span>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-gutter">
      <div
        v-if="data.personalInfo && (data.personalInfo.fullName || data.personalInfo.email || data.personalInfo.phone)"
        class="glass-card p-stack-md rounded-xl space-y-2"
      >
        <span class="text-xs text-outline uppercase tracking-wider">Informations</span>
        <h4 class="font-bold text-on-surface">{{ data.personalInfo.fullName || '—' }}</h4>
        <p v-if="data.personalInfo.jobTitle" class="text-sm text-secondary font-medium">
          {{ data.personalInfo.jobTitle }}
        </p>
        <p v-if="data.personalInfo.email" class="text-on-surface-variant text-sm">{{ data.personalInfo.email }}</p>
        <p v-if="data.personalInfo.phone" class="text-on-surface-variant text-sm">{{ data.personalInfo.phone }}</p>
        <p v-if="data.personalInfo.location" class="text-on-surface-variant text-sm">{{ data.personalInfo.location }}</p>
      </div>

      <div v-if="data.summary" class="glass-card p-stack-md rounded-xl md:col-span-2 space-y-2">
        <span class="text-xs text-outline uppercase tracking-wider">Profil</span>
        <p class="text-sm text-on-surface-variant leading-relaxed">{{ data.summary }}</p>
      </div>

      <div class="glass-card p-stack-md rounded-xl space-y-3">
        <span class="text-xs text-outline uppercase tracking-wider">Expérience</span>
        <template v-if="data.experiences?.length">
          <div v-for="(exp, i) in data.experiences" :key="i" class="border-l-2 border-secondary pl-4 space-y-0.5">
            <p v-if="exp.position" class="font-bold text-sm text-on-surface">{{ exp.position }}</p>
            <p v-if="exp.company" class="text-xs text-on-surface-variant">{{ exp.company }}</p>
            <p v-if="exp.location" class="text-xs text-on-surface-variant">{{ exp.location }}</p>
            <p v-if="formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)" class="text-xs text-on-surface-variant">
              {{ formatDateRange(exp.startDate, exp.endDate, exp.isCurrent) }}
            </p>
            <p v-if="exp.description?.trim()" class="text-xs text-on-surface-variant whitespace-pre-line mt-1">
              {{ exp.description }}
            </p>
          </div>
        </template>
        <p v-else class="text-sm text-on-surface-variant">{{ MSG.empty.noExperienceInDoc }}</p>
      </div>

      <div class="glass-card p-stack-md rounded-xl space-y-3">
        <span class="text-xs text-outline uppercase tracking-wider">Formation</span>
        <template v-if="data.educations?.length">
          <div v-for="(edu, i) in data.educations" :key="i" class="space-y-0.5">
            <p v-if="edu.degree" class="font-bold text-sm text-on-surface">{{ edu.degree }}</p>
            <p v-if="edu.institution" class="text-xs text-on-surface-variant">{{ edu.institution }}</p>
            <p v-if="edu.field" class="text-xs text-on-surface-variant">{{ edu.field }}</p>
            <p v-if="formatEducationPeriod(edu.startDate, edu.endDate)" class="text-xs text-on-surface-variant">
              {{ formatEducationPeriod(edu.startDate, edu.endDate) }}
            </p>
          </div>
        </template>
        <p v-else class="text-sm text-on-surface-variant">{{ MSG.empty.noEducationInDoc }}</p>
      </div>

      <div v-if="data.skills?.length" class="glass-card p-stack-md rounded-xl space-y-2">
        <span class="text-xs text-outline uppercase tracking-wider">Compétences</span>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="(skill, i) in data.skills.slice(0, 12)"
            :key="i"
            class="text-xs bg-surface-container-high px-2 py-1 rounded-md text-on-surface-variant"
          >
            {{ skill.name }}
          </span>
          <span v-if="data.skills.length > 12" class="text-xs text-outline">+{{ data.skills.length - 12 }}</span>
        </div>
      </div>

      <div class="glass-card p-stack-md rounded-xl space-y-2">
        <span class="text-xs text-outline uppercase tracking-wider">Langues</span>
        <p v-if="data.languages?.length" class="text-sm text-on-surface-variant">
          {{ data.languages.map((l) => l.name).join(', ') }}
        </p>
        <p v-else class="text-sm text-on-surface-variant">{{ MSG.empty.noLanguage }}</p>
      </div>

      <div v-if="data.certifications?.length" class="glass-card p-stack-md rounded-xl md:col-span-2 space-y-3">
        <span class="text-xs text-outline uppercase tracking-wider">Certifications</span>
        <div v-for="(cert, i) in data.certifications" :key="i">
          <p class="font-bold text-sm">{{ cert.name }}</p>
          <p v-if="cert.issuer" class="text-xs text-on-surface-variant">{{ cert.issuer }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
