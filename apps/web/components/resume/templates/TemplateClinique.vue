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
  <TemplatesTemplateShell :resume="resume" template-name="Clinique">
    <div class="px-6 py-6 font-sans text-slate-800 bg-white min-h-full">
      <!-- Clean Medical Header -->
      <header class="flex items-center gap-6 pb-6 border-b border-teal-200 mb-6">
        <div v-if="showPhotoBlock" class="shrink-0 border-2 border-teal-600 rounded-full overflow-hidden w-16 h-16">
          <ResumePhotoAvatar
            :photo-url="p.photoUrl"
            :initials="initials"
            :accent="accent"
            shape="circle"
            size-class="w-16 h-16"
            fallback-class="text-md text-white font-semibold"
          />
        </div>
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-teal-900">
            {{ p.fullName || 'Votre nom' }}
          </h1>
          <p class="text-xs uppercase tracking-wider text-teal-600 mt-1 font-bold">{{ p.jobTitle }}</p>
          <div class="flex flex-wrap gap-x-4 gap-y-0.5 mt-2 text-xs text-slate-500">
            <span v-for="item in contactItems" :key="item">{{ item }}</span>
          </div>
        </div>
      </header>

      <!-- Grid layout -->
      <div class="grid grid-cols-12 gap-6">
        <main class="col-span-8 space-y-6">
          <section v-if="hasExperiences">
            <h2 class="text-xs font-bold uppercase tracking-wider text-teal-800 border-b border-teal-100 pb-1 mb-4">
              Expériences & Pratiques Cliniques
            </h2>
            <div v-for="(exp, i) in snapshot.experiences" :key="i" class="mb-5 text-sm">
              <ExperienceEntry :exp="exp" period-class="text-xs text-slate-500 font-semibold" />
            </div>
          </section>
        </main>

        <aside class="col-span-4 space-y-6">
          <section v-if="hasEducations">
            <h2 class="text-xs font-bold uppercase tracking-wider text-teal-800 border-b border-teal-100 pb-1 mb-4">
              Diplômes & Études
            </h2>
            <div v-for="(edu, i) in snapshot.educations" :key="i" class="mb-3 text-xs">
              <EducationEntry :edu="edu" />
            </div>
          </section>

          <section v-if="hasSkills">
            <h2 class="text-xs font-bold uppercase tracking-wider text-teal-800 border-b border-teal-100 pb-1 mb-4">
              Compétences
            </h2>
            <ul class="space-y-1.5 text-xs text-slate-700">
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
