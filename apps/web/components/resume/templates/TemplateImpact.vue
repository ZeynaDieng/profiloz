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
  <TemplatesTemplateShell :resume="resume" template-name="Impact">
    <div class="px-6 py-6 font-sans text-slate-800 bg-white min-h-full">
      <!-- Top banner layout -->
      <header class="flex items-center justify-between gap-6 pb-6 border-b-2" :style="{ borderColor: accent }">
        <div>
          <h1 class="text-3xl font-black tracking-tight uppercase" :style="{ color: accent }">
            {{ p.fullName || 'Votre nom' }}
          </h1>
          <p class="text-md font-semibold text-slate-600 mt-1">{{ p.jobTitle }}</p>
          <div class="flex flex-wrap gap-x-4 gap-y-0.5 mt-3 text-xs text-slate-400">
            <span v-for="item in contactItems" :key="item">{{ item }}</span>
          </div>
        </div>
        <div v-if="showPhotoBlock" class="shrink-0 rounded-xl overflow-hidden shadow-md w-20 h-20">
          <ResumePhotoAvatar
            :photo-url="p.photoUrl"
            :initials="initials"
            :accent="accent"
            shape="square"
            size-class="w-20 h-20"
            fallback-class="text-lg font-bold text-white"
          />
        </div>
      </header>

      <!-- Grid sections -->
      <div class="grid grid-cols-12 gap-6 mt-6">
        <main class="col-span-8 space-y-6">
          <section v-if="hasExperiences">
            <h2 class="text-sm font-bold uppercase tracking-wider mb-4 px-2 py-1 text-white rounded bg-slate-800 inline-block" :style="{ backgroundColor: accent }">
              Expériences Clés
            </h2>
            <div v-for="(exp, i) in snapshot.experiences" :key="i" class="mb-5 border-l-2 pl-4" :style="{ borderColor: `${accent}40` }">
              <ExperienceEntry :exp="exp" period-class="text-xs font-semibold text-slate-400" />
            </div>
          </section>
        </main>

        <aside class="col-span-4 space-y-6">
          <section v-if="hasSkills">
            <h2 class="text-sm font-bold uppercase tracking-wider mb-4 border-b pb-1" :style="{ borderColor: accent }">
              Compétences
            </h2>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="(skill, i) in snapshot.skills"
                :key="i"
                class="px-2 py-1 text-xs font-semibold rounded bg-slate-100 text-slate-700"
              >
                {{ skill.name }}
              </span>
            </div>
          </section>

          <section v-if="hasEducations">
            <h2 class="text-sm font-bold uppercase tracking-wider mb-4 border-b pb-1" :style="{ borderColor: accent }">
              Formations
            </h2>
            <div v-for="(edu, i) in snapshot.educations" :key="i" class="mb-3 text-xs">
              <EducationEntry :edu="edu" />
            </div>
          </section>
        </aside>
      </div>
    </div>
  </TemplatesTemplateShell>
</template>
