<script setup lang="ts">
import type { LanguageLevel, ResumeSnapshot } from '@profiloz/shared'
import { formatDateRange } from '~/composables/useResumeSections'
import { formatEducationPeriod } from '~/utils/education'

const props = defineProps<{ resume: ResumeSnapshot }>()
const {
  accent,
  p,
  snapshot,
  hasSummary,
  hasExperiences,
  hasEducations,
  hasSkills,
  hasInterests,
  hasLanguages,
  showPhotoBlock,
} = useResumeSections(() => props.resume)

// Palette premium
const sidebarBg = computed(() => accent.value || '#1a2332')
const mainText = '#2d3436'
const accentColor = '#6366f1'
const secondaryText = '#64748b'

const LANGUAGE_LABELS: Record<LanguageLevel, string> = {
  NATIVE: 'Bilingue',
  PROFESSIONAL: 'Courant',
  CONVERSATIONAL: 'Intermédiaire',
  BASIC: 'Niveau scolaire',
}

const LANGUAGE_LEVELS: Record<LanguageLevel, number> = {
  NATIVE: 5,
  PROFESSIONAL: 4,
  CONVERSATIONAL: 3,
  BASIC: 2,
}

function formatLanguageLevel(level?: LanguageLevel) {
  return level ? LANGUAGE_LABELS[level] : ''
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

function parseInterest(name: string) {
  const idx = name.indexOf(':')
  if (idx === -1) return { label: null as string | null, value: name }
  return { label: name.slice(0, idx).trim(), value: name.slice(idx + 1).trim() }
}

function interestIcon(label: string | null) {
  if (!label) return 'star'
  if (/sport|fitness|gym|running|tennis|football/i.test(label)) return 'fitness'
  if (/voyage|travel|trip|traveling/i.test(label)) return 'plane'
  if (/music|musique|guitar|piano|chant/i.test(label)) return 'music'
  if (/reading|lecture|book|livre/i.test(label)) return 'book'
  if (/photo|photography|camera/i.test(label)) return 'camera'
  if (/art|painting|dessin|peinture/i.test(label)) return 'palette'
  if (/tech|code|programming|dev/i.test(label)) return 'code'
  if (/food|cuisine|cooking|chef/i.test(label)) return 'utensils'
  if (/nature|garden|jardin/i.test(label)) return 'leaf'
  return 'star'
}

const contactRows = computed(() =>
  [
    { icon: 'location', value: p.value.location },
    { icon: 'email', value: p.value.email },
    { icon: 'phone', value: p.value.phone },
    { icon: 'linkedin', value: p.value.linkedinUrl },
  ].filter((row) => Boolean(row.value)),
)
</script>

<template>
  <TemplatesTemplateShell :resume="resume" template-name="Exécutif">
    <div class="executif-page">
      <aside class="executif-sidebar" :style="{ backgroundColor: sidebarBg }">
        <div v-if="showPhotoBlock" class="executif-photo-wrap">
          <div class="executif-photo-frame">
            <img v-if="p.photoUrl" :src="p.photoUrl" alt="" class="executif-photo" />
            <div v-else class="executif-photo executif-photo-placeholder">
              <svg class="w-16 h-16 opacity-30" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path
                  d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                />
              </svg>
            </div>
          </div>
        </div>

        <section v-if="hasSummary" class="executif-sidebar-section">
          <h2 class="executif-sidebar-title">Profil</h2>
          <div class="executif-sidebar-line" />
          <p class="executif-sidebar-text">{{ snapshot.summary }}</p>
        </section>

        <section v-if="contactRows.length" class="executif-sidebar-section">
          <h2 class="executif-sidebar-title">Contact</h2>
          <div class="executif-sidebar-line" />
          <ul class="executif-contact-list">
            <li v-for="row in contactRows" :key="row.icon" class="executif-contact-item">
              <span class="executif-contact-icon">
                <svg v-if="row.icon === 'location'" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <svg v-else-if="row.icon === 'email'" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M22 6l-10 7L2 6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <svg v-else-if="row.icon === 'phone'" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <svg v-else-if="row.icon === 'linkedin'" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </span>
              <span class="executif-contact-text">{{ row.value }}</span>
            </li>
          </ul>
        </section>

        <section v-if="hasInterests" class="executif-sidebar-section">
          <h2 class="executif-sidebar-title">Intérêts</h2>
          <div class="executif-sidebar-line" />
          <ul class="executif-interests-list">
            <li
              v-for="(interest, i) in snapshot.interests"
              :key="i"
              class="executif-interest-item"
            >
              <span class="executif-interest-icon">
                <svg v-if="interestIcon(parseInterest(interest.name).label) === 'fitness'" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                  <path d="M18 6l-6 12-6-12" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M6 6l6 12 6-12" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="12" cy="4" r="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <svg v-else-if="interestIcon(parseInterest(interest.name).label) === 'plane'" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                  <path d="M22 2L11 12" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M22 2l-7 20-4-9-9-4 20-7z" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <svg v-else-if="interestIcon(parseInterest(interest.name).label) === 'music'" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                  <path d="M9 18V5l12-2v13" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="6" cy="18" r="3" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="18" cy="16" r="3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <svg v-else-if="interestIcon(parseInterest(interest.name).label) === 'book'" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                  <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <svg v-else-if="interestIcon(parseInterest(interest.name).label) === 'camera'" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="12" cy="13" r="4" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <svg v-else-if="interestIcon(parseInterest(interest.name).label) === 'palette'" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                  <circle cx="13.5" cy="6.5" r=".5" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="17.5" cy="10.5" r=".5" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="8.5" cy="7.5" r=".5" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="6.5" cy="12.5" r=".5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <svg v-else-if="interestIcon(parseInterest(interest.name).label) === 'code'" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                  <polyline points="16 18 22 12 16 6" stroke-linecap="round" stroke-linejoin="round"/>
                  <polyline points="8 6 2 12 8 18" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <svg v-else-if="interestIcon(parseInterest(interest.name).label) === 'utensils'" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                  <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M7 2v20" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M21 15V2v0a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <svg v-else-if="interestIcon(parseInterest(interest.name).label) === 'leaf'" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                  <path d="M11 20A7 7 0 019.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <svg v-else class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </span>
              <span class="executif-interest-text">
                <span v-if="parseInterest(interest.name).label" class="executif-interest-label">
                  {{ parseInterest(interest.name).label }} :
                </span>
                {{ parseInterest(interest.name).value }}
              </span>
            </li>
          </ul>
        </section>
      </aside>

      <main class="executif-main">
        <header class="executif-header">
          <h1 class="executif-name">{{ p.fullName || 'Votre nom' }}</h1>
          <div class="executif-header-line" />
          <p class="executif-title">{{ p.jobTitle || 'Votre poste' }}</p>
        </header>

        <section v-if="hasExperiences" class="executif-main-section">
          <h2 class="executif-main-title">Expérience professionnelle</h2>
          <div class="executif-main-line" />
          <div class="executif-experiences">
            <div
              v-for="(exp, i) in snapshot.experiences"
              :key="i"
              class="executif-experience"
            >
              <div class="executif-experience-left">
                <p v-if="formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)" class="executif-experience-date">
                  {{ formatDateRange(exp.startDate, exp.endDate, exp.isCurrent) }}
                </p>
                <p v-if="exp.company" class="executif-experience-company">{{ exp.company }}</p>
              </div>
              <div class="executif-experience-right">
                <p v-if="exp.position" class="executif-experience-position">
                  {{ exp.position }}
                </p>
                <ul v-if="descriptionLines(exp.description).length" class="executif-experience-description">
                  <li
                    v-for="(line, lineIndex) in descriptionLines(exp.description)"
                    :key="lineIndex"
                  >
                    {{ line }}
                  </li>
                </ul>
                <p
                  v-else-if="exp.description?.trim()"
                  class="executif-experience-description-text"
                >
                  {{ exp.description }}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section v-if="hasEducations" class="executif-main-section">
          <h2 class="executif-main-title">Formation</h2>
          <div class="executif-main-line" />
          <div class="executif-educations">
            <div
              v-for="(edu, i) in snapshot.educations"
              :key="i"
              class="executif-education"
            >
              <div class="executif-education-main">
                <p v-if="edu.degree" class="executif-education-degree">{{ edu.degree }}</p>
                <p v-if="edu.institution" class="executif-education-institution">{{ edu.institution }}</p>
              </div>
              <p v-if="formatEducationPeriod(edu.startDate, edu.endDate) || edu.endDate || edu.startDate" class="executif-education-date">
                {{ formatEducationPeriod(edu.startDate, edu.endDate) || edu.endDate || edu.startDate }}
              </p>
            </div>
          </div>
        </section>

        <section v-if="hasSkills" class="executif-main-section">
          <h2 class="executif-main-title">Compétences</h2>
          <div class="executif-main-line" />
          <div class="executif-skills">
            <span
              v-for="(skill, i) in snapshot.skills"
              :key="i"
              class="executif-skill-badge"
            >
              {{ skill.name }}
            </span>
          </div>
        </section>

        <section v-if="hasLanguages" class="executif-main-section">
          <h2 class="executif-main-title">Langues</h2>
          <div class="executif-main-line" />
          <div class="executif-languages">
            <div
              v-for="(lang, i) in snapshot.languages"
              :key="i"
              class="executif-language-item"
            >
              <span class="executif-language-name">{{ lang.name }}</span>
              <div class="executif-language-dots">
                <span
                  v-for="(filled, dotIndex) in languageLevelDots(lang.level)"
                  :key="dotIndex"
                  class="executif-language-dot"
                  :class="filled ? 'filled' : 'empty'"
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  </TemplatesTemplateShell>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');

:deep(.resume-a4) {
  padding: 0;
  overflow: hidden;
  font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  background: #fafafa;
}

.executif-page {
  display: flex;
  min-height: 297mm;
  margin: -20mm;
  background: #fff;
}

/* Sidebar premium */
.executif-sidebar {
  width: 72mm;
  shrink: 0;
  color: rgba(255, 255, 255, 0.95);
  padding: 0 8mm 12mm;
  position: relative;
}

.executif-sidebar::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 1px;
  height: 100%;
  background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.1) 20%, rgba(255, 255, 255, 0.1) 80%, transparent);
}

.executif-photo-wrap {
  padding: 10mm 0 8mm;
}

.executif-photo-frame {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  border: 3px solid rgba(255, 255, 255, 0.15);
}

.executif-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.executif-photo-placeholder {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
}

.executif-sidebar-section {
  margin-bottom: 9mm;
}

.executif-sidebar-section:last-child {
  margin-bottom: 0;
}

.executif-sidebar-title {
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  text-align: center;
  margin-bottom: 3mm;
  color: rgba(255, 255, 255, 0.9);
}

.executif-sidebar-line {
  width: 14mm;
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.6), transparent);
  margin: 0 auto 5mm;
}

.executif-sidebar-text {
  font-size: 8.5px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.85);
  text-align: center;
  padding: 0 2mm;
}

.executif-contact-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.executif-contact-item {
  display: flex;
  align-items: center;
  gap: 3mm;
  margin-bottom: 3mm;
}

.executif-contact-item:last-child {
  margin-bottom: 0;
}

.executif-contact-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.9);
  shrink: 0;
}

.executif-contact-text {
  font-size: 8.5px;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.85);
  word-break: break-word;
}

.executif-interests-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.executif-interest-item {
  display: flex;
  align-items: flex-start;
  gap: 2.5mm;
  margin-bottom: 2.5mm;
}

.executif-interest-item:last-child {
  margin-bottom: 0;
}

.executif-interest-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.9);
  shrink: 0;
  margin-top: 1px;
}

.executif-interest-text {
  font-size: 8.5px;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.85);
  word-break: break-word;
}

.executif-interest-label {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  margin-right: 2px;
}

/* Main content */
.executif-main {
  flex: 1;
  min-width: 0;
  background: #fff;
  padding: 12mm 12mm 14mm 10mm;
  color: #2d3436;
}

/* Header premium */
.executif-header {
  margin-bottom: 12mm;
  padding-bottom: 8mm;
}

.executif-name {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 32px;
  font-weight: 600;
  line-height: 1.2;
  color: #1a1a2e;
  margin-bottom: 4mm;
  letter-spacing: -0.02em;
}

.executif-header-line {
  width: 40mm;
  height: 2px;
  background: linear-gradient(to right, #6366f1, transparent);
  margin-bottom: 3mm;
}

.executif-title {
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: #64748b;
  margin-top: 2mm;
}

/* Sections */
.executif-main-section {
  margin-bottom: 10mm;
}

.executif-main-section:last-child {
  margin-bottom: 0;
}

.executif-main-title {
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  margin-bottom: 3mm;
  color: #1a1a2e;
}

.executif-main-line {
  width: 16mm;
  height: 2px;
  background: linear-gradient(to right, #6366f1, transparent);
  margin-bottom: 6mm;
}

/* Experiences */
.executif-experiences {
  display: flex;
  flex-direction: column;
  gap: 6mm;
}

.executif-experience {
  display: grid;
  grid-template-columns: 28mm 1fr;
  gap-x: 5mm;
  align-items: start;
}

.executif-experience-left {
  padding-top: 1px;
}

.executif-experience-date {
  font-size: 9px;
  font-weight: 500;
  color: #64748b;
  margin-bottom: 1mm;
}

.executif-experience-company {
  font-size: 9px;
  font-weight: 600;
  color: #1a1a2e;
}

.executif-experience-right {
  padding-top: 1px;
}

.executif-experience-position {
  font-size: 10px;
  font-weight: 600;
  color: #1a1a2e;
  letter-spacing: 0.05em;
  margin-bottom: 2mm;
}

.executif-experience-description {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1mm;
}

.executif-experience-description li {
  font-size: 9px;
  line-height: 1.6;
  color: #4a5568;
  padding-left: 4mm;
  position: relative;
}

.executif-experience-description li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #6366f1;
}

.executif-experience-description-text {
  font-size: 9px;
  line-height: 1.6;
  color: #4a5568;
  margin-top: 2mm;
  white-space: pre-line;
}

/* Education */
.executif-educations {
  display: flex;
  flex-direction: column;
  gap: 4mm;
}

.executif-education {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 4mm;
}

.executif-education-main {
  flex: 1;
  min-width: 0;
}

.executif-education-degree {
  font-size: 10px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 0.5mm;
}

.executif-education-institution {
  font-size: 9px;
  color: #64748b;
}

.executif-education-date {
  font-size: 8.5px;
  color: #94a3b8;
  white-space: nowrap;
}

/* Skills badges */
.executif-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 2mm;
}

.executif-skill-badge {
  font-size: 8px;
  font-weight: 500;
  padding: 1.5mm 3mm;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  color: #475569;
}

/* Languages with dots */
.executif-languages {
  display: flex;
  flex-direction: column;
  gap: 2.5mm;
}

.executif-language-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 4mm;
}

.executif-language-name {
  font-size: 9px;
  font-weight: 500;
  color: #1a1a2e;
}

.executif-language-dots {
  display: flex;
  gap: 1mm;
}

.executif-language-dot {
  width: 3mm;
  height: 3mm;
  border-radius: 50%;
}

.executif-language-dot.filled {
  background: #6366f1;
}

.executif-language-dot.empty {
  background: #e2e8f0;
}
</style>
