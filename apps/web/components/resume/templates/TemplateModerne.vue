<script setup lang="ts">
import type { ResumeSnapshot } from '@profiloz/shared'

const props = defineProps<{ resume: ResumeSnapshot }>()
const { accent, p, contactItems, snapshot, hasSummary, hasExperiences, hasSkills } = useResumeSections(
  () => props.resume,
)
</script>

<template>
  <TemplatesTemplateShell :resume="resume" template-name="Moderne">
    <div class="flex gap-0 -m-[20mm] min-h-[297mm]">
      <aside class="w-[72mm] p-6 text-white shrink-0" :style="{ backgroundColor: accent }">
        <h1 class="text-lg font-bold leading-tight mb-1">{{ p.fullName || 'Votre nom' }}</h1>
        <p class="text-sm opacity-90 mb-6">{{ p.jobTitle || 'Votre poste' }}</p>
        <div class="text-xs space-y-2 opacity-90 mb-8">
          <p v-for="item in contactItems" :key="item">{{ item }}</p>
        </div>
        <section v-if="hasSkills">
          <h2 class="text-[10px] font-bold uppercase tracking-widest mb-3 opacity-80">Compétences</h2>
          <ul class="space-y-2 text-xs">
            <li v-for="(skill, i) in snapshot.skills" :key="i">{{ skill.name }}</li>
          </ul>
        </section>
      </aside>
      <main class="flex-1 p-6">
        <section v-if="hasSummary" class="mb-6">
          <h2 class="text-xs font-bold uppercase tracking-widest mb-2" :style="{ color: accent }">Profil</h2>
          <p class="text-sm text-on-surface-variant">{{ snapshot.summary }}</p>
        </section>
        <section v-if="hasExperiences">
          <h2 class="text-xs font-bold uppercase tracking-widest mb-3" :style="{ color: accent }">Expérience</h2>
          <div v-for="(exp, i) in snapshot.experiences" :key="i" class="mb-4">
            <p class="font-bold text-sm">{{ exp.position }}</p>
            <p class="text-xs" :style="{ color: accent }">{{ exp.company }}</p>
            <p class="text-xs text-on-surface-variant mt-1">{{ exp.description }}</p>
          </div>
        </section>
      </main>
    </div>
  </TemplatesTemplateShell>
</template>

<style scoped>
:deep(.resume-a4) {
  padding: 0;
  overflow: hidden;
}
</style>
