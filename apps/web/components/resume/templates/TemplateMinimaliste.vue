<script setup lang="ts">
import type { ResumeSnapshot } from '@profiloz/shared'

const props = defineProps<{ resume: ResumeSnapshot }>()
const { p, contactItems, snapshot, hasExperiences, hasEducations, hasSkills } = useResumeSections(() => props.resume)
</script>

<template>
  <TemplatesTemplateShell :resume="resume" template-name="Minimaliste">
    <header class="mb-10">
      <h1 class="text-4xl font-light tracking-tight">{{ p.fullName || 'Votre nom' }}</h1>
      <p class="text-sm text-on-surface-variant mt-2">{{ p.jobTitle }}</p>
      <p class="text-xs text-on-surface-variant/60 mt-4">{{ contactItems.join(' / ') }}</p>
    </header>

    <section v-if="hasExperiences" class="mb-8">
      <h2 class="text-[10px] uppercase tracking-[0.3em] text-on-surface-variant/50 mb-4">Expérience</h2>
      <div v-for="(exp, i) in snapshot.experiences" :key="i" class="mb-5">
        <p class="text-sm">{{ exp.position }}, {{ exp.company }}</p>
        <p class="text-xs text-on-surface-variant/60">{{ formatDateRange(exp.startDate, exp.endDate, exp.isCurrent) }}</p>
      </div>
    </section>

    <section v-if="hasEducations" class="mb-8">
      <h2 class="text-[10px] uppercase tracking-[0.3em] text-on-surface-variant/50 mb-4">Formation</h2>
      <p v-for="(edu, i) in snapshot.educations" :key="i" class="text-sm mb-2">{{ edu.degree }}, {{ edu.institution }}</p>
    </section>

    <section v-if="hasSkills">
      <h2 class="text-[10px] uppercase tracking-[0.3em] text-on-surface-variant/50 mb-4">Compétences</h2>
      <p class="text-sm text-on-surface-variant">{{ snapshot.skills.map((s) => s.name).join(', ') }}</p>
    </section>
  </TemplatesTemplateShell>
</template>
