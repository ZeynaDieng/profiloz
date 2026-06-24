<script setup lang="ts">
import type { ResumeSnapshot } from '@profiloz/shared'

const props = defineProps<{ resume: ResumeSnapshot }>()
const { accent, p, contactItems, snapshot, hasSummary, hasExperiences, hasEducations } = useResumeSections(
  () => props.resume,
)
</script>

<template>
  <TemplatesTemplateShell :resume="resume" template-name="Manager">
    <header class="text-center mb-8 pb-6 border-b border-outline-variant">
      <h1 class="text-3xl font-serif font-bold tracking-wide">{{ p.fullName || 'Votre nom' }}</h1>
      <p class="text-sm uppercase tracking-[0.2em] mt-2" :style="{ color: accent }">{{ p.jobTitle || 'Directeur' }}</p>
      <p class="text-xs text-on-surface-variant mt-4">{{ contactItems.join(' • ') }}</p>
    </header>

    <section v-if="hasSummary" class="mb-8 text-center max-w-lg mx-auto">
      <h2 class="text-xs font-bold uppercase tracking-widest mb-3" :style="{ color: accent }">Vision & leadership</h2>
      <p class="text-sm leading-relaxed text-on-surface-variant italic">{{ snapshot.summary }}</p>
    </section>

    <section v-if="hasExperiences" class="mb-6">
      <h2 class="text-xs font-bold uppercase tracking-widest mb-4 border-b pb-2" :style="{ borderColor: accent, color: accent }">
        Parcours exécutif
      </h2>
      <div v-for="(exp, i) in snapshot.experiences" :key="i" class="mb-5">
        <div class="flex justify-between items-baseline gap-4">
          <p class="font-bold">{{ exp.position }}</p>
          <p class="text-xs text-on-surface-variant shrink-0">{{ formatDateRange(exp.startDate, exp.endDate, exp.isCurrent) }}</p>
        </div>
        <p class="text-sm" :style="{ color: accent }">{{ exp.company }}</p>
        <p v-if="exp.description" class="text-sm text-on-surface-variant mt-2">{{ exp.description }}</p>
      </div>
    </section>

    <section v-if="hasEducations">
      <h2 class="text-xs font-bold uppercase tracking-widest mb-3" :style="{ color: accent }">Formation</h2>
      <p v-for="(edu, i) in snapshot.educations" :key="i" class="text-sm mb-1">
        {{ edu.degree }}, {{ edu.institution }}
      </p>
    </section>
  </TemplatesTemplateShell>
</template>

<style scoped>
:deep(.resume-a4) {
  font-family: Georgia, 'Times New Roman', serif;
}
</style>
