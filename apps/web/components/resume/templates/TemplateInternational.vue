<script setup lang="ts">
import type { ResumeSnapshot } from '@profiloz/shared'

const props = defineProps<{ resume: ResumeSnapshot }>()
const { accent, p, contactItems, snapshot, hasExperiences, hasLanguages, hasEducations } = useResumeSections(
  () => props.resume,
)
</script>

<template>
  <TemplatesTemplateShell :resume="resume" template-name="International">
    <header class="flex justify-between items-start border-b-2 pb-4 mb-6" :style="{ borderColor: accent }">
      <div>
        <h1 class="text-2xl font-bold">{{ p.fullName || 'Votre nom' }}</h1>
        <p class="text-sm mt-1" :style="{ color: accent }">{{ p.jobTitle || 'Votre poste' }}</p>
      </div>
      <div class="text-xs text-right text-on-surface-variant space-y-1">
        <p v-for="item in contactItems" :key="item">{{ item }}</p>
      </div>
    </header>

    <section v-if="hasLanguages" class="mb-6">
      <h2 class="text-xs font-bold uppercase tracking-widest mb-3" :style="{ color: accent }">Langues</h2>
      <div class="grid grid-cols-2 gap-3">
        <div v-for="(lang, i) in snapshot.languages" :key="i" class="flex justify-between text-sm border-b border-outline-variant/30 pb-2">
          <span class="font-semibold">{{ lang.name }}</span>
          <span class="text-on-surface-variant text-xs">{{ lang.level }}</span>
        </div>
      </div>
    </section>

    <section v-if="hasExperiences" class="mb-6">
      <h2 class="text-xs font-bold uppercase tracking-widest mb-3" :style="{ color: accent }">Expérience internationale</h2>
      <div v-for="(exp, i) in snapshot.experiences" :key="i" class="mb-4">
        <p class="font-bold text-sm">{{ exp.position }} — {{ exp.company }}</p>
        <p class="text-xs text-on-surface-variant">
          {{ exp.location ? `${exp.location} • ` : '' }}{{ formatDateRange(exp.startDate, exp.endDate, exp.isCurrent) }}
        </p>
        <p v-if="exp.description" class="text-sm text-on-surface-variant mt-1">{{ exp.description }}</p>
      </div>
    </section>

    <section v-if="hasEducations">
      <h2 class="text-xs font-bold uppercase tracking-widest mb-3" :style="{ color: accent }">Formation</h2>
      <div v-for="(edu, i) in snapshot.educations" :key="i" class="text-sm mb-2">
        <span class="font-semibold">{{ edu.degree }}</span> — {{ edu.institution }}
      </div>
    </section>
  </TemplatesTemplateShell>
</template>
