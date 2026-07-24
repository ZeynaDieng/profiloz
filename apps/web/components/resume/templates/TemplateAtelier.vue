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
  <TemplatesTemplateShell :resume="resume" template-name="Atelier">
    <div class="px-6 py-6 font-serif text-amber-950 bg-[#fdfaf6] min-h-full">
      <!-- Minimal Asymmetric Header -->
      <header class="grid grid-cols-12 gap-6 mb-8 pb-6 border-b border-amber-900/20">
        <div class="col-span-8">
          <h1 class="text-3xl font-serif tracking-wide text-amber-950">
            {{ p.fullName || 'Votre nom' }}
          </h1>
          <p class="text-sm font-sans tracking-widest uppercase text-amber-800/80 mt-1 font-semibold">{{ p.jobTitle }}</p>
          <div class="flex flex-wrap gap-x-4 gap-y-0.5 mt-4 text-xs font-sans text-amber-900/60">
            <span v-for="item in contactItems" :key="item">{{ item }}</span>
          </div>
        </div>
        <div v-if="showPhotoBlock" class="col-span-4 justify-self-end w-20 h-20 rounded-2xl overflow-hidden border border-amber-900/10">
          <ResumePhotoAvatar
            :photo-url="p.photoUrl"
            :initials="initials"
            :accent="accent"
            shape="square"
            size-class="w-20 h-20"
            fallback-class="text-lg font-bold text-amber-800"
          />
        </div>
      </header>

      <!-- Layout content -->
      <div class="grid grid-cols-12 gap-6">
        <main class="col-span-8 space-y-6">
          <section v-if="hasExperiences">
            <h2 class="text-xs font-sans font-bold uppercase tracking-wider text-amber-800 border-b border-amber-900/10 pb-1 mb-4">
              Créations & Expériences
            </h2>
            <div v-for="(exp, i) in snapshot.experiences" :key="i" class="mb-5 text-sm font-serif">
              <ExperienceEntry :exp="exp" period-class="text-xs font-sans text-amber-900/50" />
            </div>
          </section>
        </main>

        <aside class="col-span-4 space-y-6">
          <section v-if="hasSkills">
            <h2 class="text-xs font-sans font-bold uppercase tracking-wider text-amber-800 border-b border-amber-900/10 pb-1 mb-4">
              Techniques & Savoirs
            </h2>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="(skill, i) in snapshot.skills"
                :key="i"
                class="px-2 py-1 text-xs font-sans rounded bg-amber-100/50 text-amber-950 border border-amber-900/10"
              >
                {{ skill.name }}
              </span>
            </div>
          </section>

          <section v-if="hasEducations">
            <h2 class="text-xs font-sans font-bold uppercase tracking-wider text-amber-800 border-b border-amber-900/10 pb-1 mb-4">
              Apprentissage
            </h2>
            <div v-for="(edu, i) in snapshot.educations" :key="i" class="mb-3 text-xs font-serif">
              <EducationEntry :edu="edu" />
            </div>
          </section>
        </aside>
      </div>
    </div>
  </TemplatesTemplateShell>
</template>
