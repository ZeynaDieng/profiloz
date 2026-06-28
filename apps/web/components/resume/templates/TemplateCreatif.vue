<script setup lang="ts">
import type { ResumeSnapshot } from "@profiloz/shared";

const props = defineProps<{ resume: ResumeSnapshot }>();
const {
  accent,
  p,
  contactItems,
  snapshot,
  hasExperiences,
  hasSkills,
  hasInterests,
  hasEducations,
} = useResumeSections(() => props.resume);

const initials = computed(() =>
  (p.value?.fullName || "")
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase(),
);
</script>

<template>
  <TemplatesTemplateShell :resume="resume" template-name="Créatif">
    <div class="grid grid-cols-[1fr_155px] gap-8 relative">
      <!-- Formes décoratives de fond -->
      <div
        class="absolute -top-[20mm] -right-[20mm] w-52 h-52 rounded-full pointer-events-none"
        :style="{ backgroundColor: `${accent}10` }"
      />
      <div
        class="absolute top-32 -left-[20mm] w-28 h-28 rotate-12 pointer-events-none"
        :style="{ backgroundColor: `${accent}07` }"
      />

      <!-- Colonne principale -->
      <div class="relative">
        <!-- En-tête -->
        <header class="mb-8">
          <p
            class="text-[7.5pt] font-black uppercase tracking-[0.22em] mb-2"
            :style="{ color: `${accent}80` }"
          >
            {{ p.jobTitle || "Créatif" }}
          </p>
          <h1
            class="text-[26pt] font-black leading-none tracking-tight"
            :style="{ color: accent }"
          >
            {{ p.fullName || "Votre nom" }}
          </h1>

          <!-- Trait signature -->
          <div class="flex items-center gap-2 mt-4">
            <div
              class="h-[3px] w-10 rounded-full"
              :style="{ backgroundColor: accent }"
            />
            <div
              class="h-[3px] w-3 rounded-full"
              :style="{ backgroundColor: `${accent}40` }"
            />
          </div>
        </header>

        <!-- Expérience -->
        <section v-if="hasExperiences" class="mb-7">
          <div
            class="inline-block text-[7pt] font-black uppercase tracking-[0.18em] text-white px-3 py-[5px] rounded-sm mb-4"
            :style="{ backgroundColor: accent }"
          >
            Expérience
          </div>
          <div
            v-for="(exp, i) in snapshot.experiences"
            :key="i"
            class="mb-5 pl-4 relative"
            :style="{ borderLeft: `3px solid ${accent}35` }"
          >
            <span
              class="absolute -left-[7px] top-[6px] w-[11px] h-[11px] rounded-sm rotate-45"
              :style="{ backgroundColor: accent }"
            />
            <ExperienceEntry :exp="exp" :accent="accent" />
          </div>
        </section>

        <!-- Formation -->
        <section v-if="hasEducations" class="mb-7">
          <div
            class="inline-block text-[7pt] font-black uppercase tracking-[0.18em] text-white px-3 py-[5px] rounded-sm mb-4"
            :style="{ backgroundColor: accent }"
          >
            Formation
          </div>
          <div
            v-for="(edu, i) in snapshot.educations"
            :key="i"
            class="mb-3 pl-4"
            :style="{ borderLeft: `3px solid ${accent}20` }"
          >
            <EducationEntry :edu="edu" :accent="accent" />
          </div>
        </section>

        <!-- Centres d'intérêt -->
        <section v-if="hasInterests">
          <div
            class="inline-block text-[7pt] font-black uppercase tracking-[0.18em] text-white px-3 py-[5px] rounded-sm mb-3"
            :style="{ backgroundColor: `${accent}70` }"
          >
            Centres d'intérêt
          </div>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="(interest, i) in snapshot.interests"
              :key="i"
              class="text-[8.5pt] px-2.5 py-1 rounded-full font-medium"
              :style="{
                backgroundColor: `${accent}12`,
                color: accent,
                border: `1px solid ${accent}25`,
              }"
            >
              {{ interest.name }}
            </span>
          </div>
        </section>
      </div>

      <!-- Sidebar droite -->
      <aside class="space-y-6 pt-1">
        <!-- Avatar -->
        <div class="flex justify-center">
          <div
            v-if="p.photoUrl"
            class="w-20 h-20 rounded-2xl overflow-hidden border-[3px]"
            :style="{ borderColor: accent }"
          >
            <img :src="p.photoUrl" alt="" class="w-full h-full object-cover" />
          </div>
          <div
            v-else
            class="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-xl font-black border-[3px]"
            :style="{
              backgroundColor: `${accent}20`,
              borderColor: accent,
              color: accent,
            }"
          >
            {{ initials }}
          </div>
        </div>

        <!-- Contact -->
        <div>
          <div
            class="text-[7pt] font-black uppercase tracking-[0.18em] mb-2.5 pb-1.5"
            :style="{ color: accent, borderBottom: `2px solid ${accent}30` }"
          >
            Contact
          </div>
          <ul class="space-y-1.5">
            <li
              v-for="item in contactItems"
              :key="item"
              class="text-[8pt] text-[#475569] leading-snug break-all"
            >
              {{ item }}
            </li>
          </ul>
        </div>

        <!-- Compétences -->
        <div v-if="hasSkills">
          <div
            class="text-[7pt] font-black uppercase tracking-[0.18em] mb-2.5 pb-1.5"
            :style="{ color: accent, borderBottom: `2px solid ${accent}30` }"
          >
            Compétences
          </div>
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="(skill, i) in snapshot.skills"
              :key="i"
              class="text-[8pt] px-2 py-[3px] rounded-sm font-medium"
              :style="{
                backgroundColor: `${accent}12`,
                color: accent,
              }"
            >
              {{ skill.name }}
            </span>
          </div>
        </div>
      </aside>
    </div>
  </TemplatesTemplateShell>
</template>
