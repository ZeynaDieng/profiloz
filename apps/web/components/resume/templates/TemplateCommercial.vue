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
  hasSkills,
  hasEducations,
  showPhotoBlock,
  initials,
} = useResumeSections(() => props.resume);
</script>

<template>
  <TemplatesTemplateShell :resume="resume" template-name="Commercial">
    <!-- En-tête -->
    <header
      class="mb-8 -mx-[20mm] -mt-[20mm] px-[20mm] pt-7 pb-6 relative overflow-hidden"
    >
      <div
        class="absolute inset-0 pointer-events-none"
        :style="{ backgroundColor: `${accent}08` }"
      />
      <div
        class="absolute bottom-0 left-0 right-0 h-[3px]"
        :style="{ backgroundColor: accent }"
      />

      <div class="relative flex items-start justify-between gap-6">
        <div class="flex items-start gap-4">
          <!-- Avatar initiales -->
          <ResumePhotoAvatar
            v-if="showPhotoBlock"
            :photo-url="p.photoUrl"
            :initials="initials"
            :accent="accent"
            shape="rounded"
            size-class="w-14 h-14"
            fallback-class="text-white text-lg font-black"
          />

          <div>
            <h1
              class="text-[18pt] font-black uppercase tracking-tight leading-none text-[#0f172a]"
            >
              {{ p.fullName || "Votre nom" }}
            </h1>
            <p class="text-[11pt] font-bold mt-1.5" :style="{ color: accent }">
              {{ p.jobTitle || "Commercial" }}
            </p>
          </div>
        </div>

        <!-- Contact -->
        <div
          class="text-right text-[8.5pt] text-[#64748b] space-y-[3px] pt-1 shrink-0"
        >
          <p v-for="item in contactItems" :key="item">{{ item }}</p>
        </div>
      </div>
    </header>

    <!-- Profil -->
    <section v-if="hasSummary" class="mb-7">
      <div
        class="px-5 py-4 rounded-lg border-l-4 text-[9.5pt] font-medium leading-relaxed text-[#1e293b]"
        :style="{ backgroundColor: `${accent}08`, borderColor: accent }"
      >
        {{ snapshot.summary }}
      </div>
    </section>

    <!-- Expériences -->
    <section v-if="hasExperiences" class="mb-7">
      <h2
        class="text-[7.5pt] font-black uppercase tracking-[0.18em] mb-4 flex items-center gap-2"
        :style="{ color: accent }"
      >
        <span>Résultats & expérience</span>
        <span
          class="h-px flex-1 opacity-20"
          :style="{ backgroundColor: accent }"
        />
      </h2>

      <div
        v-for="(exp, i) in snapshot.experiences"
        :key="i"
        class="mb-5 pl-4 relative"
        :style="{ borderLeft: `2px solid ${accent}35` }"
      >
        <span
          class="absolute -left-[5px] top-[6px] w-2.5 h-2.5 rounded-sm rotate-45 shrink-0"
          :style="{ backgroundColor: accent }"
        />
        <ExperienceEntry :exp="exp" :accent="accent" />
      </div>
    </section>

    <!-- Formation -->
    <section v-if="hasEducations" class="mb-7">
      <h2
        class="text-[7.5pt] font-black uppercase tracking-[0.18em] mb-4 flex items-center gap-2"
        :style="{ color: accent }"
      >
        <span>Formation</span>
        <span
          class="h-px flex-1 opacity-20"
          :style="{ backgroundColor: accent }"
        />
      </h2>
      <div
        v-for="(edu, i) in snapshot.educations"
        :key="i"
        class="mb-3 pl-4"
        :style="{ borderLeft: `2px solid ${accent}20` }"
      >
        <EducationEntry :edu="edu" :accent="accent" />
      </div>
    </section>

    <!-- Expertises -->
    <section v-if="hasSkills">
      <h2
        class="text-[7.5pt] font-black uppercase tracking-[0.18em] mb-4 flex items-center gap-2"
        :style="{ color: accent }"
      >
        <span>Expertises</span>
        <span
          class="h-px flex-1 opacity-20"
          :style="{ backgroundColor: accent }"
        />
      </h2>
      <div class="grid grid-cols-2 gap-x-6 gap-y-2">
        <div
          v-for="(skill, i) in snapshot.skills"
          :key="i"
          class="flex items-center gap-2 text-[9.5pt] font-semibold text-[#1e293b]"
        >
          <span
            class="w-1.5 h-1.5 rounded-sm rotate-45 shrink-0"
            :style="{ backgroundColor: accent }"
          />
          {{ skill.name }}
        </div>
      </div>
    </section>
  </TemplatesTemplateShell>
</template>
