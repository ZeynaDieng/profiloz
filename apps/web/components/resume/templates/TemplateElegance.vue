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
  <TemplatesTemplateShell :resume="resume" template-name="Élégance">
    <div class="px-6 py-4 font-serif text-slate-800 bg-[#faf9f6] min-h-full">
      <!-- Centered Header -->
      <header class="text-center mb-10 border-b border-slate-200 pb-8">
        <div v-if="showPhotoBlock" class="mx-auto mb-4 border border-slate-200 rounded-full overflow-hidden w-20 h-20">
          <ResumePhotoAvatar
            :photo-url="p.photoUrl"
            :initials="initials"
            :accent="accent"
            shape="circle"
            size-class="w-20 h-20"
            fallback-class="text-lg font-serif text-slate-500"
          />
        </div>
        <h1 class="text-3xl font-serif tracking-wide text-slate-900 mb-2 uppercase">{{ p.fullName || 'Votre nom' }}</h1>
        <p class="text-sm font-serif italic text-slate-500 uppercase tracking-widest mb-4">{{ p.jobTitle }}</p>
        <div class="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-slate-400 font-sans">
          <span v-for="item in contactItems" :key="item">{{ item }}</span>
        </div>
      </header>

      <!-- Grid Content -->
      <div class="grid grid-cols-12 gap-8">
        <main class="col-span-8 space-y-8">
          <section v-if="hasExperiences">
            <h2 class="text-xs uppercase tracking-[0.25em] text-slate-500 font-serif border-b border-slate-200 pb-2 mb-4">
              Parcours Professionnel
            </h2>
            <div v-for="(exp, i) in snapshot.experiences" :key="i" class="mb-6 font-serif">
              <ExperienceEntry :exp="exp" period-class="text-xs text-slate-400 font-sans italic" />
            </div>
          </section>
        </main>

        <aside class="col-span-4 space-y-8">
          <section v-if="hasEducations">
            <h2 class="text-xs uppercase tracking-[0.25em] text-slate-500 font-serif border-b border-slate-200 pb-2 mb-4">
              Cursus
            </h2>
            <div v-for="(edu, i) in snapshot.educations" :key="i" class="mb-4 text-sm font-serif">
              <EducationEntry :edu="edu" />
            </div>
          </section>

          <section v-if="hasSkills">
            <h2 class="text-xs uppercase tracking-[0.25em] text-slate-500 font-serif border-b border-slate-200 pb-2 mb-4">
              Expertises
            </h2>
            <ul class="space-y-1 text-sm font-sans text-slate-600">
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
