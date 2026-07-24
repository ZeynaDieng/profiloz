<script setup lang="ts">
import type { ResumeSnapshot } from '@profiloz/shared'

const props = defineProps<{ resume: ResumeSnapshot }>()
const {
  accent,
  p,
  contactItems,
  snapshot,
  hasExperiences,
  hasSkills,
  hasEducations,
} = useResumeSections(() => props.resume)
</script>

<template>
  <TemplatesTemplateShell :resume="resume" template-name="Académique">
    <div class="px-8 py-6 font-serif text-slate-900 bg-white min-h-full">
      <!-- Centered Traditional Header -->
      <header class="text-center mb-8 border-b-2 border-slate-900 pb-6">
        <h1 class="text-2xl font-bold font-serif tracking-wide uppercase mb-2">
          {{ p.fullName || 'Votre nom' }}
        </h1>
        <p class="text-sm font-serif italic text-slate-600 mb-4">{{ p.jobTitle }}</p>
        <div class="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs font-sans text-slate-500">
          <span v-for="item in contactItems" :key="item">{{ item }}</span>
        </div>
      </header>

      <!-- Single Column Content -->
      <main class="space-y-6">
        <section v-if="hasExperiences">
          <h2 class="text-sm font-sans font-bold uppercase tracking-widest text-slate-700 mb-4 border-b border-slate-300 pb-1">
            Expériences
          </h2>
          <div v-for="(exp, i) in snapshot.experiences" :key="i" class="mb-5 font-serif text-sm">
            <ExperienceEntry :exp="exp" period-class="text-xs font-sans text-slate-500 font-semibold" />
          </div>
        </section>

        <section v-if="hasEducations">
          <h2 class="text-sm font-sans font-bold uppercase tracking-widest text-slate-700 mb-4 border-b border-slate-300 pb-1">
            Formations & Cursus Académique
          </h2>
          <div v-for="(edu, i) in snapshot.educations" :key="i" class="mb-4 text-sm font-serif">
            <EducationEntry :edu="edu" />
          </div>
        </section>

        <section v-if="hasSkills">
          <h2 class="text-sm font-sans font-bold uppercase tracking-widest text-slate-700 mb-4 border-b border-slate-300 pb-1">
            Champs de Compétences
          </h2>
          <p class="text-sm text-slate-700 font-serif leading-relaxed">
            {{ snapshot.skills.map((s) => s.name).join(', ') }}
          </p>
        </section>
      </main>
    </div>
  </TemplatesTemplateShell>
</template>
