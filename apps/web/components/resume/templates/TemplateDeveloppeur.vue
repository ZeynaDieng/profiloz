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
  hasEducations,
  showPhotoBlock,
  initials,
} = useResumeSections(() => props.resume);

const hasCertifications = computed(
  () => !!snapshot.value?.certifications?.length,
);
</script>

<template>
  <TemplatesTemplateShell :resume="resume" template-name="Développeur">
    <!-- En-tête -->
    <header
      class="-mx-[20mm] -mt-[20mm] px-[20mm] py-7 mb-8 bg-[#0f172a] text-white relative overflow-hidden"
    >
      <div
        class="absolute inset-0 opacity-[0.04] pointer-events-none"
        style="
          background-image:
            linear-gradient(#fff 1px, transparent 1px),
            linear-gradient(90deg, #fff 1px, transparent 1px);
          background-size: 24px 24px;
        "
      />

      <div class="relative flex items-start justify-between gap-6">
        <div class="flex-1 min-w-0">
          <h1
            class="text-[18pt] font-mono font-bold tracking-tight leading-none text-white"
          >
            {{ p.fullName || "Votre nom" }}
          </h1>
          <p
            class="font-mono text-[10pt] mt-2 font-medium"
            :style="{ color: accent }"
          >
            {{ p.jobTitle || "Développeur" }}
          </p>
        </div>

        <div v-if="showPhotoBlock" class="border shrink-0" :style="{ borderColor: `${accent}60` }">
          <ResumePhotoAvatar
            :photo-url="p.photoUrl"
            :initials="initials"
            :accent="accent"
            shape="square"
            size-class="w-14 h-14"
            fallback-class="font-mono font-bold text-lg"
            :fallback-style="{ color: accent, background: `${accent}15` }"
          />
        </div>
      </div>

      <div
        class="relative flex flex-wrap gap-x-5 gap-y-1 mt-5 text-[8.5pt] font-mono text-slate-400"
      >
        <span v-for="item in contactItems" :key="item">{{ item }}</span>
      </div>

      <div
        class="absolute bottom-0 left-0 right-0 h-[2px]"
        :style="{ backgroundColor: accent }"
      />
    </header>

    <!-- Stack technique -->
    <section v-if="hasSkills" class="mb-7">
      <h2
        class="font-mono text-[7.5pt] font-bold uppercase tracking-[0.18em] mb-3 flex items-center gap-2"
        :style="{ color: accent }"
      >
        <span>Stack</span>
        <span
          class="h-px flex-1 opacity-20"
          :style="{ backgroundColor: accent }"
        />
      </h2>
      <div class="flex flex-wrap gap-1.5">
        <code
          v-for="(skill, i) in snapshot.skills"
          :key="i"
          class="px-2 py-[3px] text-[8.5pt] font-mono rounded-sm border"
          :style="{
            color: accent,
            borderColor: `${accent}35`,
            backgroundColor: `${accent}08`,
          }"
        >
          {{ skill.name }}
        </code>
      </div>
    </section>

    <!-- Expériences -->
    <section v-if="hasExperiences" class="mb-7">
      <h2
        class="font-mono text-[7.5pt] font-bold uppercase tracking-[0.18em] mb-4 flex items-center gap-2"
        :style="{ color: accent }"
      >
        <span>Expérience</span>
        <span
          class="h-px flex-1 opacity-20"
          :style="{ backgroundColor: accent }"
        />
      </h2>
      <div
        v-for="(exp, i) in snapshot.experiences"
        :key="i"
        class="mb-5 pl-4 relative"
        :style="{ borderLeft: `2px solid ${accent}30` }"
      >
        <span
          class="absolute -left-[5px] top-[6px] w-2 h-2 rounded-sm bg-[#0f172a] border-2 shrink-0"
          :style="{ borderColor: accent }"
        />
        <ExperienceEntry
          :exp="exp"
          :accent="accent"
          company-class="text-[8.5pt] font-mono text-[#475569]"
          location-class="text-[8.5pt] font-mono text-[#94a3b8]"
          period-class="text-[8.5pt] font-mono text-[#94a3b8]"
        />
      </div>
    </section>

    <!-- Formation -->
    <section v-if="hasEducations" class="mb-7">
      <h2
        class="font-mono text-[7.5pt] font-bold uppercase tracking-[0.18em] mb-4 flex items-center gap-2"
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
        <EducationEntry
          :edu="edu"
          :accent="accent"
          institution-class="text-[8.5pt] font-mono text-[#475569]"
          field-class="text-[8.5pt] font-mono text-[#94a3b8]"
          period-class="text-[8.5pt] font-mono text-[#94a3b8]"
        />
      </div>
    </section>

    <!-- Certifications -->
    <section v-if="hasCertifications">
      <h2
        class="font-mono text-[7.5pt] font-bold uppercase tracking-[0.18em] mb-3 flex items-center gap-2"
        :style="{ color: accent }"
      >
        <span>Certifications</span>
        <span
          class="h-px flex-1 opacity-20"
          :style="{ backgroundColor: accent }"
        />
      </h2>
      <ul class="space-y-1.5">
        <li
          v-for="(cert, i) in snapshot.certifications"
          :key="i"
          class="text-[9pt] font-mono text-[#334155] flex items-start gap-2"
        >
          <span
            class="mt-[5px] w-1.5 h-1.5 rounded-sm shrink-0"
            :style="{ backgroundColor: accent }"
          />
          <span
            >{{ cert.name
            }}<span class="text-[#94a3b8]"> — {{ cert.issuer }}</span></span
          >
        </li>
      </ul>
    </section>
  </TemplatesTemplateShell>
</template>
