<script setup lang="ts">
import type { ResumeSnapshot } from '@profiloz/shared'
import { formatDateRange } from '~/composables/useResumeSections'
import {
  SKILL_LEVEL_PERCENT,
  descriptionBullets,
  languageLevelPercent,
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

const SIDE_BACKGROUND = '#282831'

const contactItems = computed(() =>
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
  <TemplatesTemplateShell :resume="resume" template-name="Turquoise">
    <!-- Maquette d'origine en points (A4 = 595.28 × 841.89 pt) -->
    <div
      class="turquoise relative -m-[20mm] flex min-h-[297mm] pt-[233.62pt] pb-[30pt] text-[11pt] leading-[15.125pt] text-black"
      :style="{ background: `linear-gradient(to right, ${SIDE_BACKGROUND} 200pt, #fff 200pt)` }"
    >
      <!-- Carte d'en-tête : cadre blanc + fond couleur principale -->
      <div
        class="absolute left-[25pt] top-[25pt] h-[183.62pt] w-[545.28pt] border-[10pt] border-solid border-white text-white"
        :style="{ backgroundColor: accent }"
      >
        <div
          v-if="showPhotoBlock"
          class="absolute left-[27pt] top-[22pt] h-[111pt] w-[111pt] overflow-hidden rounded-full border-[3pt] border-solid border-white bg-white"
        >
          <img v-if="p.photoUrl" :src="p.photoUrl" alt="" class="block h-full w-full object-cover" />
          <div
            v-else
            class="flex h-full w-full items-center justify-center text-[30pt] font-bold text-white"
            :style="{ backgroundColor: accent }"
          >
            {{ initials }}
          </div>
        </div>

        <div class="absolute right-0 top-[28.31pt]" :class="showPhotoBlock ? 'left-[190pt]' : 'left-[27pt]'">
          <h1 class="turquoise-name break-words">{{ p.fullName || 'Votre nom' }}</h1>
          <ul v-if="contactItems.length" class="text-[9pt]">
            <li v-for="item in contactItems" :key="item.icon" class="flex items-center gap-[6pt]">
              <ResumeContactIcon :icon="item.icon" class="h-[9pt] w-[9pt] shrink-0 text-white" />
              <span class="min-w-0 break-all">{{ item.value }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Colonne gauche (fond sombre) -->
      <aside class="w-[200pt] shrink-0 px-[25pt] text-white">
        <section v-if="hasSkills" class="turquoise-sec">
          <h2 class="turquoise-side-title">Compétences</h2>
          <ul class="space-y-[10pt]">
            <li v-for="(skill, i) in snapshot.skills" :key="i" class="flow-root">
              <span class="break-words">{{ skill.name }}</span>
              <div v-if="skill.level" class="mb-[5.13pt] mt-[5.6pt] h-[4.4pt] bg-white">
                <span
                  class="block h-full"
                  :style="{ width: `${SKILL_LEVEL_PERCENT[skill.level]}%`, backgroundColor: accent }"
                />
              </div>
            </li>
          </ul>
        </section>

        <section v-if="hasLanguages" class="turquoise-sec">
          <h2 class="turquoise-side-title">Langues</h2>
          <ul class="space-y-[10pt]">
            <li v-for="(lang, i) in snapshot.languages" :key="i" class="flow-root">
              <span class="break-words">{{ lang.name }}</span>
              <div v-if="lang.level" class="mb-[5.13pt] mt-[5.6pt] h-[4.4pt] bg-white">
                <span
                  class="block h-full"
                  :style="{ width: `${languageLevelPercent(lang.level)}%`, backgroundColor: accent }"
                />
              </div>
            </li>
          </ul>
        </section>

        <section v-if="hasInterests" class="turquoise-sec">
          <h2 class="turquoise-side-title">Centres d'intérêt</h2>
          <ul class="space-y-[10pt]">
            <li v-for="(interest, i) in snapshot.interests" :key="i" class="flex items-center gap-[5.5pt]">
              <span class="h-[8.25pt] w-[8.25pt] shrink-0" :style="{ backgroundColor: accent }" />
              <span>{{ interest.name }}</span>
            </li>
          </ul>
        </section>
      </aside>

      <!-- Colonne principale -->
      <main class="min-w-0 flex-1 pl-[25pt] pr-[35pt]">
        <section v-if="p.jobTitle || hasSummary" class="turquoise-sec">
          <h2 class="turquoise-main-title" :style="{ backgroundColor: accent }">{{ p.jobTitle || 'Profil' }}</h2>
          <p v-if="hasSummary" class="whitespace-pre-line">{{ snapshot.summary }}</p>
        </section>

        <section v-if="hasExperiences" class="turquoise-sec">
          <h2 class="turquoise-main-title" :style="{ backgroundColor: accent }">Expériences professionnelles</h2>
          <div class="space-y-[10pt]">
            <div v-for="(exp, i) in snapshot.experiences" :key="i">
              <div class="flex justify-between gap-[10pt]">
                <h3 class="max-w-[60%] font-bold">{{ exp.position }}</h3>
                <span class="whitespace-nowrap">{{ formatDateRange(exp.startDate, exp.endDate, exp.isCurrent) }}</span>
              </div>
              <p v-if="exp.company || exp.location || exp.country" class="text-[#666]">
                {{ [exp.company, [exp.location, exp.country].filter(Boolean).join(', ')].filter(Boolean).join(', ') }}
              </p>
              <ul v-if="descriptionBullets(exp.description).length" class="turquoise-bullets mt-[15.125pt]">
                <li v-for="(line, j) in descriptionBullets(exp.description)" :key="j">{{ line }}</li>
              </ul>
            </div>
          </div>
        </section>

        <section v-if="hasEducations" class="turquoise-sec">
          <h2 class="turquoise-main-title" :style="{ backgroundColor: accent }">Formation</h2>
          <div class="space-y-[10pt]">
            <div v-for="(edu, i) in snapshot.educations" :key="i">
              <div class="flex justify-between gap-[10pt]">
                <h3 class="max-w-[60%] font-bold">{{ [edu.degree, edu.field].filter(Boolean).join(' — ') }}</h3>
                <span class="whitespace-nowrap">{{ formatDateRange(edu.startDate, edu.endDate) }}</span>
              </div>
              <p v-if="edu.institution || edu.location" class="text-[#666]">
                {{ [edu.institution, edu.location].filter(Boolean).join(', ') }}
              </p>
              <ul v-if="descriptionBullets(edu.description).length" class="turquoise-bullets mt-[15.125pt]">
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
.turquoise {
  font-family: 'Liberation Sans', Arial, Helvetica, sans-serif;
}

.turquoise-name {
  font-size: 35pt;
  line-height: 40pt;
  font-weight: 700;
  letter-spacing: 1pt;
  margin-bottom: 9.62pt;
}

.turquoise-sec + .turquoise-sec {
  margin-top: 10.23pt;
}

.turquoise-side-title {
  font-size: 13.2pt;
  line-height: 18.15pt;
  letter-spacing: 1pt;
  color: #999;
  margin-bottom: 9.77pt;
}

.turquoise-main-title {
  display: inline-block;
  vertical-align: top;
  padding: 0 5.92pt 0 4pt;
  color: #fff;
  font-size: 13.2pt;
  line-height: 18.15pt;
  letter-spacing: 1pt;
  margin-bottom: 9.77pt;
}

.turquoise-bullets li {
  position: relative;
  padding-left: 20pt;
}

.turquoise-bullets li::before {
  content: '';
  position: absolute;
  left: 7.8pt;
  top: 5.87pt;
  width: 4.4pt;
  height: 4.4pt;
  border-radius: 50%;
  background: #000;
}
</style>
