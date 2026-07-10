<script setup lang="ts">
import type { LanguageLevel, ResumeSnapshot } from '@profiloz/shared'
import { formatDateRange } from '~/composables/useResumeSections'

const props = defineProps<{ resume: ResumeSnapshot }>()
const {
  accent,
  p,
  contactItems,
  snapshot,
  hasSummary,
  hasExperiences,
  hasEducations,
  hasSkills,
  hasLanguages,
  hasCertifications,
  showPhotoBlock,
  initials,
} = useResumeSections(() => props.resume)

const LANGUAGE_LEVELS: Record<LanguageLevel, number> = {
  NATIVE: 5,
  PROFESSIONAL: 4,
  CONVERSATIONAL: 3,
  BASIC: 2,
}

function languageLevelDots(level?: LanguageLevel) {
  const max = 5
  const current = level ? LANGUAGE_LEVELS[level] : 0
  return Array.from({ length: max }, (_, i) => i < current)
}

function descriptionLines(description?: string) {
  return description
    ?.split('\n')
    .map((line) => line.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean) ?? []
}
</script>

<template>
  <TemplatesTemplateShell :resume="resume" template-name="Commercial">
    <div class="flex gap-0 -m-[20mm] min-h-[297mm] bg-white">
      <!-- Left Sidebar (Sombre) -->
      <aside
        class="w-[72mm] shrink-0 text-white flex flex-col p-6 space-y-6 select-none"
        :style="{ backgroundColor: accent }"
      >
        <!-- Identity -->
        <div class="text-center pt-2">
          <!-- Avatar Frame -->
          <div v-if="showPhotoBlock" class="flex justify-center mb-4">
            <div class="w-24 h-24 rounded-full border-[3px] border-white/20 overflow-hidden shadow-lg">
              <ResumePhotoAvatar
                :photo-url="p.photoUrl"
                :initials="initials"
                accent="#ffffff"
                shape="circle"
                size-class="w-full h-full"
                fallback-class="text-2xl font-bold"
                :fallback-style="{ background: 'rgba(255, 255, 255, 0.15)' }"
              />
            </div>
          </div>
          <h1 class="text-[16pt] font-serif font-bold leading-tight tracking-tight mt-2">
            {{ p.fullName || 'Votre Nom' }}
          </h1>
          <p class="text-[9pt] font-medium tracking-wide opacity-80 mt-1 uppercase">
            {{ p.jobTitle || 'Votre Poste' }}
          </p>
        </div>

        <!-- Divider -->
        <div class="h-px bg-white/10" />

        <!-- Contact details -->
        <ul class="space-y-3 text-[8.5pt]">
          <li v-if="p.email" class="flex items-center gap-3">
            <span class="w-5 h-5 flex items-center justify-center bg-white/10 rounded shrink-0">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <path d="M22 6l-10 7L2 6"/>
              </svg>
            </span>
            <span class="break-all opacity-90">{{ p.email }}</span>
          </li>
          <li v-if="p.phone" class="flex items-center gap-3">
            <span class="w-5 h-5 flex items-center justify-center bg-white/10 rounded shrink-0">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
              </svg>
            </span>
            <span class="opacity-90">{{ p.phone }}</span>
          </li>
          <li v-if="p.location" class="flex items-start gap-3">
            <span class="w-5 h-5 flex items-center justify-center bg-white/10 rounded shrink-0 mt-0.5">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                <circle cx="12" cy="9" r="2.5"/>
              </svg>
            </span>
            <span class="opacity-90 leading-tight">{{ p.location }}</span>
          </li>
          <li v-if="p.linkedinUrl" class="flex items-center gap-3">
            <span class="w-5 h-5 flex items-center justify-center bg-white/10 rounded shrink-0">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
            </span>
            <span class="break-all opacity-90">{{ p.linkedinUrl }}</span>
          </li>
          <li v-if="p.websiteUrl" class="flex items-center gap-3">
            <span class="w-5 h-5 flex items-center justify-center bg-white/10 rounded shrink-0">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
              </svg>
            </span>
            <span class="break-all opacity-90">{{ p.websiteUrl }}</span>
          </li>
        </ul>

        <!-- Profile Section in Sidebar -->
        <section v-if="hasSummary" class="space-y-2">
          <div class="bg-white/10 px-3 py-1.5 rounded flex items-center gap-2 text-[8pt] font-bold uppercase tracking-wider">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span>Profil</span>
          </div>
          <p class="text-[8.5pt] leading-[1.6] text-white/90 font-light px-1">
            {{ snapshot.summary }}
          </p>
        </section>

        <!-- Languages Section in Sidebar -->
        <section v-if="hasLanguages" class="space-y-2">
          <div class="bg-white/10 px-3 py-1.5 rounded flex items-center gap-2 text-[8pt] font-bold uppercase tracking-wider">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
            </svg>
            <span>Langues</span>
          </div>
          <ul class="space-y-2 px-1">
            <li
              v-for="(lang, i) in snapshot.languages"
              :key="i"
              class="flex justify-between items-center text-[8.5pt]"
            >
              <span class="opacity-90 font-medium">{{ lang.name }}</span>
              <div class="flex gap-1 shrink-0">
                <span
                  v-for="(filled, dotIndex) in languageLevelDots(lang.level)"
                  :key="dotIndex"
                  class="w-1.5 h-1.5 rounded-full"
                  :class="filled ? 'bg-white' : 'bg-white/30'"
                />
              </div>
            </li>
          </ul>
        </section>

        <!-- Awards / Certifications Section in Sidebar -->
        <section v-if="hasCertifications" class="space-y-2">
          <div class="bg-white/10 px-3 py-1.5 rounded flex items-center gap-2 text-[8pt] font-bold uppercase tracking-wider">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="8" r="7"/>
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
            </svg>
            <span>Distinctions</span>
          </div>
          <ul class="space-y-3 px-1 text-[8.5pt]">
            <li v-for="(cert, i) in snapshot.certifications" :key="i" class="leading-snug">
              <p class="font-bold opacity-95">{{ cert.name }}</p>
              <p class="text-[7.5pt] opacity-80 mt-0.5">
                {{ cert.issuer }}<span v-if="cert.issueDate">, {{ cert.issueDate }}</span>
              </p>
            </li>
          </ul>
        </section>
      </aside>

      <!-- Right Column (Contenu Principal) -->
      <main class="flex-1 p-8 space-y-7 bg-white text-slate-800">
        <!-- Professional Experience -->
        <section v-if="hasExperiences">
          <div class="bg-slate-100/80 px-4 py-2 rounded flex items-center gap-2.5 mb-4 text-slate-800">
            <svg class="w-4 h-4 text-slate-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
            </svg>
            <h2 class="text-[9pt] font-black uppercase tracking-wider">
              Expérience Professionnelle
            </h2>
          </div>
          <div class="space-y-6 pl-1">
            <div
              v-for="(exp, i) in snapshot.experiences"
              :key="i"
              class="space-y-1.5"
            >
              <div class="flex justify-between items-start gap-4">
                <div>
                  <h3 class="text-[10pt] font-extrabold text-slate-900 leading-tight">
                    {{ exp.company }}
                  </h3>
                  <p class="text-[9pt] font-semibold text-slate-700 mt-0.5">
                    {{ exp.position }}
                  </p>
                </div>
                <div class="text-right text-[8pt] text-slate-500 shrink-0 leading-normal">
                  <p class="font-medium">
                    {{ formatDateRange(exp.startDate, exp.endDate, exp.isCurrent) }}
                  </p>
                  <p v-if="exp.location" class="opacity-90">
                    {{ exp.location }}<span v-if="exp.country">, {{ exp.country }}</span>
                  </p>
                </div>
              </div>
              <!-- Description bullets -->
              <ul v-if="descriptionLines(exp.description).length" class="list-disc pl-4 space-y-1 text-[8.5pt] text-slate-600 leading-relaxed">
                <li
                  v-for="(line, lineIndex) in descriptionLines(exp.description)"
                  :key="lineIndex"
                >
                  {{ line }}
                </li>
              </ul>
              <p v-else-if="exp.description?.trim()" class="text-[8.5pt] text-slate-600 leading-relaxed whitespace-pre-line">
                {{ exp.description }}
              </p>
            </div>
          </div>
        </section>

        <!-- Education -->
        <section v-if="hasEducations">
          <div class="bg-slate-100/80 px-4 py-2 rounded flex items-center gap-2.5 mb-4 text-slate-800">
            <svg class="w-4 h-4 text-slate-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
            </svg>
            <h2 class="text-[9pt] font-black uppercase tracking-wider">
              Formation
            </h2>
          </div>
          <div class="space-y-4 pl-1">
            <div
              v-for="(edu, i) in snapshot.educations"
              :key="i"
              class="flex justify-between items-start gap-4"
            >
              <div>
                <h3 class="text-[9.5pt] font-extrabold text-slate-900 leading-tight">
                  {{ edu.degree }}
                </h3>
                <p class="text-[8.5pt] font-semibold text-slate-700 mt-0.5">
                  {{ edu.institution }}<span v-if="edu.field"> — {{ edu.field }}</span>
                </p>
              </div>
              <div class="text-right text-[8pt] text-slate-500 shrink-0 leading-normal">
                <p class="font-medium">
                  {{ formatDateRange(edu.startDate, edu.endDate) }}
                </p>
                <p v-if="edu.location" class="opacity-90">
                  {{ edu.location }}
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- Skills -->
        <section v-if="hasSkills">
          <div class="bg-slate-100/80 px-4 py-2 rounded flex items-center gap-2.5 mb-4 text-slate-800">
            <svg class="w-4 h-4 text-slate-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
            <h2 class="text-[9pt] font-black uppercase tracking-wider">
              Compétences
            </h2>
          </div>
          <ul class="list-disc pl-4 space-y-1 text-[8.5pt] text-slate-600 leading-relaxed pl-5">
            <li v-for="(skill, i) in snapshot.skills" :key="i">
              {{ skill.name }}
            </li>
          </ul>
        </section>
      </main>
    </div>
  </TemplatesTemplateShell>
</template>

<style scoped>
:deep(.resume-a4) {
  padding: 0;
  overflow: hidden;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}
</style>
