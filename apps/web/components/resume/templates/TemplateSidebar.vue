<script setup lang="ts">
import type { ResumeSnapshot } from '@profiloz/shared'

const props = defineProps<{ resume: ResumeSnapshot }>()

const {
  accent,
  p,
  contactItems,
  snapshot,
  hasSummary,
  hasExperiences,
  hasEducations,
  hasSkills,
  showPhotoBlock,
  initials,
} = useResumeSections(() => props.resume)
</script>

<template>
  <TemplatesTemplateShell :resume="resume" template-name="Épuré">
    <div class="grid grid-cols-[1fr_160px] gap-10 min-h-full">
      <main>
        <header class="mb-9">
          <div v-if="showPhotoBlock" class="mb-5">
            <ResumePhotoAvatar
              :photo-url="p.photoUrl"
              :initials="initials"
              :accent="accent"
              shape="circle"
              size-class="w-16 h-16"
              fallback-class="text-white text-sm font-light"
            />
          </div>
          <h1 class="text-[21pt] font-light tracking-tight text-[#0f172a] leading-none">
            {{ p.fullName || 'Votre nom' }}
          </h1>
          <p class="text-[9pt] uppercase tracking-[0.2em] mt-2 font-medium" :style="{ color: accent }">
            {{ p.jobTitle || 'Votre poste' }}
          </p>
          <div class="mt-5 h-px bg-[#e2e8f0]" />
        </header>

        <section v-if="hasSummary" class="mb-8">
          <h2 class="text-[7pt] uppercase tracking-[0.2em] font-bold text-[#94a3b8] mb-3">
            Profil
          </h2>
          <p class="text-[9.5pt] text-[#475569] leading-[1.8]">
            {{ snapshot.summary }}
          </p>
        </section>

        <section v-if="hasExperiences" class="mb-8">
          <h2 class="text-[7pt] uppercase tracking-[0.2em] font-bold text-[#94a3b8] mb-4">
            Expérience
          </h2>
          <div
            v-for="(exp, i) in snapshot.experiences"
            :key="i"
            class="mb-6 pl-4 relative"
            :style="{ borderLeft: `1.5px solid ${accent}25` }"
          >
            <span
              class="absolute -left-[4px] top-[7px] w-2 h-2 rounded-full bg-white border-2"
              :style="{ borderColor: accent }"
            />
            <ExperienceEntry :exp="exp" :accent="accent" />
          </div>
        </section>

        <section v-if="hasEducations">
          <h2 class="text-[7pt] uppercase tracking-[0.2em] font-bold text-[#94a3b8] mb-4">
            Formation
          </h2>
          <div
            v-for="(edu, i) in snapshot.educations"
            :key="i"
            class="mb-3 pl-4"
            :style="{ borderLeft: `1.5px solid ${accent}15` }"
          >
            <EducationEntry :edu="edu" :accent="accent" />
          </div>
        </section>
      </main>

      <aside class="pt-[56px] space-y-7">
        <div>
          <h2 class="text-[7pt] uppercase tracking-[0.2em] font-bold text-[#94a3b8] mb-3">
            Contact
          </h2>
          <ul class="space-y-2">
            <li
              v-for="item in contactItems"
              :key="item"
              class="text-[8pt] text-[#64748b] leading-snug break-all"
            >
              {{ item }}
            </li>
          </ul>
        </div>

        <div class="h-px bg-[#f1f5f9]" />

        <div v-if="hasSkills">
          <h2 class="text-[7pt] uppercase tracking-[0.2em] font-bold text-[#94a3b8] mb-3">
            Compétences
          </h2>
          <ul class="space-y-2">
            <li
              v-for="(skill, i) in snapshot.skills"
              :key="i"
              class="flex items-center gap-2 text-[8.5pt] text-[#334155]"
            >
              <span class="w-1 h-1 rounded-full shrink-0" :style="{ backgroundColor: accent }" />
              {{ skill.name }}
            </li>
          </ul>
        </div>
      </aside>
    </div>
  </TemplatesTemplateShell>
</template>
