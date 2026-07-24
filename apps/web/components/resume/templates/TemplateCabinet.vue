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
  <TemplatesTemplateShell :resume="resume" template-name="Cabinet">
    <div class="px-6 py-6 font-serif text-slate-800 bg-white min-h-full">
      <!-- Conservative Header -->
      <header class="flex items-center justify-between gap-6 pb-6 border-b-4 border-[#0f1e36] mb-6">
        <div>
          <h1 class="text-[22pt] font-serif font-bold text-[#0f1e36]">
            {{ p.fullName || 'Votre nom' }}
          </h1>
          <p class="text-sm uppercase tracking-[0.2em] text-[#0f1e36] mt-1 font-semibold">{{ p.jobTitle }}</p>
          <div class="flex flex-wrap gap-x-4 gap-y-0.5 mt-3 text-[8.5pt] text-slate-500 font-sans">
            <span v-for="item in contactItems" :key="item">{{ item }}</span>
          </div>
        </div>
        <div v-if="showPhotoBlock" class="shrink-0 border-2 border-[#0f1e36] p-0.5 w-16 h-20">
          <ResumePhotoAvatar
            :photo-url="p.photoUrl"
            :initials="initials"
            :accent="accent"
            shape="square"
            size-class="w-full h-full object-cover"
            fallback-class="text-xs font-serif"
          />
        </div>
      </header>

      <!-- Classical Grid -->
      <div class="grid grid-cols-12 gap-6">
        <main class="col-span-8 space-y-6">
          <section v-if="hasExperiences">
            <h2 class="text-xs font-sans font-bold uppercase tracking-wider text-[#0f1e36] border-b border-[#0f1e36] pb-1 mb-4">
              Expérience Professionnelle
            </h2>
            <div v-for="(exp, i) in snapshot.experiences" :key="i" class="mb-5 font-serif text-sm">
              <ExperienceEntry :exp="exp" period-class="text-xs font-sans text-slate-500 font-semibold" />
            </div>
          </section>
        </main>

        <aside class="col-span-4 space-y-6">
          <section v-if="hasEducations">
            <h2 class="text-xs font-sans font-bold uppercase tracking-wider text-[#0f1e36] border-b border-[#0f1e36] pb-1 mb-4">
              Formation
            </h2>
            <div v-for="(edu, i) in snapshot.educations" :key="i" class="mb-3 text-xs font-serif">
              <EducationEntry :edu="edu" />
            </div>
          </section>

          <section v-if="hasSkills">
            <h2 class="text-xs font-sans font-bold uppercase tracking-wider text-[#0f1e36] border-b border-[#0f1e36] pb-1 mb-4">
              Compétences
            </h2>
            <ul class="space-y-1.5 text-xs font-sans text-slate-700">
              <li v-for="(skill, i) in snapshot.skills" :key="i" class="list-disc list-inside">
                {{ skill.name }}
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  </TemplatesTemplateShell>
</template>
