<script setup lang="ts">
import type { LanguageLevel, ResumeSnapshot } from '@profiloz/shared'
import { formatDateRange } from '~/composables/useResumeSections'
import { formatEducationPeriod } from '~/utils/education'

const props = defineProps<{ resume: ResumeSnapshot }>()
const {
  accent,
  p,
  snapshot,
  hasExperiences,
  hasEducations,
  hasSkills,
  hasInterests,
  hasLanguages,
  showPhotoBlock,
} = useResumeSections(() => props.resume)

// Palette premium
const sidebarBg = '#f8fafc'
const headerBg = computed(() => accent.value || '#1e3a5f')
const primaryText = '#1e293b'
const secondaryText = '#64748b'
const barTrack = '#e2e8f0'

const accentLight = computed(() => {
  const hex = accent.value.replace('#', '')
  if (hex.length !== 6) return '#3b82f6'
  const r = Math.min(255, parseInt(hex.slice(0, 2), 16) + 60)
  const g = Math.min(255, parseInt(hex.slice(2, 4), 16) + 50)
  const b = Math.min(255, parseInt(hex.slice(4, 6), 16) + 30)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
})

const LANGUAGE_BAR_WIDTH: Record<LanguageLevel, number> = {
  BASIC: 25,
  CONVERSATIONAL: 50,
  PROFESSIONAL: 75,
  NATIVE: 100,
}

function languageBarWidth(level?: LanguageLevel) {
  return level ? LANGUAGE_BAR_WIDTH[level] : 50
}

function descriptionLines(description?: string) {
  return description
    ?.split('\n')
    .map((line) => line.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean) ?? []
}

const contactRows = computed(() =>
  [
    { icon: 'phone', value: p.value.phone },
    { icon: 'email', value: p.value.email },
    { icon: 'location', value: p.value.location },
    { icon: 'linkedin', value: p.value.linkedinUrl },
  ].filter((row) => Boolean(row.value)),
)
</script>

<template>
  <TemplatesTemplateShell :resume="resume" template-name="Cadre">
    <div class="cadre-page" :class="{ 'cadre-page--no-photo': !showPhotoBlock }">
      <!-- Ligne du haut : photo (gauche) + bandeau Header (droite) -->
      <div v-if="showPhotoBlock" class="cadre-top-photo" :style="{ backgroundColor: sidebarBg }">
        <div class="cadre-photo-frame">
          <img
            v-if="p.photoUrl"
            :src="p.photoUrl"
            alt=""
            class="cadre-photo-img"
          />
          <div v-else class="cadre-photo-img cadre-photo-placeholder">
            <svg class="w-14 h-14 opacity-25" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path
                d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
              />
            </svg>
          </div>
        </div>
      </div>

      <header class="cadre-top-header" :style="{ backgroundColor: headerBg }">
        <h1 class="cadre-name">{{ p.fullName || 'Votre nom' }}</h1>
        <p class="cadre-title">{{ p.jobTitle || 'Votre poste' }}</p>
      </header>

      <!-- Sidebar -->
      <aside class="cadre-sidebar" :style="{ backgroundColor: sidebarBg }">
        <section v-if="contactRows.length" class="cadre-section">
          <h2 class="cadre-section-title">Coordonnées</h2>
          <div class="cadre-section-line" />
          <ul class="cadre-contact-list">
            <li v-for="row in contactRows" :key="row.icon" class="cadre-contact-item">
              <span class="cadre-contact-icon">
                <svg v-if="row.icon === 'phone'" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <svg v-else-if="row.icon === 'email'" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M22 6l-10 7L2 6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <svg v-else-if="row.icon === 'location'" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <svg v-else-if="row.icon === 'linkedin'" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </span>
              <span class="cadre-contact-text">{{ row.value }}</span>
            </li>
          </ul>
        </section>

        <section v-if="hasLanguages" class="cadre-section">
          <h2 class="cadre-section-title">Langues</h2>
          <div class="cadre-section-line" />
          <ul class="cadre-languages-list">
            <li v-for="(lang, i) in snapshot.languages" :key="i" class="cadre-language-item">
              <span class="cadre-language-name">{{ lang.name }}</span>
              <div class="cadre-language-bar-track">
                <div
                  class="cadre-language-bar-fill"
                  :style="{ width: `${languageBarWidth(lang.level)}%`, backgroundColor: headerBg }"
                />
              </div>
            </li>
          </ul>
        </section>

        <section v-if="hasSkills" class="cadre-section">
          <h2 class="cadre-section-title">Compétences</h2>
          <div class="cadre-section-line" />
          <div class="cadre-skills">
            <span
              v-for="(skill, i) in snapshot.skills"
              :key="i"
              class="cadre-skill-badge"
            >
              {{ skill.name }}
            </span>
          </div>
        </section>

        <section v-if="hasInterests" class="cadre-section">
          <h2 class="cadre-section-title">Centres d'intérêt</h2>
          <div class="cadre-section-line" />
          <ul class="cadre-interests-list">
            <li v-for="(interest, i) in snapshot.interests" :key="i" class="cadre-interest-item">
              {{ interest.name }}
            </li>
          </ul>
        </section>
      </aside>

      <!-- Contenu principal -->
      <main class="cadre-main">
        <section v-if="hasEducations" class="cadre-section cadre-section-main">
          <h2 class="cadre-section-title">Formation</h2>
          <div class="cadre-section-line" />
          <div class="cadre-educations">
            <div v-for="(edu, i) in snapshot.educations" :key="i" class="cadre-education">
              <div class="cadre-education-main">
                <p v-if="edu.degree" class="cadre-education-degree">{{ edu.degree }}</p>
                <p v-if="edu.institution" class="cadre-education-institution">{{ edu.institution }}<span v-if="edu.field"> · {{ edu.field }}</span></p>
              </div>
              <p
                v-if="formatEducationPeriod(edu.startDate, edu.endDate) || edu.endDate || edu.startDate"
                class="cadre-education-date"
              >
                {{ formatEducationPeriod(edu.startDate, edu.endDate) || edu.endDate || edu.startDate }}
              </p>
            </div>
          </div>
        </section>

        <section v-if="hasExperiences" class="cadre-section cadre-section-main">
          <h2 class="cadre-section-title">Expérience Professionnelle</h2>
          <div class="cadre-section-line" />
          <div class="cadre-timeline">
            <div class="cadre-timeline-line" aria-hidden="true" />
            <div v-for="(exp, i) in snapshot.experiences" :key="i" class="cadre-timeline-item">
              <div class="cadre-timeline-dot" aria-hidden="true" />
              <div class="cadre-experience-header">
                <p v-if="exp.position" class="cadre-experience-position">
                  {{ exp.position }}
                </p>
                <p
                  v-if="formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)"
                  class="cadre-experience-date"
                >
                  {{ formatDateRange(exp.startDate, exp.endDate, exp.isCurrent) }}
                </p>
              </div>
              <p v-if="exp.company || exp.location" class="cadre-experience-company">
                <span v-if="exp.company">{{ exp.company }}</span>
                <span v-if="exp.company && exp.location"> · </span>
                <span v-if="exp.location">{{ exp.location }}</span>
              </p>
              <ul v-if="descriptionLines(exp.description).length" class="cadre-bullets">
                <li
                  v-for="(line, lineIndex) in descriptionLines(exp.description)"
                  :key="lineIndex"
                  class="cadre-bullet-item"
                >
                  {{ line }}
                </li>
              </ul>
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

.cadre-page {
  display: grid;
  grid-template-columns: 72mm 1fr;
  grid-template-rows: auto 1fr;
  min-height: 297mm;
  margin: -20mm;
  background: #fff;
}

.cadre-page--no-photo .cadre-top-header {
  grid-column: 1 / -1;
}

/* Photo premium */
.cadre-top-photo {
  grid-column: 1;
  grid-row: 1;
  padding: 12mm 0 6mm 10mm;
}

.cadre-photo-frame {
  width: 44mm;
  height: 44mm;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 2px solid rgba(255, 255, 255, 0.8);
}

.cadre-photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cadre-photo-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #e2e8f0 0%, #f1f5f9 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
}

/* Header premium */
.cadre-top-header {
  grid-column: 2;
  grid-row: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 12mm 14mm 12mm 6mm;
  min-height: 44mm;
}

.cadre-name {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 30px;
  font-weight: 600;
  line-height: 1.2;
  color: #fff;
  margin-bottom: 2mm;
  letter-spacing: -0.01em;
}

.cadre-title {
  font-size: 12px;
  font-weight: 400;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.85);
}

/* Sidebar */
.cadre-sidebar {
  grid-column: 1;
  grid-row: 2;
  padding: 4mm 8mm 14mm 10mm;
}

.cadre-section {
  margin-bottom: 10mm;
}

.cadre-section:last-child {
  margin-bottom: 0;
}

.cadre-section-title {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: #1e293b;
  margin-bottom: 3mm;
}

.cadre-section-line {
  width: 12mm;
  height: 1px;
  background: linear-gradient(to right, #cbd5e1, transparent);
  margin-bottom: 5mm;
}

.cadre-contact-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.cadre-contact-item {
  display: flex;
  align-items: center;
  gap: 3mm;
  margin-bottom: 3mm;
}

.cadre-contact-item:last-child {
  margin-bottom: 0;
}

.cadre-contact-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: #e2e8f0;
  border-radius: 5px;
  color: #64748b;
  flex-shrink: 0;
}

.cadre-contact-text {
  font-size: 8.5px;
  line-height: 1.4;
  color: #475569;
  word-break: break-word;
}

/* Languages */
.cadre-languages-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.cadre-language-item {
  display: flex;
  align-items: center;
  gap: 3mm;
  margin-bottom: 2.5mm;
}

.cadre-language-item:last-child {
  margin-bottom: 0;
}

.cadre-language-name {
  font-size: 8.5px;
  font-weight: 500;
  color: #475569;
  width: 16mm;
  flex-shrink: 0;
}

.cadre-language-bar-track {
  flex: 1;
  height: 3px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
}

.cadre-language-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* Skills badges */
.cadre-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 2mm;
}

.cadre-skill-badge {
  font-size: 7.5px;
  font-weight: 500;
  padding: 1.5mm 2.5mm;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  color: #475569;
}

/* Interests */
.cadre-interests-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.cadre-interest-item {
  font-size: 8.5px;
  line-height: 1.5;
  color: #475569;
  margin-bottom: 1.5mm;
}

.cadre-interest-item:last-child {
  margin-bottom: 0;
}

/* Main content */
.cadre-main {
  grid-column: 2;
  grid-row: 2;
  background: #fff;
  padding: 8mm 14mm 14mm 6mm;
}

.cadre-section-main {
  margin-bottom: 12mm;
}

/* Education */
.cadre-educations {
  display: flex;
  flex-direction: column;
  gap: 5mm;
}

.cadre-education {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 4mm;
}

.cadre-education-main {
  flex: 1;
  min-width: 0;
}

.cadre-education-degree {
  font-size: 10.5px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.5mm;
}

.cadre-education-institution {
  font-size: 9px;
  color: #64748b;
}

.cadre-education-date {
  font-size: 8px;
  color: #94a3b8;
  white-space: nowrap;
}

/* Timeline premium */
.cadre-timeline {
  position: relative;
  padding-left: 6mm;
}

.cadre-timeline-line {
  position: absolute;
  left: 1.5mm;
  top: 1mm;
  bottom: 1mm;
  width: 0.5px;
  background: linear-gradient(to bottom, transparent, #cbd5e1 10%, #cbd5e1 90%, transparent);
}

.cadre-timeline-item {
  position: relative;
  margin-bottom: 8mm;
}

.cadre-timeline-item:last-child {
  margin-bottom: 0;
}

.cadre-timeline-dot {
  position: absolute;
  left: -5.5mm;
  top: 2mm;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #1e3a5f;
  box-shadow: 0 0 0 2px rgba(30, 58, 95, 0.1);
}

.cadre-experience-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 4mm;
  margin-bottom: 1mm;
}

.cadre-experience-position {
  font-size: 10.5px;
  font-weight: 600;
  color: #1e293b;
  letter-spacing: 0.02em;
}

.cadre-experience-date {
  font-size: 8.5px;
  color: #94a3b8;
  white-space: nowrap;
}

.cadre-experience-company {
  font-size: 9px;
  color: #64748b;
  margin-bottom: 2mm;
}

.cadre-bullets {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1.5mm;
}

.cadre-bullet-item {
  position: relative;
  padding-left: 4mm;
  font-size: 9px;
  line-height: 1.6;
  color: #475569;
}

.cadre-bullet-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #1e3a5f;
}
</style>
