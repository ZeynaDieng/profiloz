<script setup lang="ts">
import type { ResumeSnapshot } from "@profiloz/shared";

const props = defineProps<{ resume: ResumeSnapshot }>();
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
} = useResumeSections(() => props.resume);
</script>

<template>
  <TemplatesTemplateShell :resume="resume" template-name="Premium">
    <header class="mb-9 text-center">
      <div v-if="showPhotoBlock" class="flex justify-center mb-5">
        <ResumePhotoAvatar
          :photo-url="p.photoUrl"
          :initials="initials"
          :accent="accent"
          shape="circle"
          size-class="w-16 h-16"
          fallback-class="text-white font-light text-lg"
        />
      </div>
      <div class="h-px w-full bg-[#d4d4d4] mb-6" />

      <p
        class="text-[7.5pt] uppercase tracking-[0.28em] mb-3 font-medium"
        :style="{ color: accent }"
      >
        {{ p.jobTitle || "Votre poste" }}
      </p>

      <h1
        class="text-[22pt] font-light tracking-[0.18em] uppercase text-[#0f172a] leading-none"
      >
        {{ p.fullName || "Votre nom" }}
      </h1>

      <div class="flex items-center justify-center gap-4 my-5">
        <div class="h-px w-12 bg-[#d4d4d4]" />
        <div
          class="w-1.5 h-1.5 rotate-45"
          :style="{ backgroundColor: accent }"
        />
        <div class="h-px w-12 bg-[#d4d4d4]" />
      </div>

      <p class="text-[7.5pt] uppercase tracking-[0.2em] text-[#94a3b8]">
        {{ contactItems.join("   ·   ") }}
      </p>

      <div class="h-px w-full bg-[#d4d4d4] mt-6" />
    </header>

    <section v-if="hasSummary" class="mb-9 max-w-[400px] mx-auto text-center">
      <p class="text-[9.5pt] leading-[1.9] text-[#475569] font-light italic">
        {{ snapshot.summary }}
      </p>
    </section>

    <div
      v-if="hasSummary && (hasExperiences || hasEducations || hasSkills)"
      class="flex items-center gap-4 mb-8"
    >
      <div class="h-px flex-1 bg-[#e2e8f0]" />
      <div class="w-1 h-1 rotate-45 bg-[#cbd5e1]" />
      <div class="h-px flex-1 bg-[#e2e8f0]" />
    </div>

    <div class="grid grid-cols-[3fr_2fr] gap-10">
      <section v-if="hasExperiences">
        <h2
          class="text-[7pt] font-bold uppercase tracking-[0.28em] mb-5 pb-2"
          :style="{ color: accent, borderBottom: `1px solid ${accent}25` }"
        >
          Expérience
        </h2>
        <div
          v-for="(exp, i) in snapshot.experiences"
          :key="i"
          class="mb-6 pl-4 relative"
          :style="{ borderLeft: `1px solid ${accent}20` }"
        >
          <span
            class="absolute -left-[4px] top-[7px] w-[7px] h-[7px] rotate-45"
            :style="{ backgroundColor: accent }"
          />
          <ExperienceEntry
            :exp="exp"
            :accent="accent"
            period-class="text-[8pt] text-[#94a3b8]"
          />
        </div>
      </section>

      <div class="space-y-7">
        <section v-if="hasEducations">
          <h2
            class="text-[7pt] font-bold uppercase tracking-[0.28em] mb-4 pb-2"
            :style="{ color: accent, borderBottom: `1px solid ${accent}25` }"
          >
            Formation
          </h2>
          <div v-for="(edu, i) in snapshot.educations" :key="i" class="mb-3">
            <EducationEntry :edu="edu" :accent="accent" />
          </div>
        </section>

        <section v-if="hasSkills">
          <h2
            class="text-[7pt] font-bold uppercase tracking-[0.28em] mb-4 pb-2"
            :style="{ color: accent, borderBottom: `1px solid ${accent}25` }"
          >
            Compétences
          </h2>
          <ul class="space-y-2">
            <li
              v-for="(skill, i) in snapshot.skills"
              :key="i"
              class="flex items-center gap-2 text-[8.5pt] text-[#334155] font-light"
            >
              <span
                class="w-1 h-1 rotate-45 shrink-0"
                :style="{ backgroundColor: `${accent}70` }"
              />
              {{ skill.name }}
            </li>
          </ul>
        </section>
      </div>
    </div>
  </TemplatesTemplateShell>
</template>

<style scoped>
:deep(.resume-a4) {
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
}
</style>
