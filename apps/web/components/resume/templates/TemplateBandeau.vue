<script setup lang="ts">
import type { ResumeSnapshot } from '@profiloz/shared'
import { formatDateRange } from '~/composables/useResumeSections'
import {
  SKILL_LEVEL_PERCENT,
  contrastTextColor,
  languageLevelPercent,
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
  hasCertifications,
  showPhotoBlock,
  initials,
} = useResumeSections(() => props.resume)

const DIVIDER = '#e2e2e2'
const SUBHEADER = '#777777'

const titleColor = computed(() => contrastTextColor(accent.value))
const smallTextColor = computed(() => shadeColor(accent.value, 50))
const barOffColor = computed(() => shadeColor(accent.value, 90))

const headerContacts = computed(() =>
  (
    [
      { icon: 'envelope', value: p.value.email },
      { icon: 'phone', value: p.value.phone },
      { icon: 'marker', value: p.value.location },
    ] satisfies { icon: ResumeContactIconName; value?: string }[]
  ).filter((c) => c.value?.trim()),
)

const sidePersonalDetails = computed(() =>
  [
    { label: 'LinkedIn', value: p.value.linkedinUrl },
    { label: 'Site web', value: p.value.websiteUrl },
  ].filter((d) => d.value?.trim()),
)

const mainSections = computed(() =>
  [
    hasSummary.value && 'summary',
    hasExperiences.value && 'experiences',
    hasEducations.value && 'educations',
    hasCertifications.value && 'certifications',
  ].filter(Boolean) as string[],
)

const sideSections = computed(() =>
  [
    sidePersonalDetails.value.length > 0 && 'personal',
    hasSkills.value && 'skills',
    hasLanguages.value && 'languages',
    hasInterests.value && 'interests',
  ].filter(Boolean) as string[],
)

const educationPeriod = (start?: string, end?: string) => formatDateRange(start, end)
</script>

<template>
  <TemplatesTemplateShell :resume="resume" template-name="Bandeau">
    <div class="bandeau -m-[20mm] min-h-[297mm] bg-white text-black">
      <!-- Bandeau d'en-tête -->
      <header class="flex" :style="{ backgroundColor: accent }">
        <div v-if="showPhotoBlock" class="w-[125pt] h-[125pt] shrink-0 overflow-hidden">
          <img v-if="p.photoUrl" :src="p.photoUrl" alt="" class="w-full h-full object-cover" />
          <div
            v-else
            class="w-full h-full flex items-center justify-center text-[30pt] font-semibold"
            :style="{ color: titleColor, backgroundColor: shadeColor(accent, 15) }"
          >
            {{ initials }}
          </div>
        </div>

        <div class="flex-1 min-w-0 min-h-[125pt] flex flex-col justify-end px-[25pt] pt-[25pt] pb-[25pt]">
          <h1 class="text-[25pt] leading-[1.25] font-normal break-words" :style="{ color: titleColor }">
            {{ p.fullName || 'Votre nom' }}
          </h1>
          <p v-if="p.jobTitle" class="mt-[5pt] text-[13pt] leading-[1.25]" :style="{ color: smallTextColor }">
            {{ p.jobTitle }}
          </p>
          <div v-if="headerContacts.length" class="mt-[5pt] -ml-[10pt] flex flex-wrap">
            <div
              v-for="contact in headerContacts"
              :key="contact.icon"
              class="ml-[10pt] flex items-start gap-[5pt] text-[9pt] leading-[1.25]"
              :style="{ color: smallTextColor }"
            >
              <ResumeContactIcon :icon="contact.icon" class="w-[9pt] h-[9pt] mt-[2pt] shrink-0" />
              <span class="whitespace-nowrap">{{ contact.value }}</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Corps : colonne principale + barre latérale droite -->
      <div class="grid grid-cols-[minmax(0,1fr)_175pt] p-[25pt] text-[10pt] leading-[12.5pt]">
        <main class="pr-[25pt] min-w-0">
          <section
            v-for="(section, index) in mainSections"
            :key="section"
            class="pb-[10pt]"
          >
            <h2 class="bandeau-title" :style="{ color: accent }">
              {{
                section === 'summary'
                  ? 'Profil'
                  : section === 'experiences'
                    ? 'Expérience professionnelle'
                    : section === 'educations'
                      ? 'Formation'
                      : 'Certifications'
              }}
            </h2>

            <p v-if="section === 'summary'" class="mt-[10pt] whitespace-pre-line">{{ snapshot.summary }}</p>

            <template v-else-if="section === 'experiences'">
              <div v-for="(exp, i) in snapshot.experiences" :key="i" class="mt-[10pt]">
                <div class="flex items-baseline justify-between gap-[10pt]">
                  <p class="font-bold min-w-0">{{ exp.position }}</p>
                  <p class="shrink-0 whitespace-nowrap">{{ formatDateRange(exp.startDate, exp.endDate, exp.isCurrent) }}</p>
                </div>
                <p
                  v-if="exp.company || exp.location || exp.country"
                  :style="{ color: SUBHEADER }"
                >
                  {{ [exp.company, [exp.location, exp.country].filter(Boolean).join(', ')].filter(Boolean).join(', ') }}
                </p>
                <p v-if="exp.description?.trim()" class="whitespace-pre-line">{{ exp.description }}</p>
              </div>
            </template>

            <template v-else-if="section === 'educations'">
              <div v-for="(edu, i) in snapshot.educations" :key="i" class="mt-[10pt]">
                <div class="flex items-baseline justify-between gap-[10pt]">
                  <p class="font-bold min-w-0">{{ [edu.degree, edu.field].filter(Boolean).join(' — ') }}</p>
                  <p class="shrink-0 whitespace-nowrap">{{ educationPeriod(edu.startDate, edu.endDate) }}</p>
                </div>
                <p v-if="edu.institution || edu.location" :style="{ color: SUBHEADER }">
                  {{ [edu.institution, edu.location].filter(Boolean).join(', ') }}
                </p>
                <p v-if="edu.description?.trim()" class="whitespace-pre-line">{{ edu.description }}</p>
              </div>
            </template>

            <template v-else>
              <div v-for="(cert, i) in snapshot.certifications" :key="i" class="mt-[10pt]">
                <div class="flex items-baseline justify-between gap-[10pt]">
                  <p class="font-bold min-w-0">{{ cert.name }}</p>
                  <p v-if="cert.issueDate" class="shrink-0 whitespace-nowrap">{{ cert.issueDate }}</p>
                </div>
                <p v-if="cert.issuer" :style="{ color: SUBHEADER }">{{ cert.issuer }}</p>
              </div>
            </template>

            <div
              v-if="index < mainSections.length - 1"
              class="mt-[10pt] h-[0.5pt]"
              :style="{ backgroundColor: DIVIDER }"
            />
          </section>
        </main>

        <aside class="pl-[25pt] min-w-0" :style="{ borderLeft: `0.5pt solid ${DIVIDER}` }">
          <section
            v-for="(section, index) in sideSections"
            :key="section"
            class="pb-[10pt]"
          >
            <h2 class="bandeau-title" :style="{ color: accent }">
              {{
                section === 'personal'
                  ? 'Informations personnelles'
                  : section === 'skills'
                    ? 'Compétences'
                    : section === 'languages'
                      ? 'Langues'
                      : "Centres d'intérêt"
              }}
            </h2>

            <template v-if="section === 'personal'">
              <div v-for="detail in sidePersonalDetails" :key="detail.label" class="mt-[10pt]">
                <p :style="{ color: SUBHEADER }">{{ detail.label }}</p>
                <p class="break-all">{{ detail.value }}</p>
              </div>
            </template>

            <ul v-else-if="section === 'skills'" class="mt-[10pt] space-y-[5pt]">
              <li v-for="(skill, i) in snapshot.skills" :key="i" class="flex items-center gap-[8pt]">
                <span class="w-[35%] shrink-0 break-words">{{ skill.name }}</span>
                <span
                  v-if="skill.level"
                  class="flex-1 h-[4pt] rounded-full overflow-hidden"
                  :style="{ backgroundColor: barOffColor }"
                >
                  <span
                    class="block h-full rounded-full"
                    :style="{ width: `${SKILL_LEVEL_PERCENT[skill.level]}%`, backgroundColor: accent }"
                  />
                </span>
              </li>
            </ul>

            <ul v-else-if="section === 'languages'" class="mt-[10pt] space-y-[5pt]">
              <li v-for="(lang, i) in snapshot.languages" :key="i" class="flex items-center gap-[8pt]">
                <span class="w-[35%] shrink-0 break-words">{{ lang.name }}</span>
                <span
                  v-if="lang.level"
                  class="flex-1 h-[4pt] rounded-full overflow-hidden"
                  :style="{ backgroundColor: barOffColor }"
                >
                  <span
                    class="block h-full rounded-full"
                    :style="{ width: `${languageLevelPercent(lang.level)}%`, backgroundColor: accent }"
                  />
                </span>
              </li>
            </ul>

            <ul v-else class="mt-[10pt] space-y-[3pt]">
              <li v-for="(interest, i) in snapshot.interests" :key="i" class="flex items-start gap-[6pt]">
                <span class="mt-[5pt] w-[4pt] h-[4pt] rounded-full shrink-0" :style="{ backgroundColor: accent }" />
                <span>{{ interest.name }}</span>
              </li>
            </ul>

            <div
              v-if="index < sideSections.length - 1"
              class="mt-[10pt] h-[0.5pt]"
              :style="{ backgroundColor: DIVIDER }"
            />
          </section>
        </aside>
      </div>
    </div>
  </TemplatesTemplateShell>
</template>

<style scoped>
.bandeau {
  font-family: 'Poppins', Arial, Helvetica, sans-serif;
}

.bandeau-title {
  font-size: 15pt;
  line-height: 18pt;
  font-weight: 400;
}
</style>
