<script setup lang="ts">
import type { ResumeSnapshot } from '@profiloz/shared'

const props = defineProps<{ resume: ResumeSnapshot }>()
const { accent, p, contactItems, snapshot, hasSummary, hasExperiences, hasEducations, hasSkills } =
  useResumeSections(() => props.resume)
</script>

<template>
  <TemplatesTemplateShell :resume="resume" template-name="Professionnel">
    <header class="border-b-2 pb-4 mb-6 flex gap-4 items-start" :style="{ borderColor: accent }">
      <img
        v-if="p.photoUrl"
        :src="p.photoUrl"
        alt=""
        class="w-16 h-16 rounded-full object-cover shrink-0 border-2"
        :style="{ borderColor: accent }"
      />
      <div class="flex-1 min-w-0">
        <h1 class="text-2xl font-bold uppercase tracking-tight">{{ p.fullName || 'Votre nom' }}</h1>
        <p class="font-semibold uppercase text-sm mt-1" :style="{ color: accent }">{{ p.jobTitle || 'Votre poste' }}</p>
        <div class="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-on-surface-variant">
          <span v-for="item in contactItems" :key="item">{{ item }}</span>
        </div>
      </div>
    </header>

    <section v-if="hasSummary" class="mb-6">
      <h2 class="text-sm font-bold uppercase border-b border-outline-variant pb-1 mb-3">Profil</h2>
      <p class="text-sm text-on-surface-variant leading-relaxed">{{ snapshot.summary }}</p>
    </section>

    <section v-if="hasExperiences" class="mb-6">
      <h2 class="text-sm font-bold uppercase border-b border-outline-variant pb-1 mb-3">Expérience</h2>
      <div v-for="(exp, i) in snapshot.experiences" :key="i" class="mb-4">
        <div class="flex justify-between text-sm font-bold gap-4">
          <span>{{ exp.position }} — {{ exp.company }}</span>
          <span class="text-on-surface-variant font-normal shrink-0">
            {{ formatDateRange(exp.startDate, exp.endDate, exp.isCurrent) }}
          </span>
        </div>
        <p v-if="exp.description" class="text-sm text-on-surface-variant mt-1">{{ exp.description }}</p>
      </div>
    </section>

    <section v-if="hasEducations" class="mb-6">
      <h2 class="text-sm font-bold uppercase border-b border-outline-variant pb-1 mb-3">Formation</h2>
      <div v-for="(edu, i) in snapshot.educations" :key="i" class="mb-2">
        <p class="text-sm font-bold">{{ edu.degree }}</p>
        <p class="text-xs text-on-surface-variant">{{ edu.institution }} • {{ edu.endDate }}</p>
      </div>
    </section>

    <section v-if="hasSkills">
      <h2 class="text-sm font-bold uppercase border-b border-outline-variant pb-1 mb-3">Compétences</h2>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="(skill, i) in snapshot.skills"
          :key="i"
          class="px-2 py-1 text-xs rounded"
          :style="{ backgroundColor: `${accent}15`, color: accent }"
        >
          {{ skill.name }}
        </span>
      </div>
    </section>
  </TemplatesTemplateShell>
</template>
