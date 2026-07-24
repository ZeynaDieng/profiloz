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
  <TemplatesTemplateShell :resume="resume" template-name="Tech Lead">
    <div class="grid grid-cols-12 gap-6 min-h-full">
      <!-- Barre latérale sombre -->
      <aside class="col-span-4 bg-slate-900 -ml-[20mm] -my-[20mm] p-6 text-slate-300 flex flex-col gap-6">
        <div v-if="showPhotoBlock" class="self-center border-2 rounded-full overflow-hidden" :style="{ borderColor: accent }">
          <ResumePhotoAvatar
            :photo-url="p.photoUrl"
            :initials="initials"
            :accent="accent"
            shape="circle"
            size-class="w-24 h-24"
            fallback-class="text-xl font-mono text-white"
          />
        </div>
        
        <div>
          <h1 class="text-lg font-mono font-bold text-white tracking-tight leading-none">
            {{ p.fullName || 'Votre nom' }}
          </h1>
          <p class="text-xs font-mono mt-1 font-medium" :style="{ color: accent }">
            {{ p.jobTitle || 'Tech Lead' }}
          </p>
        </div>

        <!-- Contact info -->
        <div class="space-y-2 text-[8pt] font-mono">
          <h3 class="text-[7pt] font-mono font-bold uppercase tracking-wider text-slate-400">Contact</h3>
          <div v-for="item in contactItems" :key="item" class="break-all">{{ item }}</div>
        </div>

        <!-- Skills -->
        <div v-if="hasSkills" class="space-y-2">
          <h3 class="text-[7pt] font-mono font-bold uppercase tracking-wider text-slate-400">Stack Technique</h3>
          <div class="flex flex-wrap gap-1.5">
            <code
              v-for="(skill, i) in snapshot.skills"
              :key="i"
              class="px-1.5 py-[2px] text-[7.5pt] font-mono rounded bg-slate-800 border border-slate-700 text-white"
              :style="{ borderColor: `${accent}40` }"
            >
              {{ skill.name }}
            </code>
          </div>
        </div>
      </aside>

      <!-- Contenu principal -->
      <main class="col-span-8 py-2">
        <section v-if="hasExperiences" class="mb-6">
          <h2 class="text-xs font-mono font-bold uppercase tracking-wider mb-4 pb-1 border-b" :style="{ borderColor: `${accent}30` }">
            Expériences
          </h2>
          <div v-for="(exp, i) in snapshot.experiences" :key="i" class="mb-4">
            <ExperienceEntry :exp="exp" period-class="text-xs text-on-surface-variant/60 font-mono" />
          </div>
        </section>

        <section v-if="hasEducations" class="mb-6">
          <h2 class="text-xs font-mono font-bold uppercase tracking-wider mb-4 pb-1 border-b" :style="{ borderColor: `${accent}30` }">
            Formations
          </h2>
          <div v-for="(edu, i) in snapshot.educations" :key="i" class="mb-3">
            <EducationEntry :edu="edu" />
          </div>
        </section>
      </main>
    </div>
  </TemplatesTemplateShell>
</template>
