<script setup lang="ts">
import type { ResumeSnapshot } from '@profiloz/shared'

const props = defineProps<{ resume: ResumeSnapshot }>()
const {
  p,
  contactItems,
  snapshot,
  hasExperiences,
  hasSkills,
  hasEducations,
} = useResumeSections(() => props.resume)
</script>

<template>
  <TemplatesTemplateShell :resume="resume" template-name="ATS Friendly">
    <div class="px-8 py-6 font-sans text-black bg-white min-h-full leading-normal text-sm">
      <!-- Plain text header, centered -->
      <header class="text-center mb-6">
        <h1 class="text-xl font-bold tracking-normal uppercase mb-1">
          {{ p.fullName || 'Votre nom' }}
        </h1>
        <p class="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{{ p.jobTitle }}</p>
        <div class="text-xs text-slate-600">
          {{ contactItems.join('  |  ') }}
        </div>
      </header>

      <!-- All Single Column, simple typography, standard lists for ATS readability -->
      <main class="space-y-6">
        <section v-if="hasExperiences" class="border-t border-black pt-2">
          <h2 class="text-xs font-bold uppercase tracking-wider mb-3">
            Expérience Professionnelle
          </h2>
          <div v-for="(exp, i) in snapshot.experiences" :key="i" class="mb-4 text-xs">
            <ExperienceEntry :exp="exp" period-class="text-xs text-slate-500 font-bold" />
          </div>
        </section>

        <section v-if="hasEducations" class="border-t border-black pt-2">
          <h2 class="text-xs font-bold uppercase tracking-wider mb-3">
            Formation
          </h2>
          <div v-for="(edu, i) in snapshot.educations" :key="i" class="mb-3 text-xs">
            <EducationEntry :edu="edu" />
          </div>
        </section>

        <section v-if="hasSkills" class="border-t border-black pt-2">
          <h2 class="text-xs font-bold uppercase tracking-wider mb-3">
            Compétences
          </h2>
          <p class="text-xs text-slate-800">
            {{ snapshot.skills.map((s) => s.name).join(', ') }}
          </p>
        </section>
      </main>
    </div>
  </TemplatesTemplateShell>
</template>
