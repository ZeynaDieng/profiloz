<script setup lang="ts">
import type { ResumeSnapshot } from '@profiloz/shared'

const props = defineProps<{ resume: ResumeSnapshot }>()
const { accent, p, contactItems, snapshot, hasEducations, hasSkills, hasExperiences } = useResumeSections(
  () => props.resume,
)
</script>

<template>
  <TemplatesTemplateShell :resume="resume" template-name="Étudiant">
    <div class="grid grid-cols-[1fr_140px] gap-6">
      <div>
        <header class="mb-6">
          <h1 class="text-3xl font-bold" :style="{ color: accent }">{{ p.fullName || 'Votre nom' }}</h1>
          <p class="text-sm text-on-surface-variant mt-1">{{ p.jobTitle || 'Étudiant(e)' }}</p>
          <div class="text-xs text-on-surface-variant mt-3 space-y-1">
            <p v-for="item in contactItems" :key="item">{{ item }}</p>
          </div>
        </header>

        <section v-if="hasEducations" class="mb-6">
          <h2 class="text-xs font-bold uppercase tracking-widest mb-3" :style="{ color: accent }">Formation</h2>
          <div v-for="(edu, i) in snapshot.educations" :key="i" class="mb-4 pl-3 border-l-2" :style="{ borderColor: accent }">
            <p class="font-bold text-sm">{{ edu.degree }}</p>
            <p class="text-xs text-on-surface-variant">{{ edu.institution }}</p>
            <p class="text-xs text-on-surface-variant/70">{{ edu.endDate }}</p>
          </div>
        </section>

        <section v-if="hasExperiences">
          <h2 class="text-xs font-bold uppercase tracking-widest mb-3" :style="{ color: accent }">Stages & expériences</h2>
          <div v-for="(exp, i) in snapshot.experiences" :key="i" class="mb-3">
            <p class="text-sm font-semibold">{{ exp.position }}</p>
            <p class="text-xs text-on-surface-variant">{{ exp.company }} • {{ formatDateRange(exp.startDate, exp.endDate, exp.isCurrent) }}</p>
          </div>
        </section>
      </div>

      <aside v-if="hasSkills" class="bg-surface-container-low rounded-lg p-4 h-fit">
        <h2 class="text-xs font-bold uppercase mb-3" :style="{ color: accent }">Compétences</h2>
        <ul class="space-y-2">
          <li v-for="(skill, i) in snapshot.skills" :key="i" class="text-xs">{{ skill.name }}</li>
        </ul>
      </aside>
    </div>
  </TemplatesTemplateShell>
</template>
