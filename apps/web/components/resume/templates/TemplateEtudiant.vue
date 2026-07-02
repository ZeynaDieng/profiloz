<script setup lang="ts">
import type { ResumeSnapshot } from "@profiloz/shared";

const props = defineProps<{ resume: ResumeSnapshot }>();
const {
  accent,
  p,
  contactItems,
  snapshot,
  hasEducations,
  hasSkills,
  hasExperiences,
  showPhotoBlock,
  initials,
} = useResumeSections(() => props.resume);
</script>

<template>
  <TemplatesTemplateShell :resume="resume" template-name="Étudiant">
    <!-- Bandeau en-tête pleine largeur -->
    <header
      class="-mx-[var(--page-px,20mm)] px-[var(--page-px,20mm)] py-7 mb-8"
      :style="{ background: accent }"
    >
      <div class="flex items-end justify-between gap-6">
        <div class="flex items-end gap-4 min-w-0">
          <ResumePhotoAvatar
            v-if="showPhotoBlock"
            :photo-url="p.photoUrl"
            :initials="initials"
            accent="#ffffff"
            shape="circle"
            size-class="w-16 h-16"
            fallback-class="text-[#0f172a] font-bold text-lg"
            :fallback-style="{ backgroundColor: 'rgba(255,255,255,0.92)' }"
          />
          <div class="min-w-0">
            <h1
              class="text-[22pt] font-bold text-white leading-none tracking-tight"
            >
              {{ p.fullName || "Votre nom" }}
            </h1>
            <p
              class="text-[11pt] mt-2 font-medium"
              :style="{ color: 'rgba(255,255,255,0.75)' }"
            >
              {{ p.jobTitle || "Étudiant(e)" }}
            </p>
          </div>
        </div>

        <!-- Contact en ligne dans le bandeau -->
        <div
          class="text-right text-[8.5pt] space-y-[3px] pb-0.5"
          :style="{ color: 'rgba(255,255,255,0.8)' }"
        >
          <p v-for="item in contactItems" :key="item">{{ item }}</p>
        </div>
      </div>
    </header>

    <!-- Corps : sidebar gauche + contenu principal -->
    <div class="grid grid-cols-[150px_1fr] gap-8">
      <!-- Sidebar compétences -->
      <aside v-if="hasSkills" class="space-y-1">
        <h2
          class="text-[7.5pt] font-black uppercase tracking-[0.18em] mb-3 pb-1.5"
          :style="{ color: accent, borderBottom: `2px solid ${accent}` }"
        >
          Compétences
        </h2>
        <ul class="space-y-1.5">
          <li
            v-for="(skill, i) in snapshot.skills"
            :key="i"
            class="text-[9pt] text-[#374151] flex items-start gap-1.5"
          >
            <span
              class="mt-[5px] w-1.5 h-1.5 rounded-full shrink-0"
              :style="{ background: accent, opacity: '0.6' }"
            />
            {{ skill.name }}
          </li>
        </ul>
      </aside>

      <!-- Contenu principal -->
      <div>
        <!-- Formation -->
        <section v-if="hasEducations" class="mb-7">
          <h2
            class="text-[7.5pt] font-black uppercase tracking-[0.18em] mb-4 pb-1.5"
            :style="{ color: accent, borderBottom: `2px solid ${accent}` }"
          >
            Formation
          </h2>
          <div
            v-for="(edu, i) in snapshot.educations"
            :key="i"
            class="mb-4 pl-3"
            :style="{ borderLeft: `2px solid ${accent}20` }"
          >
            <EducationEntry
              :edu="edu"
              period-class="text-[8.5pt] text-on-surface-variant/70"
            />
          </div>
        </section>

        <!-- Stages & Expériences -->
        <section v-if="hasExperiences">
          <h2
            class="text-[7.5pt] font-black uppercase tracking-[0.18em] mb-4 pb-1.5"
            :style="{ color: accent, borderBottom: `2px solid ${accent}` }"
          >
            Stages & expériences
          </h2>
          <div
            v-for="(exp, i) in snapshot.experiences"
            :key="i"
            class="mb-4 pl-3"
            :style="{ borderLeft: `2px solid ${accent}40` }"
          >
            <ExperienceEntry :exp="exp" :accent="accent" />
          </div>
        </section>
      </div>
    </div>
  </TemplatesTemplateShell>
</template>
