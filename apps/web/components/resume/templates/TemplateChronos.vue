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
  <TemplatesTemplateShell :resume="resume" template-name="Chronos">
    <div class="px-6 py-6 font-sans text-slate-800 bg-white min-h-full">
      <!-- Minimal Header -->
      <header class="flex items-center justify-between gap-6 pb-6 border-b mb-6">
        <div>
          <h1 class="text-3xl font-extrabold tracking-tight text-slate-900 leading-none">
            {{ p.fullName || 'Votre nom' }}
          </h1>
          <p class="text-xs uppercase tracking-widest text-slate-500 mt-2 font-bold">{{ p.jobTitle }}</p>
          <div class="flex flex-wrap gap-x-4 gap-y-0.5 mt-3 text-xs text-slate-400">
            <span v-for="item in contactItems" :key="item">{{ item }}</span>
          </div>
        </div>
        <div v-if="showPhotoBlock" class="shrink-0 rounded-full overflow-hidden w-16 h-16 border">
          <ResumePhotoAvatar
            :photo-url="p.photoUrl"
            :initials="initials"
            :accent="accent"
            shape="circle"
            size-class="w-16 h-16"
            fallback-class="text-md text-white font-bold"
          />
        </div>
      </header>

      <!-- Chronos Layout -->
      <div class="grid grid-cols-12 gap-6">
        <main class="col-span-8">
          <section v-if="hasExperiences">
            <h2 class="text-xs font-bold uppercase tracking-wider text-slate-900 mb-6">
              Chronologie Professionnelle
            </h2>
            <div class="relative border-l border-slate-200 pl-6 ml-2 space-y-6">
              <div v-for="(exp, i) in snapshot.experiences" :key="i" class="relative">
                <!-- Timeline Dot -->
                <div class="absolute -left-[30px] top-1.5 w-3 h-3 rounded-full border-2 border-white bg-slate-400" :style="{ backgroundColor: accent }" />
                <ExperienceEntry :exp="exp" period-class="text-xs text-slate-400 font-bold" />
              </div>
            </div>
          </section>
        </main>

        <aside class="col-span-4 space-y-6">
          <section v-if="hasSkills">
            <h2 class="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4 border-b pb-1">
              Compétences
            </h2>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="(skill, i) in snapshot.skills"
                :key="i"
                class="px-2 py-0.5 text-xs rounded bg-slate-100 text-slate-700"
              >
                {{ skill.name }}
              </span>
            </div>
          </section>

          <section v-if="hasEducations">
            <h2 class="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4 border-b pb-1">
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
