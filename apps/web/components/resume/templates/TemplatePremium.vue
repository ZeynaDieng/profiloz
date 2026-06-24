<script setup lang="ts">
import type { ResumeSnapshot } from '@profiloz/shared'

const props = defineProps<{ resume: ResumeSnapshot }>()
const { accent, p, contactItems, snapshot, hasSummary, hasExperiences, hasEducations, hasSkills } =
  useResumeSections(() => props.resume)
</script>

<template>
  <TemplatesTemplateShell :resume="resume" template-name="Premium">
    <header class="mb-6">
      <div class="h-px w-full bg-on-surface/20 mb-4" />
      <div class="flex justify-between items-end gap-6">
        <div>
          <h1 class="text-3xl font-light tracking-[0.15em] uppercase">{{ p.fullName || 'Votre nom' }}</h1>
          <p class="text-sm tracking-widest uppercase mt-2" :style="{ color: accent }">{{ p.jobTitle || 'Votre poste' }}</p>
        </div>
        <div class="text-[10px] text-right text-on-surface-variant uppercase tracking-wider space-y-1">
          <p v-for="item in contactItems" :key="item">{{ item }}</p>
        </div>
      </div>
      <div class="h-px w-full bg-on-surface/20 mt-4" />
    </header>

    <section v-if="hasSummary" class="mb-8 px-6 py-4 border border-outline-variant/40">
      <p class="text-sm leading-loose text-center text-on-surface-variant">{{ snapshot.summary }}</p>
    </section>

    <div class="grid grid-cols-2 gap-8">
      <section v-if="hasExperiences">
        <h2 class="text-[10px] font-bold uppercase tracking-[0.25em] mb-4" :style="{ color: accent }">Expérience</h2>
        <div v-for="(exp, i) in snapshot.experiences" :key="i" class="mb-4">
          <p class="text-sm font-semibold">{{ exp.position }}</p>
          <p class="text-xs text-on-surface-variant">{{ exp.company }}</p>
          <p class="text-[10px] text-on-surface-variant/60 mt-1">{{ formatDateRange(exp.startDate, exp.endDate, exp.isCurrent) }}</p>
        </div>
      </section>

      <div>
        <section v-if="hasEducations" class="mb-6">
          <h2 class="text-[10px] font-bold uppercase tracking-[0.25em] mb-4" :style="{ color: accent }">Formation</h2>
          <div v-for="(edu, i) in snapshot.educations" :key="i" class="mb-3">
            <p class="text-sm font-semibold">{{ edu.degree }}</p>
            <p class="text-xs text-on-surface-variant">{{ edu.institution }}</p>
          </div>
        </section>

        <section v-if="hasSkills">
          <h2 class="text-[10px] font-bold uppercase tracking-[0.25em] mb-4" :style="{ color: accent }">Compétences</h2>
          <ul class="text-sm space-y-1">
            <li v-for="(skill, i) in snapshot.skills" :key="i">{{ skill.name }}</li>
          </ul>
        </section>
      </div>
    </div>
  </TemplatesTemplateShell>
</template>

<style scoped>
:deep(.resume-a4) {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
}
</style>
