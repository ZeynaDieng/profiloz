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
} = useResumeSections(() => props.resume);
</script>

<template>
  <TemplatesTemplateShell :resume="resume" template-name="Manager">
    <!-- En-tête centré prestige -->
    <header class="text-center mb-9 pb-7 relative">
      <!-- Monogramme -->
      <div
        class="w-14 h-14 rounded-full mx-auto mb-5 flex items-center justify-center text-white text-[15pt] font-serif font-bold border-2"
        :style="{ backgroundColor: accent, borderColor: `${accent}60` }"
      >
        {{
          (p.fullName || "V")
            .split(" ")
            .map((w: string) => w[0])
            .slice(0, 2)
            .join("")
        }}
      </div>

      <h1
        class="text-[20pt] font-serif font-bold tracking-wide leading-tight text-[#0f172a]"
      >
        {{ p.fullName || "Votre nom" }}
      </h1>
      <p
        class="text-[9pt] uppercase tracking-[0.25em] mt-2 font-semibold"
        :style="{ color: accent }"
      >
        {{ p.jobTitle || "Directeur" }}
      </p>

      <!-- Ornement central -->
      <div class="flex items-center justify-center gap-3 mt-5">
        <div class="h-px w-16" :style="{ backgroundColor: `${accent}40` }" />
        <div
          class="w-1.5 h-1.5 rotate-45"
          :style="{ backgroundColor: accent }"
        />
        <div class="h-px w-16" :style="{ backgroundColor: `${accent}40` }" />
      </div>

      <!-- Contact centré -->
      <p class="text-[8.5pt] text-[#64748b] mt-4 tracking-wide">
        {{ contactItems.join("  ·  ") }}
      </p>

      <!-- Double filet bas -->
      <div class="mt-6 space-y-[3px]">
        <div class="h-[2px] w-full" :style="{ backgroundColor: accent }" />
        <div class="h-px w-full bg-[#e2e8f0]" />
      </div>
    </header>

    <!-- Profil -->
    <section v-if="hasSummary" class="mb-8 text-center max-w-[420px] mx-auto">
      <h2
        class="text-[7.5pt] font-bold uppercase tracking-[0.22em] mb-4"
        :style="{ color: accent }"
      >
        Vision & leadership
      </h2>
      <p class="text-[9.5pt] font-serif leading-[1.8] text-[#334155] italic">
        {{ snapshot.summary }}
      </p>
    </section>

    <!-- Séparateur inter-sections -->
    <div
      v-if="hasSummary && hasExperiences"
      class="flex items-center gap-3 mb-7"
    >
      <div class="h-px flex-1 bg-[#e2e8f0]" />
      <div
        class="w-1 h-1 rotate-45"
        :style="{ backgroundColor: `${accent}50` }"
      />
      <div class="h-px flex-1 bg-[#e2e8f0]" />
    </div>

    <!-- Parcours exécutif -->
    <section v-if="hasExperiences" class="mb-7">
      <h2
        class="text-[7.5pt] font-bold uppercase tracking-[0.22em] mb-5 text-center"
        :style="{ color: accent }"
      >
        Parcours exécutif
      </h2>

      <div
        v-for="(exp, i) in snapshot.experiences"
        :key="i"
        class="mb-6 pl-5 relative"
        :style="{ borderLeft: `1px solid ${accent}25` }"
      >
        <!-- Point serif -->
        <span
          class="absolute -left-[4px] top-[7px] w-[7px] h-[7px] rotate-45"
          :style="{ backgroundColor: accent }"
        />
        <ExperienceEntry :exp="exp" :accent="accent" layout="inline-header" />
      </div>
    </section>

    <!-- Formation -->
    <section v-if="hasEducations">
      <div class="flex items-center gap-3 mb-4">
        <div class="h-px flex-1 bg-[#e2e8f0]" />
        <h2
          class="text-[7.5pt] font-bold uppercase tracking-[0.22em] shrink-0"
          :style="{ color: accent }"
        >
          Formation
        </h2>
        <div class="h-px flex-1 bg-[#e2e8f0]" />
      </div>

      <div
        v-for="(edu, i) in snapshot.educations"
        :key="i"
        class="mb-3 text-center"
      >
        <EducationEntry :edu="edu" :accent="accent" />
      </div>
    </section>
  </TemplatesTemplateShell>
</template>

<style scoped>
:deep(.resume-a4) {
  font-family: Georgia, "Times New Roman", serif;
}
</style>
