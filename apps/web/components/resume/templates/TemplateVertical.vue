<script setup lang="ts">
import type { ResumeSnapshot } from '@profiloz/shared'
import { formatDateRange } from '~/composables/useResumeSections'
import {
  SKILL_LEVEL_DOTS,
  descriptionBullets,
  languageLevelDots,
  shadeColor,
  type ResumeContactIconName,
} from '~/utils/resume-template-style'

const props = defineProps<{ resume: ResumeSnapshot }>()
const {
  accent,
  p,
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

// Avec #821f61 : 95 % → #f9f4f7 (colonne), 50 % → #c08fb0 (points éteints), comme la maquette
const sideBackground = computed(() => shadeColor(accent.value, 95))
const dotOffColor = computed(() => shadeColor(accent.value, 50))

const infoItems = computed(() =>
  (
    [
      { icon: 'envelope', value: p.value.email },
      { icon: 'phone', value: p.value.phone },
      { icon: 'marker', value: p.value.location },
      { icon: 'linkedin', value: p.value.linkedinUrl },
      { icon: 'globe', value: p.value.websiteUrl },
    ] satisfies { icon: ResumeContactIconName; value?: string }[]
  ).filter((c) => c.value?.trim()),
)

</script>

<template>
  <TemplatesTemplateShell :resume="resume" template-name="Vertical">
    <!-- Maquette d'origine en points (A4 = 595.28 × 841.89 pt) -->
    <div class="vertical -m-[20mm] min-h-[297mm] flex bg-white text-[10pt] leading-[13.75pt] text-black">
      <div class="w-[30pt] shrink-0" :style="{ backgroundColor: accent }" />

      <!-- Colonne gauche -->
      <aside class="w-[178.584pt] shrink-0 px-[10pt] pt-[30pt] pb-[30pt]" :style="{ backgroundColor: sideBackground }">
        <div v-if="showPhotoBlock" class="mx-auto mb-[19.63pt] h-[118.584pt] w-[118.584pt] overflow-hidden bg-white">
          <img v-if="p.photoUrl" :src="p.photoUrl" alt="" class="block h-full w-full object-cover" />
          <div
            v-else
            class="flex h-full w-full items-center justify-center text-[30pt] font-bold text-white"
            :style="{ backgroundColor: accent }"
          >
            {{ initials }}
          </div>
        </div>

        <h1 class="vertical-name break-words" :style="{ color: accent }">{{ p.fullName || 'Votre nom' }}</h1>

        <section v-if="infoItems.length" class="vertical-sec">
          <h2 class="vertical-title" :style="{ color: accent }">Informations personnelles</h2>
          <ul class="space-y-[10pt]">
            <li v-for="item in infoItems" :key="item.icon" class="flex items-start gap-[9pt]">
              <ResumeContactIcon :icon="item.icon" class="mt-[0.21pt] h-[15pt] w-[15pt] shrink-0" :style="{ color: accent }" />
              <span class="min-w-0 break-all">{{ item.value }}</span>
            </li>
          </ul>
        </section>

        <section v-if="hasSkills" class="vertical-sec">
          <h2 class="vertical-title" :style="{ color: accent }">Compétences</h2>
          <ul class="space-y-[10pt]">
            <li v-for="(skill, i) in snapshot.skills" :key="i" class="flex items-center justify-between gap-[5pt]">
              <span class="min-w-0 break-words">{{ skill.name }}</span>
              <ResumeLevelDots v-if="skill.level" :filled="SKILL_LEVEL_DOTS[skill.level]" :color="accent" :off-color="dotOffColor" />
            </li>
          </ul>
        </section>

        <section v-if="hasLanguages" class="vertical-sec">
          <h2 class="vertical-title" :style="{ color: accent }">Langues</h2>
          <ul class="space-y-[10pt]">
            <li v-for="(lang, i) in snapshot.languages" :key="i" class="flex items-center justify-between gap-[5pt]">
              <span class="min-w-0 break-words">{{ lang.name }}</span>
              <ResumeLevelDots v-if="lang.level" :filled="languageLevelDots(lang.level)" :color="accent" :off-color="dotOffColor" />
            </li>
          </ul>
        </section>

        <section v-if="hasInterests" class="vertical-sec">
          <h2 class="vertical-title" :style="{ color: accent }">Centres d'intérêt</h2>
          <ul class="space-y-[10pt]">
            <li v-for="(interest, i) in snapshot.interests" :key="i" class="flex items-center gap-[5pt]">
              <span class="h-[7.5pt] w-[7.5pt] shrink-0" :style="{ backgroundColor: accent }" />
              <span>{{ interest.name }}</span>
            </li>
          </ul>
        </section>
      </aside>

      <!-- Colonne principale -->
      <main class="min-w-0 flex-1 pl-[10pt] pr-[30pt] pt-[30pt] pb-[30pt]">
        <section v-if="p.jobTitle || hasSummary" class="vertical-sec">
          <h2 class="vertical-title" :style="{ color: accent }">{{ p.jobTitle || 'Profil' }}</h2>
          <p v-if="hasSummary" class="whitespace-pre-line">{{ snapshot.summary }}</p>
        </section>

        <section v-if="hasExperiences" class="vertical-sec">
          <h2 class="vertical-title" :style="{ color: accent }">Expériences professionnelles</h2>
          <div class="space-y-[10pt]">
            <div v-for="(exp, i) in snapshot.experiences" :key="i">
              <div class="flex justify-between gap-[10pt] font-bold">
                <h3 class="min-w-0 text-[#333]">{{ exp.position }}</h3>
                <span class="whitespace-nowrap" :style="{ color: accent }">
                  {{ formatDateRange(exp.startDate, exp.endDate, exp.isCurrent) }}
                </span>
              </div>
              <p v-if="exp.company || exp.location || exp.country" :style="{ color: accent }">
                {{ [exp.company, [exp.location, exp.country].filter(Boolean).join(', ')].filter(Boolean).join(', ') }}
              </p>
              <ul v-if="descriptionBullets(exp.description).length" class="vertical-bullets mt-[13.75pt]">
                <li v-for="(line, j) in descriptionBullets(exp.description)" :key="j">{{ line }}</li>
              </ul>
            </div>
          </div>
        </section>

        <section v-if="hasEducations" class="vertical-sec">
          <h2 class="vertical-title" :style="{ color: accent }">Formation</h2>
          <div class="space-y-[10pt]">
            <div v-for="(edu, i) in snapshot.educations" :key="i">
              <div class="flex justify-between gap-[10pt] font-bold">
                <h3 class="min-w-0 text-[#333]">{{ [edu.degree, edu.field].filter(Boolean).join(' — ') }}</h3>
                <span class="whitespace-nowrap" :style="{ color: accent }">
                  {{ formatDateRange(edu.startDate, edu.endDate) }}
                </span>
              </div>
              <p v-if="edu.institution || edu.location" :style="{ color: accent }">
                {{ [edu.institution, edu.location].filter(Boolean).join(', ') }}
              </p>
              <ul v-if="descriptionBullets(edu.description).length" class="vertical-bullets mt-[13.75pt]">
                <li v-for="(line, j) in descriptionBullets(edu.description)" :key="j">{{ line }}</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  </TemplatesTemplateShell>
</template>

<style scoped>
.vertical {
  font-family: 'Liberation Sans', Arial, Helvetica, sans-serif;
}

.vertical-name {
  font-size: 25pt;
  line-height: 33.3pt;
  font-weight: 700;
  margin-bottom: 20.7pt;
}

.vertical-sec + .vertical-sec {
  margin-top: 14.85pt;
}

.vertical-title {
  font-size: 17pt;
  line-height: 23.375pt;
  font-weight: 400;
  padding-bottom: 4.36pt;
  border-bottom: 0.5pt solid #e2e2e2;
  margin-bottom: 9.79pt;
}

.vertical-bullets li {
  position: relative;
  padding-left: 20pt;
}

.vertical-bullets li::before {
  content: '';
  position: absolute;
  left: 8pt;
  top: 5.34pt;
  width: 4pt;
  height: 4pt;
  border-radius: 50%;
  background: #000;
}
</style>
