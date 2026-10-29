<script setup lang="ts">
import type { ResumeSnapshot } from '@profiloz/shared'
import { formatSkillLevel } from '~/composables/useResumeSections'

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
  hasLanguages,
  hasInterests,
  showPhotoBlock,
  initials,
} = useResumeSections(() => props.resume)
</script>

<template>
  <TemplatesTemplateShell :resume="resume" template-name="Lagune">
    <!-- Maquette d'origine : 595pt de large → 1px maquette = 1pt -->
    <div class="lagune grid grid-cols-[200pt_minmax(0,1fr)] -m-[20mm] min-h-[297mm] text-[10pt] leading-[13.75pt] text-black">
      <!-- Colonne latérale -->
      <aside
        class="flex flex-col"
        :style="{ backgroundColor: accent.toLowerCase() === '#17abb3' ? '#f3fbfb' : `${accent}0f` }"
      >
        <div class="relative shrink-0" :class="showPhotoBlock ? 'h-[189pt]' : 'h-[100pt]'">
          <svg class="absolute left-0 top-0 w-full" viewBox="0 0 200 110" preserveAspectRatio="none" style="height: 110pt">
            <path d="M0 0H200V88.625C140 116.625 60 116.625 0 88.625Z" :fill="accent" />
          </svg>
          <h1 class="absolute inset-x-0 top-[26pt] px-4 text-center text-[15pt] font-bold leading-[18pt] text-white">
            {{ p.fullName || 'Votre nom' }}
          </h1>
          <div
            v-if="showPhotoBlock"
            class="absolute left-[35pt] top-[55.6pt] h-[130pt] w-[130pt] rounded-full bg-white p-[5pt]"
          >
            <ResumePhotoAvatar
              :photo-url="p.photoUrl"
              :initials="initials"
              :accent="accent"
              shape="circle"
              size-class="w-full h-full"
              fallback-class="text-white text-[28pt] font-bold"
            />
          </div>
        </div>

        <div class="flex flex-col gap-[22pt] px-[20pt] pt-[20pt] pb-[24pt]">
          <section>
            <h2 class="lagune-title" :style="{ color: accent }">Contact</h2>
            <div class="lagune-divider" />
            <ul class="mt-[8pt] space-y-[5pt]">
              <li v-for="item in contactItems" :key="item" class="break-words">{{ item }}</li>
            </ul>
          </section>

          <section v-if="hasSkills">
            <h2 class="lagune-title" :style="{ color: accent }">Compétences</h2>
            <div class="lagune-divider" />
            <ul class="mt-[8pt] space-y-[5pt]">
              <li v-for="(skill, i) in snapshot.skills" :key="i" class="flex items-start justify-between gap-2">
                <span class="min-w-0 break-words">{{ skill.name }}</span>
                <span v-if="formatSkillLevel(skill.level)" class="shrink-0 text-[8.5pt] text-[#666]">
                  {{ formatSkillLevel(skill.level) }}
                </span>
              </li>
            </ul>
          </section>

          <section v-if="hasLanguages">
            <h2 class="lagune-title" :style="{ color: accent }">Langues</h2>
            <div class="lagune-divider" />
            <ul class="mt-[8pt] space-y-[5pt]">
              <li v-for="(lang, i) in snapshot.languages" :key="i" class="flex justify-between gap-2">
                <span>{{ lang.name }}</span>
                <span v-if="lang.level" class="text-[8.5pt] text-[#666]">{{ lang.level }}</span>
              </li>
            </ul>
          </section>

          <section v-if="hasInterests">
            <h2 class="lagune-title" :style="{ color: accent }">Centres d'intérêt</h2>
            <div class="lagune-divider" />
            <ul class="mt-[8pt] space-y-[5pt]">
              <li v-for="(interest, i) in snapshot.interests" :key="i">{{ interest.name }}</li>
            </ul>
          </section>
        </div>
      </aside>

      <!-- Colonne principale -->
      <main class="flex flex-col gap-[22pt] px-[24pt] pt-[28pt] pb-[24pt] min-w-0">
        <header>
          <p class="text-[13pt] font-bold leading-[17pt]" :style="{ color: accent }">
            {{ p.jobTitle || 'Votre poste' }}
          </p>
        </header>

        <section v-if="hasSummary">
          <h2 class="lagune-title" :style="{ color: accent }">Profil</h2>
          <div class="lagune-divider" />
          <p class="mt-[8pt] whitespace-pre-line">{{ snapshot.summary }}</p>
        </section>

        <section v-if="hasExperiences">
          <h2 class="lagune-title" :style="{ color: accent }">Expérience professionnelle</h2>
          <div class="lagune-divider" />
          <div class="mt-[8pt] space-y-[12pt]">
            <ExperienceEntry v-for="(exp, i) in snapshot.experiences" :key="i" :exp="exp" :accent="accent" />
          </div>
        </section>

        <section v-if="hasEducations">
          <h2 class="lagune-title" :style="{ color: accent }">Formation</h2>
          <div class="lagune-divider" />
          <div class="mt-[8pt] space-y-[10pt]">
            <EducationEntry v-for="(edu, i) in snapshot.educations" :key="i" :edu="edu" :accent="accent" />
          </div>
        </section>
      </main>
    </div>
  </TemplatesTemplateShell>
</template>

<style scoped>
.lagune {
  font-family: Arial, Helvetica, 'Liberation Sans', sans-serif;
}

.lagune-title {
  font-size: 18pt;
  line-height: 24.75pt;
  font-weight: 400;
}

.lagune-divider {
  margin-top: 5.5pt;
  height: 0.5pt;
  background: #c8c8c8;
}
</style>
