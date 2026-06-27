<script setup lang="ts">
import type { ResumeSnapshot } from '@profiloz/shared'

const props = defineProps<{ resume: ResumeSnapshot }>()
const { accent, p, contactItems, snapshot, hasSummary, hasExperiences, hasSkills, hasEducations } = useResumeSections(
  () => props.resume,
)
</script>

<template>
  <TemplatesTemplateShell :resume="resume" template-name="Commercial">
    <header class="mb-6">
      <div class="flex justify-between items-start gap-4">
        <div>
          <h1 class="text-3xl font-black uppercase tracking-tight">{{ p.fullName || 'Votre nom' }}</h1>
          <p class="text-lg font-bold mt-1" :style="{ color: accent }">{{ p.jobTitle || 'Commercial' }}</p>
        </div>
        <div class="text-right text-xs text-on-surface-variant space-y-1">
          <p v-for="item in contactItems" :key="item">{{ item }}</p>
        </div>
      </div>
      <div class="h-1 w-24 mt-4 rounded" :style="{ backgroundColor: accent }" />
    </header>

    <section v-if="hasSummary" class="mb-6 p-4 rounded-lg" :style="{ backgroundColor: `${accent}10` }">
      <p class="text-sm font-medium leading-relaxed">{{ snapshot.summary }}</p>
    </section>

    <section v-if="hasExperiences" class="mb-6">
      <h2 class="text-sm font-black uppercase mb-4" :style="{ color: accent }">Résultats & expérience</h2>
      <div v-for="(exp, i) in snapshot.experiences" :key="i" class="mb-4 grid grid-cols-[auto_1fr] gap-4">
        <div class="w-2 rounded-full shrink-0" :style="{ backgroundColor: accent }" />
        <div>
          <ExperienceEntry :exp="exp" />
        </div>
      </div>
    </section>

    <section v-if="hasEducations" class="mb-6">
      <h2 class="text-sm font-black uppercase mb-3" :style="{ color: accent }">Formation</h2>
      <div v-for="(edu, i) in snapshot.educations" :key="i" class="mb-2">
        <EducationEntry :edu="edu" />
      </div>
    </section>

    <section v-if="hasSkills">
      <h2 class="text-sm font-black uppercase mb-3" :style="{ color: accent }">Expertises</h2>
      <div class="grid grid-cols-2 gap-2">
        <span v-for="(skill, i) in snapshot.skills" :key="i" class="text-sm font-semibold">• {{ skill.name }}</span>
      </div>
    </section>
  </TemplatesTemplateShell>
</template>
