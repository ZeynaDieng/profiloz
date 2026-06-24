<script setup lang="ts">
import type { ResumeSnapshot } from '@profiloz/shared'

const props = defineProps<{ resume: ResumeSnapshot }>()
const { accent, p, contactItems, snapshot, hasExperiences, hasSkills, hasCertifications } = useResumeSections(
  () => props.resume,
)
</script>

<template>
  <TemplatesTemplateShell :resume="resume" template-name="Développeur">
    <header class="bg-[#0F172A] text-white -mx-[20mm] -mt-[20mm] px-[20mm] py-6 mb-6">
      <h1 class="text-2xl font-mono font-bold">{{ p.fullName || 'Votre nom' }}</h1>
      <p class="font-mono text-sm mt-1" :style="{ color: accent }">&lt;{{ p.jobTitle || 'Développeur' }} /&gt;</p>
      <div class="flex flex-wrap gap-3 mt-4 text-xs font-mono text-slate-300">
        <span v-for="item in contactItems" :key="item">{{ item }}</span>
      </div>
    </header>

    <section v-if="hasSkills" class="mb-6">
      <h2 class="font-mono text-xs font-bold uppercase mb-3" :style="{ color: accent }">// Stack</h2>
      <div class="flex flex-wrap gap-2">
        <code
          v-for="(skill, i) in snapshot.skills"
          :key="i"
          class="px-2 py-1 bg-slate-100 rounded text-xs font-mono"
        >
          {{ skill.name }}
        </code>
      </div>
    </section>

    <section v-if="hasExperiences" class="mb-6">
      <h2 class="font-mono text-xs font-bold uppercase mb-3" :style="{ color: accent }">// Expérience</h2>
      <div v-for="(exp, i) in snapshot.experiences" :key="i" class="mb-4 border-l-2 border-slate-200 pl-4">
        <p class="font-bold text-sm">{{ exp.position }} @ {{ exp.company }}</p>
        <p class="text-xs font-mono text-on-surface-variant">{{ formatDateRange(exp.startDate, exp.endDate, exp.isCurrent) }}</p>
        <p v-if="exp.description" class="text-sm text-on-surface-variant mt-1">{{ exp.description }}</p>
      </div>
    </section>

    <section v-if="hasCertifications">
      <h2 class="font-mono text-xs font-bold uppercase mb-3" :style="{ color: accent }">// Certifications</h2>
      <ul class="text-sm space-y-1">
        <li v-for="(cert, i) in snapshot.certifications" :key="i">{{ cert.name }} — {{ cert.issuer }}</li>
      </ul>
    </section>
  </TemplatesTemplateShell>
</template>

<style scoped>
:deep(.resume-a4) {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
</style>
