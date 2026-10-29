<script setup lang="ts">
import type { ResumeSnapshot } from '@profiloz/shared'
import { formatDateRange } from '~/composables/useResumeSections'
import { SKILL_LEVEL_DOTS, descriptionBullets, languageLevelDots, shadeColor } from '~/utils/resume-template-style'

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

// Avec #2f43a1 : 95 % → #f5f6fa (colonne), 50 % → #97a1d0 (points éteints), comme la maquette
const sideBackground = computed(() => shadeColor(accent.value, 95))
const dotOffColor = computed(() => shadeColor(accent.value, 50))

const infoItems = computed(() =>
  [
    { label: 'Adresse e-mail', value: p.value.email },
    { label: 'Téléphone', value: p.value.phone },
    { label: 'Adresse', value: p.value.location },
    { label: 'LinkedIn', value: p.value.linkedinUrl },
    { label: 'Site web', value: p.value.websiteUrl },
  ].filter((c) => c.value?.trim()),
)

</script>

<template>
  <TemplatesTemplateShell :resume="resume" template-name="Bleu">
    <!-- Maquette d'origine en points (A4 = 595.28 × 841.89 pt) -->
    <div class="bleu relative -m-[20mm] min-h-[297mm] bg-white px-[25pt] pt-[30pt] pb-[30pt] text-[10pt] leading-[13.75pt] text-black">
      <!-- Bandes haut et bas -->
      <div class="absolute inset-x-0 top-0 h-[30pt]" :style="{ backgroundColor: accent }" />
      <div class="absolute inset-x-0 bottom-0 h-[30pt]" :style="{ backgroundColor: accent }" />

      <h1 class="bleu-name break-words" :style="{ color: accent }">{{ p.fullName || 'Votre nom' }}</h1>

      <div class="flex gap-[25pt]">
        <!-- Colonne gauche -->
        <aside class="min-h-[683.015pt] w-[163.584pt] shrink-0 p-[10pt]" :style="{ backgroundColor: sideBackground }">
          <div v-if="showPhotoBlock" class="mb-[9.68pt] h-[143.584pt] w-[143.584pt] overflow-hidden bg-white">
            <img v-if="p.photoUrl" :src="p.photoUrl" alt="" class="block h-full w-full object-cover" />
            <div
              v-else
              class="flex h-full w-full items-center justify-center text-[30pt] font-bold text-white"
              :style="{ backgroundColor: accent }"
            >
              {{ initials }}
            </div>
          </div>

          <section v-if="infoItems.length" class="bleu-sec">
            <h2 class="bleu-title" :style="{ color: accent }">Informations personnelles</h2>
            <dl>
              <template v-for="(item, i) in infoItems" :key="item.label">
                <dt class="font-bold" :class="{ 'mt-[10pt]': i > 0 }">{{ item.label }}</dt>
                <dd class="break-all">{{ item.value }}</dd>
              </template>
            </dl>
          </section>

          <section v-if="hasLanguages" class="bleu-sec">
            <h2 class="bleu-title" :style="{ color: accent }">Langues</h2>
            <ul class="space-y-[10pt]">
              <li v-for="(lang, i) in snapshot.languages" :key="i" class="flex items-center justify-between gap-[5pt]">
                <span class="min-w-0 break-words">{{ lang.name }}</span>
                <ResumeLevelDots v-if="lang.level" :filled="languageLevelDots(lang.level)" :color="accent" :off-color="dotOffColor" />
              </li>
            </ul>
          </section>

          <section v-if="hasSkills" class="bleu-sec">
            <h2 class="bleu-title" :style="{ color: accent }">Compétences</h2>
            <ul class="space-y-[10pt]">
              <li v-for="(skill, i) in snapshot.skills" :key="i" class="flex items-center justify-between gap-[5pt]">
                <span class="min-w-0 break-words">{{ skill.name }}</span>
                <ResumeLevelDots v-if="skill.level" :filled="SKILL_LEVEL_DOTS[skill.level]" :color="accent" :off-color="dotOffColor" />
              </li>
            </ul>
          </section>

          <section v-if="hasInterests" class="bleu-sec">
            <h2 class="bleu-title" :style="{ color: accent }">Centres d'intérêt</h2>
            <ul class="space-y-[10pt]">
              <li v-for="(interest, i) in snapshot.interests" :key="i" class="flex items-center gap-[5pt]">
                <span class="h-[7.5pt] w-[7.5pt] shrink-0" :style="{ backgroundColor: accent }" />
                <span>{{ interest.name }}</span>
              </li>
            </ul>
          </section>
        </aside>

        <!-- Colonne principale -->
        <main class="min-w-0 flex-1">
          <section v-if="p.jobTitle || hasSummary" class="bleu-sec">
            <h2 class="bleu-title" :style="{ color: accent }">{{ p.jobTitle || 'Profil' }}</h2>
            <p v-if="hasSummary" class="whitespace-pre-line">{{ snapshot.summary }}</p>
          </section>

          <section v-if="hasEducations" class="bleu-sec">
            <h2 class="bleu-title" :style="{ color: accent }">Formation</h2>
            <div class="space-y-[10pt]">
              <div v-for="(edu, i) in snapshot.educations" :key="i">
                <div class="flex justify-between gap-[10pt] font-bold">
                  <h3 class="max-w-[50%] text-[#333]">{{ [edu.degree, edu.field].filter(Boolean).join(' — ') }}</h3>
                  <span class="whitespace-nowrap" :style="{ color: accent }">
                    {{ formatDateRange(edu.startDate, edu.endDate) }}
                  </span>
                </div>
                <p v-if="edu.institution || edu.location" :style="{ color: accent }">
                  {{ [edu.institution, edu.location].filter(Boolean).join(', ') }}
                </p>
                <ul v-if="descriptionBullets(edu.description).length" class="bleu-bullets">
                  <li v-for="(line, j) in descriptionBullets(edu.description)" :key="j">{{ line }}</li>
                </ul>
              </div>
            </div>
          </section>

          <section v-if="hasExperiences" class="bleu-sec">
            <h2 class="bleu-title" :style="{ color: accent }">Expériences professionnelles</h2>
            <div class="space-y-[10pt]">
              <div v-for="(exp, i) in snapshot.experiences" :key="i">
                <div class="flex justify-between gap-[10pt] font-bold">
                  <h3 class="max-w-[50%] text-[#333]">{{ exp.position }}</h3>
                  <span class="whitespace-nowrap" :style="{ color: accent }">
                    {{ formatDateRange(exp.startDate, exp.endDate, exp.isCurrent) }}
                  </span>
                </div>
                <p v-if="exp.company || exp.location || exp.country" :style="{ color: accent }">
                  {{ [exp.company, [exp.location, exp.country].filter(Boolean).join(', ')].filter(Boolean).join(', ') }}
                </p>
                <ul v-if="descriptionBullets(exp.description).length" class="bleu-bullets">
                  <li v-for="(line, j) in descriptionBullets(exp.description)" :key="j">{{ line }}</li>
                </ul>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  </TemplatesTemplateShell>
</template>

<style scoped>
.bleu {
  font-family: 'Liberation Sans', Arial, Helvetica, sans-serif;
}

.bleu-name {
  padding-top: 20pt;
  padding-bottom: 5.075pt;
  margin-bottom: 20pt;
  font-size: 25pt;
  line-height: 33.3pt;
  font-weight: 700;
  border-bottom: 0.5pt solid #e2e2e2;
}

.bleu-sec + .bleu-sec {
  margin-top: 14.9pt;
}

.bleu-title {
  font-size: 15pt;
  line-height: 20.625pt;
  font-weight: 700;
  padding-bottom: 4.33pt;
  border-bottom: 0.5pt solid #e2e2e2;
  margin-bottom: 9.79pt;
}

.bleu-bullets li {
  position: relative;
  padding-left: 20pt;
}

.bleu-bullets li::before {
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
