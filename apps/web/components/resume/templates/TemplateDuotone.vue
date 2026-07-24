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
  showPhotoBlock,
  initials,
} = useResumeSections(() => props.resume)
</script>

<template>
  <TemplatesTemplateShell :resume="resume" template-name="DuoTone">
    <div class="grid grid-cols-12 gap-0 min-h-full">
      <!-- Left side (Colored/Tinted) -->
      <aside class="col-span-5 bg-slate-100 -ml-[20mm] -my-[20mm] p-6 text-slate-800 flex flex-col gap-6">
        <div v-if="showPhotoBlock" class="self-center rounded-2xl overflow-hidden shadow-sm w-24 h-24">
          <ResumePhotoAvatar
            :photo-url="p.photoUrl"
            :initials="initials"
            :accent="accent"
            shape="square"
            size-class="w-24 h-24"
            fallback-class="text-xl font-bold text-white"
          />
        </div>
        
        <div>
          <h1 class="text-xl font-bold tracking-tight text-slate-900 leading-none">
            {{ p.fullName || 'Votre nom' }}
          </h1>
          <p class="text-xs uppercase tracking-widest text-slate-500 mt-2 font-bold">{{ p.jobTitle }}</p>
        </div>

        <div class="space-y-2 text-[8.5pt]">
          <h3 class="text-[7.5pt] uppercase font-bold tracking-wider text-slate-400">Coordonnées</h3>
          <div v-for="item in contactItems" :key="item" class="break-all">{{ item }}</div>
        </div>

        <div v-if="hasSkills" class="space-y-2">
          <h3 class="text-[7.5pt] uppercase font-bold tracking-wider text-slate-400">Savoir-faire</h3>
          <div class="flex flex-wrap gap-1">
            <span
              v-for="(skill, i) in snapshot.skills"
              :key="i"
              class="px-2 py-0.5 text-[8pt] rounded bg-white text-slate-700 font-medium"
            >
              {{ skill.name }}
            </span>
          </div>
        </div>
      </aside>

      <!-- Right side (White) -->
      <main class="col-span-7 pl-6 py-2">
        <section v-if="hasExperiences" class="mb-6">
          <h2 class="text-xs font-bold uppercase tracking-wider text-slate-800 border-b-2 pb-1 mb-4" :style="{ borderColor: accent }">
            Expériences
          </h2>
          <div v-for="(exp, i) in snapshot.experiences" :key="i" class="mb-4">
            <ExperienceEntry :exp="exp" period-class="text-xs text-slate-400 font-semibold" />
          </div>
        </section>

        <section v-if="hasEducations" class="mb-6">
          <h2 class="text-xs font-bold uppercase tracking-wider text-slate-800 border-b-2 pb-1 mb-4" :style="{ borderColor: accent }">
            Formations
          </h2>
          <div v-for="(edu, i) in snapshot.educations" :key="i" class="mb-3 text-sm">
            <EducationEntry :edu="edu" />
          </div>
        </section>
      </main>
    </div>
  </TemplatesTemplateShell>
</template>
