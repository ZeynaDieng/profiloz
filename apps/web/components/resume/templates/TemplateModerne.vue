<script setup lang="ts">
import type { ResumeSnapshot } from "@profiloz/shared";
import { formatSkillLevel } from '~/composables/useResumeSections'

const props = defineProps<{ resume: ResumeSnapshot }>();
const {
  accent,
  p,
  contactItems,
  snapshot,
  hasSummary,
  hasExperiences,
  hasSkills,
  hasEducations,
  hasLanguages,
  hasInterests,
  showPhotoBlock,
  initials,
} = useResumeSections(() => props.resume);
</script>

<template>
  <TemplatesTemplateShell :resume="resume" template-name="Moderne">
    <div class="flex gap-0 -m-[20mm] min-h-[297mm]">
      <!-- Sidebar -->
      <aside
        class="w-[75mm] shrink-0 flex flex-col text-white relative overflow-hidden"
        :style="{ backgroundColor: accent }"
      >
        <!-- Cercle décoratif de fond -->
        <div
          class="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
          style="background: rgba(255, 255, 255, 0.06)"
        />
        <div
          class="absolute -bottom-6 -left-6 w-28 h-28 rounded-full pointer-events-none"
          style="background: rgba(255, 255, 255, 0.04)"
        />

        <div class="relative px-6 pt-6 pb-4">
          <!-- Avatar -->
          <div v-if="showPhotoBlock" class="mb-4">
            <div class="w-16 h-16 rounded-full border-[3px] border-white/30 overflow-hidden">
              <ResumePhotoAvatar
                :photo-url="p.photoUrl"
                :initials="initials"
                accent="#ffffff"
                shape="circle"
                size-class="w-full h-full"
                fallback-class="text-xl font-bold"
                :fallback-style="{ background: 'rgba(255, 255, 255, 0.15)' }"
              />
            </div>
          </div>

          <!-- Identité -->
          <h1 class="text-[13pt] font-bold leading-tight tracking-tight">
            {{ p.fullName || "Votre nom" }}
          </h1>
          <p
            class="text-[9pt] mt-0.5 font-medium"
            style="color: rgba(255, 255, 255, 0.75)"
          >
            {{ p.jobTitle || "Votre poste" }}
          </p>

          <!-- Séparateur -->
          <div class="mt-4 h-px" style="background: rgba(255, 255, 255, 0.2)" />

          <!-- Contact -->
          <ul class="mt-3 space-y-1">
            <li
              v-for="item in contactItems"
              :key="item"
              class="text-[8pt] leading-snug break-all"
              style="color: rgba(255, 255, 255, 0.82)"
            >
              {{ item }}
            </li>
          </ul>
        </div>

        <!-- Compétences -->
        <div v-if="hasSkills" class="relative px-6 pt-1 pb-3">
          <div class="h-px mb-3" style="background: rgba(255, 255, 255, 0.2)" />
          <h2
            class="text-[7.5pt] font-black uppercase tracking-[0.18em] mb-2"
            style="color: rgba(255, 255, 255, 0.6)"
          >Compétences</h2>
          <ul class="space-y-1.5">
            <li
              v-for="(skill, i) in snapshot.skills"
              :key="i"
              class="text-[8pt] flex items-center justify-between gap-1"
              style="color: rgba(255, 255, 255, 0.88)"
            >
              <div class="flex items-center gap-1.5 min-w-0">
                <span
                  class="w-1.5 h-1.5 rounded-full shrink-0"
                  style="background: rgba(255, 255, 255, 0.5)"
                />
                <span class="truncate">{{ skill.name }}</span>
              </div>
              <span v-if="formatSkillLevel(skill.level)" class="text-[7pt] shrink-0" style="color: rgba(255, 255, 255, 0.65)">
                {{ formatSkillLevel(skill.level) }}
              </span>
            </li>
          </ul>
        </div>

        <!-- Langues -->
        <div v-if="hasLanguages" class="relative px-6 pt-1 pb-3">
          <div class="h-px mb-3" style="background: rgba(255, 255, 255, 0.2)" />
          <h2
            class="text-[7.5pt] font-black uppercase tracking-[0.18em] mb-2"
            style="color: rgba(255, 255, 255, 0.6)"
          >Langues</h2>
          <ul class="space-y-1.5">
            <li
              v-for="(lang, i) in snapshot.languages"
              :key="i"
              class="text-[8pt] flex items-center justify-between gap-1"
              style="color: rgba(255, 255, 255, 0.88)"
            >
              <span class="font-semibold">{{ lang.name }}</span>
              <span v-if="lang.level" class="text-[7pt]" style="color: rgba(255, 255, 255, 0.65)">{{ lang.level }}</span>
            </li>
          </ul>
        </div>

        <!-- Centres d'intérêt -->
        <div v-if="hasInterests" class="relative px-6 pt-1 pb-4">
          <div class="h-px mb-3" style="background: rgba(255, 255, 255, 0.2)" />
          <h2
            class="text-[7.5pt] font-black uppercase tracking-[0.18em] mb-2"
            style="color: rgba(255, 255, 255, 0.6)"
          >Centres d'intérêt</h2>
          <ul class="space-y-1.5">
            <li
              v-for="(interest, i) in snapshot.interests"
              :key="i"
              class="text-[8pt] flex items-start gap-1.5"
              style="color: rgba(255, 255, 255, 0.88)"
            >
              <span
                class="mt-[5px] w-1.5 h-1.5 rounded-full shrink-0"
                style="background: rgba(255, 255, 255, 0.5)"
              />
              {{ interest.name }}
            </li>
          </ul>
        </div>
      </aside>

      <!-- Contenu principal -->
      <main class="flex-1 px-7 py-8 space-y-7 bg-white">
        <!-- Profil -->
        <section v-if="hasSummary">
          <div class="flex items-center gap-3 mb-3">
            <h2
              class="text-[7.5pt] font-black uppercase tracking-[0.18em] shrink-0"
              :style="{ color: accent }"
            >Profil</h2>
            <div
              class="h-px flex-1"
              :style="{ backgroundColor: `${accent}25` }"
            />
          </div>
          <p
            class="text-[9.5pt] text-[#374151] leading-relaxed whitespace-pre-line"
          >
            {{ snapshot.summary }}
          </p>
        </section>

        <!-- Expériences -->
        <section v-if="hasExperiences">
          <div class="flex items-center gap-3 mb-4">
            <h2
              class="text-[7.5pt] font-black uppercase tracking-[0.18em] shrink-0"
              :style="{ color: accent }"
            >Expérience</h2>
            <div
              class="h-px flex-1"
              :style="{ backgroundColor: `${accent}25` }"
            />
          </div>
          <div
            v-for="(exp, i) in snapshot.experiences"
            :key="i"
            class="mb-5 pl-4 relative"
            :style="{ borderLeft: `2px solid ${accent}35` }"
          >
            <span
              class="absolute -left-[5px] top-[6px] w-2 h-2 rounded-full bg-white border-2 shrink-0"
              :style="{ borderColor: accent }"
            />
            <ExperienceEntry :exp="exp" layout="inline-header" :accent="accent" />
          </div>
        </section>

        <!-- Formation -->
        <section v-if="hasEducations">
          <div class="flex items-center gap-3 mb-4">
            <h2
              class="text-[7.5pt] font-black uppercase tracking-[0.18em] shrink-0"
              :style="{ color: accent }"
            >Formation</h2>
            <div
              class="h-px flex-1"
              :style="{ backgroundColor: `${accent}25` }"
            />
          </div>
          <div
            v-for="(edu, i) in snapshot.educations"
            :key="i"
            class="mb-3 pl-4"
            :style="{ borderLeft: `2px solid ${accent}20` }"
          >
            <EducationEntry :edu="edu" layout="inline-header" :accent="accent" />
          </div>
        </section>
      </main>
    </div>
  </TemplatesTemplateShell>
</template>

<style scoped>
:deep(.resume-a4) {
  padding: 0;
}
</style>
