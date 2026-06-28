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
} = useResumeSections(() => props.resume);
</script>

<template>
  <TemplatesTemplateShell :resume="resume" template-name="Professionnel">
    <div
      class="grid grid-cols-[200px_1fr] min-h-full -mx-[var(--page-px,20mm)] -my-[var(--page-py,16mm)]"
    >
      <!-- Sidebar gauche sombre -->
      <aside
        class="px-6 py-8 space-y-7"
        :style="{ backgroundColor: `${accent}12` }"
      >
        <!-- Photo + identité -->
        <div class="text-center">
          <div
            v-if="p.photoUrl"
            class="w-20 h-20 rounded-full mx-auto mb-4 overflow-hidden border-[3px]"
            :style="{ borderColor: accent }"
          >
            <img :src="p.photoUrl" alt="" class="w-full h-full object-cover" />
          </div>
          <div
            v-else
            class="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-xl font-bold text-white"
            :style="{ backgroundColor: accent }"
          >
            {{ (p.fullName || "V")[0] }}
          </div>

          <h1
            class="text-[11pt] font-bold leading-snug tracking-tight text-[#0f172a]"
          >
            {{ p.fullName || "Votre nom" }}
          </h1>
          <p
            class="text-[8.5pt] font-semibold mt-1 uppercase tracking-wide"
            :style="{ color: accent }"
          >
            {{ p.jobTitle || "Votre poste" }}
          </p>
        </div>

        <!-- Contact -->
        <div v-if="contactItems.length">
          <h2
            class="text-[7pt] font-black uppercase tracking-[0.18em] mb-3 pb-1"
            :style="{ color: accent, borderBottom: `1.5px solid ${accent}` }"
          >
            Contact
          </h2>
          <ul class="space-y-1.5">
            <li
              v-for="item in contactItems"
              :key="item"
              class="text-[8.5pt] text-[#475569] leading-snug break-all"
            >
              {{ item }}
            </li>
          </ul>
        </div>

        <!-- Compétences -->
        <div v-if="hasSkills">
          <h2
            class="text-[7pt] font-black uppercase tracking-[0.18em] mb-3 pb-1"
            :style="{ color: accent, borderBottom: `1.5px solid ${accent}` }"
          >
            Compétences
          </h2>
          <ul class="space-y-1.5">
            <li
              v-for="(skill, i) in snapshot.skills"
              :key="i"
              class="text-[8.5pt] text-[#374151] flex items-start gap-2"
            >
              <span
                class="mt-[5px] w-1.5 h-1.5 rounded-full shrink-0"
                :style="{ backgroundColor: accent }"
              />
              {{ skill.name }}
            </li>
          </ul>
        </div>
      </aside>

      <!-- Contenu principal -->
      <main class="px-7 py-8 space-y-7">
        <!-- Profil -->
        <section v-if="hasSummary">
          <h2
            class="text-[7.5pt] font-black uppercase tracking-[0.18em] mb-3 flex items-center gap-2"
            :style="{ color: accent }"
          >
            <span>Profil</span>
            <span
              class="h-px flex-1 opacity-25"
              :style="{ backgroundColor: accent }"
            />
          </h2>
          <p
            class="text-[9.5pt] text-[#374151] leading-relaxed whitespace-pre-line"
          >
            {{ snapshot.summary }}
          </p>
        </section>

        <!-- Expériences -->
        <section v-if="hasExperiences">
          <h2
            class="text-[7.5pt] font-black uppercase tracking-[0.18em] mb-4 flex items-center gap-2"
            :style="{ color: accent }"
          >
            <span>Expérience</span>
            <span
              class="h-px flex-1 opacity-25"
              :style="{ backgroundColor: accent }"
            />
          </h2>
          <div
            v-for="(exp, i) in snapshot.experiences"
            :key="i"
            class="mb-5 pl-3 relative"
            :style="{ borderLeft: `2px solid ${accent}30` }"
          >
            <!-- Point de timeline -->
            <span
              class="absolute -left-[5px] top-[5px] w-2 h-2 rounded-full border-2 bg-white"
              :style="{ borderColor: accent }"
            />
            <ExperienceEntry
              :exp="exp"
              layout="inline-header"
              :accent="accent"
            />
          </div>
        </section>

        <!-- Formation -->
        <section v-if="hasEducations">
          <h2
            class="text-[7.5pt] font-black uppercase tracking-[0.18em] mb-4 flex items-center gap-2"
            :style="{ color: accent }"
          >
            <span>Formation</span>
            <span
              class="h-px flex-1 opacity-25"
              :style="{ backgroundColor: accent }"
            />
          </h2>
          <div
            v-for="(edu, i) in snapshot.educations"
            :key="i"
            class="mb-3 pl-3"
            :style="{ borderLeft: `2px solid ${accent}20` }"
          >
            <EducationEntry :edu="edu" />
          </div>
        </section>
      </main>
    </div>
  </TemplatesTemplateShell>
</template>
