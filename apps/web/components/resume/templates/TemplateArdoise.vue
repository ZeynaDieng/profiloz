<script setup lang="ts">
import type { ResumeSnapshot } from '@profiloz/shared'
import { formatDateRange } from '~/composables/useResumeSections'
import { SKILL_LEVEL_DOTS, descriptionBullets, languageLevelDots } from '~/utils/resume-template-style'

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

const DOT_OFF = '#6b7280'
const SQUARE = '#c0c3c7'

// Icônes de la maquette (viewBox 0 -960 960 960)
const ICONS: Record<string, string> = {
  person:
    'M367.65-527.73q-43.63-43.63-43.63-112.31t43.63-112.35q43.62-43.68 112.3-43.68t112.47 43.68q43.8 43.67 43.8 112.35 0 68.68-43.8 112.31-43.79 43.62-112.47 43.62t-112.3-43.62ZM154.02-150.91v-100.41q0-39.48 19.87-68.02 19.87-28.53 51.48-43.29 67.48-30.24 129.7-45.36 62.21-15.12 124.87-15.12 63.13 0 124.79 15.62 61.66 15.62 128.9 44.86 32.67 14.48 52.63 43.03 19.96 28.56 19.96 68.23v100.46h-652.2Z',
  envelope:
    'M142.15-154.02q-27.6 0-47.86-20.27-20.27-20.26-20.27-47.86v-515.7q0-27.7 20.27-48.03 20.26-20.34 47.86-20.34h675.7q27.7 0 48.03 20.34 20.34 20.33 20.34 48.03v515.7q0 27.6-20.34 47.86-20.33 20.27-48.03 20.27h-675.7ZM480-454.35l337.85-223v-60.5L480-519.85l-337.85-218v60.5l337.85 223Z',
  phone:
    'M795.48-114.02q-117.44 0-239.01-56.48-121.58-56.48-225.3-160.2-103.95-103.95-160.55-225.65-56.6-121.69-56.6-238.89 0-21.39 14.68-36.18 14.67-14.8 36.06-14.8h140q18.07 0 30.34 11.56 12.27 11.55 16.99 30.38l27 122.17q2.48 16.87-.74 30.4-3.22 13.54-13.13 22.97l-100.96 99.57q25.04 42.08 53.09 78.65 28.04 36.56 62.32 69.61 36.05 37.28 75.25 67.46 39.21 30.19 81.82 52.75l96.19-98.71q11.68-12.68 26.59-17.16 14.91-4.47 30.55-1.52l114.21 25.29q18.83 5.19 30.38 19.1 11.56 13.92 11.56 32.5v136.44q0 21.39-14.8 36.06-14.79 14.68-35.94 14.68Z',
  home: 'M154.02-114.02v-489.01L480-847.65l326.22 244.54v489.09H561.43v-287.41H398.57v287.41H154.02Z',
  linkedin:
    'M203-120q-34 0-58.5-24.5T120-203v-554q0-34 24.5-58.5T203-840h554q34 0 58.5 24.5T840-757v554q0 34-24.5 58.5T757-120H203Zm57-120h100v-320H260v320Zm50-366q31 0 51.5-20.5T382-678q0-31-20.5-51.5T310-750q-31 0-51.5 20.5T238-678q0 31 20.5 51.5T310-606Zm130 366h100v-170q0-36 17.5-55t46.5-19q29 0 42.5 18.5T610-406v166h100v-186q0-70-35.5-105T580-566q-35 0-61 15.5T480-510v-50h-40v320Z',
  globe:
    'M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm-40-82v-78q-33 0-56.5-23.5T360-320v-40L168-552q-3 18-5.5 36t-2.5 36q0 121 79.5 212T440-162Zm276-102q41-45 62.5-100.5T800-480q0-98-54.5-179T600-776v16q0 33-23.5 56.5T520-680h-80v80q0 17-11.5 28.5T400-560h-80v80h240q17 0 28.5 11.5T600-440v120h40q26 0 47 15.5t29 40.5Z',
}

const infoItems = computed(() =>
  [
    { icon: 'person', value: p.value.fullName },
    { icon: 'envelope', value: p.value.email },
    { icon: 'phone', value: p.value.phone },
    { icon: 'home', value: p.value.location },
    { icon: 'linkedin', value: p.value.linkedinUrl },
    { icon: 'globe', value: p.value.websiteUrl },
  ].filter((c) => c.value?.trim()),
)

</script>

<template>
  <TemplatesTemplateShell :resume="resume" template-name="Ardoise">
    <!-- Maquette d'origine en points (A4 = 595.28 × 841.89 pt) -->
    <div class="ardoise -m-[20mm] flex min-h-[297mm] bg-white text-[10pt] leading-[13.75pt] text-black">
      <!-- Colonne gauche -->
      <aside
        class="w-[200pt] shrink-0 px-[15pt] pt-[35pt] pb-[30pt] text-white"
        :style="{ backgroundColor: accent, '--rule': '#fff', '--bg': accent }"
      >
        <div v-if="showPhotoBlock" class="mx-auto mb-[19.68pt] h-[150pt] w-[150pt] overflow-hidden rounded-full bg-white">
          <img v-if="p.photoUrl" :src="p.photoUrl" alt="" class="block h-full w-full object-cover" />
          <div
            v-else
            class="flex h-full w-full items-center justify-center text-[36pt] font-bold"
            :style="{ color: accent }"
          >
            {{ initials }}
          </div>
        </div>
        <p class="mb-[15pt] text-center text-[15pt] leading-[20.625pt]">Curriculum vitae</p>

        <section v-if="infoItems.length" class="ardoise-sec">
          <h2 class="ardoise-title"><span>Informations personnelles</span></h2>
          <ul class="space-y-[10pt]">
            <li v-for="item in infoItems" :key="item.icon" class="flex items-start gap-[9pt]">
              <svg class="mt-[0.21pt] h-[15pt] w-[15pt] shrink-0" viewBox="0 -960 960 960" fill="#fff">
                <path :d="ICONS[item.icon]" />
              </svg>
              <span class="min-w-0 whitespace-pre-line break-words">{{ item.value }}</span>
            </li>
          </ul>
        </section>

        <section v-if="hasSkills" class="ardoise-sec">
          <h2 class="ardoise-title"><span>Compétences</span></h2>
          <ul class="space-y-[10pt]">
            <li v-for="(skill, i) in snapshot.skills" :key="i" class="flex items-center justify-between gap-[5pt]">
              <span class="min-w-0 break-words">{{ skill.name }}</span>
              <ResumeLevelDots v-if="skill.level" :filled="SKILL_LEVEL_DOTS[skill.level]" color="#fff" :off-color="DOT_OFF" />
            </li>
          </ul>
        </section>

        <section v-if="hasLanguages" class="ardoise-sec">
          <h2 class="ardoise-title"><span>Langues</span></h2>
          <ul class="space-y-[10pt]">
            <li v-for="(lang, i) in snapshot.languages" :key="i" class="flex items-center justify-between gap-[5pt]">
              <span class="min-w-0 break-words">{{ lang.name }}</span>
              <ResumeLevelDots v-if="lang.level" :filled="languageLevelDots(lang.level)" color="#fff" :off-color="DOT_OFF" />
            </li>
          </ul>
        </section>

        <section v-if="hasInterests" class="ardoise-sec">
          <h2 class="ardoise-title"><span>Centres d'intérêt</span></h2>
          <ul class="space-y-[10pt]">
            <li v-for="(interest, i) in snapshot.interests" :key="i" class="flex items-center gap-[5pt]">
              <span class="h-[7.5pt] w-[7.5pt] shrink-0" :style="{ backgroundColor: SQUARE }" />
              <span>{{ interest.name }}</span>
            </li>
          </ul>
        </section>
      </aside>

      <!-- Colonne principale -->
      <main class="min-w-0 flex-1 px-[25pt] pt-[24.68pt] pb-[30pt]" style="--rule: #d8d8d8; --bg: #fff">
        <section v-if="p.jobTitle || hasSummary" class="ardoise-sec">
          <h2 class="ardoise-title font-bold"><span>{{ p.jobTitle || 'Profil' }}</span></h2>
          <p v-if="hasSummary" class="whitespace-pre-line">{{ snapshot.summary }}</p>
        </section>

        <section v-if="hasExperiences" class="ardoise-sec">
          <h2 class="ardoise-title font-bold"><span>Expériences professionnelles</span></h2>
          <div class="space-y-[10pt]">
            <div v-for="(exp, i) in snapshot.experiences" :key="i" class="grid grid-cols-[120.85pt_minmax(0,1fr)]">
              <p class="font-bold text-[#333]">{{ formatDateRange(exp.startDate, exp.endDate, exp.isCurrent) }}</p>
              <div>
                <h3 class="font-bold text-[#333]">{{ exp.position }}</h3>
                <p v-if="exp.company || exp.location || exp.country" :style="{ color: accent }">
                  {{ [exp.company, [exp.location, exp.country].filter(Boolean).join(', ')].filter(Boolean).join(', ') }}
                </p>
                <ul v-if="descriptionBullets(exp.description).length" class="ardoise-bullets mt-[13.75pt]">
                  <li v-for="(line, j) in descriptionBullets(exp.description)" :key="j">{{ line }}</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section v-if="hasEducations" class="ardoise-sec">
          <h2 class="ardoise-title font-bold"><span>Formation</span></h2>
          <div class="space-y-[10pt]">
            <div v-for="(edu, i) in snapshot.educations" :key="i" class="grid grid-cols-[120.85pt_minmax(0,1fr)]">
              <p class="font-bold text-[#333]">{{ formatDateRange(edu.startDate, edu.endDate) }}</p>
              <div>
                <h3 class="font-bold text-[#333]">{{ [edu.degree, edu.field].filter(Boolean).join(' — ') }}</h3>
                <p v-if="edu.institution || edu.location" :style="{ color: accent }">
                  {{ [edu.institution, edu.location].filter(Boolean).join(', ') }}
                </p>
                <ul v-if="descriptionBullets(edu.description).length" class="ardoise-bullets mt-[13.75pt]">
                  <li v-for="(line, j) in descriptionBullets(edu.description)" :key="j">{{ line }}</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  </TemplatesTemplateShell>
</template>

<style scoped>
.ardoise {
  font-family: 'Liberation Sans', Arial, Helvetica, sans-serif;
}

.ardoise-sec + .ardoise-sec {
  margin-top: 14.89pt;
}

/* Titre + filet qui remplit le reste de la ligne */
.ardoise-title {
  overflow: hidden;
  white-space: nowrap;
  margin-bottom: 10.12pt;
  font-size: 15pt;
  line-height: 20.625pt;
  background: linear-gradient(var(--rule), var(--rule)) 0 10.01pt / 100% 0.5pt no-repeat;
}

.ardoise-title span {
  display: inline-block;
  vertical-align: top;
  max-width: calc(100% + 15pt);
  padding-right: 15pt;
  background: var(--bg);
  overflow: hidden;
  text-overflow: ellipsis;
}

.ardoise-bullets li {
  position: relative;
  padding-left: 20pt;
}

.ardoise-bullets li::before {
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
