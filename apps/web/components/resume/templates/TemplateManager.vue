<script setup lang="ts">
import type { LanguageLevel, ResumeSnapshot, SkillLevel } from '@profiloz/shared'
import { formatDateRange } from '~/composables/useResumeSections'
import { formatEducationPeriod } from '~/utils/education'

const props = defineProps<{ resume: ResumeSnapshot }>()
const {
  p,
  snapshot,
  hasSummary,
  hasExperiences,
  hasEducations,
  hasSkills,
  hasInterests,
  hasLanguages,
  hasCertifications,
} = useResumeSections(() => props.resume)

const SKILL_LEVELS: Record<SkillLevel, number> = {
  BEGINNER: 1,
  INTERMEDIATE: 3,
  ADVANCED: 4,
  EXPERT: 5,
}

function skillDots(level?: SkillLevel) {
  const max = 5
  const current = level ? SKILL_LEVELS[level] : 4
  return Array.from({ length: max }, (_, i) => i < current)
}

function descriptionLines(description?: string) {
  return description
    ?.split('\n')
    .map((line) => line.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean) ?? []
}

function parseQuote(name: string) {
  const idx = name.indexOf(':')
  if (idx === -1) return { author: null as string | null, quote: name }
  return { author: name.slice(0, idx).trim(), quote: name.slice(idx + 1).trim() }
}
</script>

<template>
  <TemplatesTemplateShell :resume="resume" template-name="Manager">
    <div class="manager-page">
      <!-- Header -->
      <header class="manager-header">
        <div class="manager-header-name-row">
          <h1 class="manager-name">{{ p.fullName || 'Votre Nom' }}</h1>
          <span class="manager-title">{{ p.jobTitle || 'Votre Poste' }}</span>
        </div>

        <!-- Contact Grid -->
        <div class="manager-contact-grid">
          <div v-if="p.location" class="manager-contact-item">
            <svg class="manager-contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
            <span>{{ p.location }}</span>
          </div>
          <div v-if="p.email" class="manager-contact-item">
            <svg class="manager-contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <path d="M22 6l-10 7L2 6"/>
            </svg>
            <span>{{ p.email }}</span>
          </div>
          <div v-if="p.phone" class="manager-contact-item">
            <svg class="manager-contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
            </svg>
            <span>{{ p.phone }}</span>
          </div>
          <div v-if="p.linkedinUrl" class="manager-contact-item">
            <svg class="manager-contact-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>
            <span>{{ p.linkedinUrl }}</span>
          </div>
          <div v-if="p.websiteUrl" class="manager-contact-item">
            <svg class="manager-contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
            </svg>
            <span>{{ p.websiteUrl }}</span>
          </div>
        </div>
      </header>

      <!-- Profile -->
      <section v-if="hasSummary" class="manager-section">
        <h2 class="manager-section-title">Profile</h2>
        <hr class="manager-divider" />
        <p class="manager-summary">{{ snapshot.summary }}</p>
      </section>

      <!-- Professional Experience -->
      <section v-if="hasExperiences" class="manager-section">
        <h2 class="manager-section-title">Professional Experience</h2>
        <hr class="manager-divider" />
        <div class="manager-experiences">
          <div
            v-for="(exp, i) in snapshot.experiences"
            :key="i"
            class="manager-experience"
          >
            <!-- Left: dates + location -->
            <div class="manager-exp-left">
              <p class="manager-exp-period">
                {{ formatDateRange(exp.startDate, exp.endDate, exp.isCurrent) }}
              </p>
              <p v-if="exp.location" class="manager-exp-location">
                {{ exp.location }}<span v-if="exp.country">, {{ exp.country }}</span>
              </p>
            </div>
            <!-- Right: position + company + bullets -->
            <div class="manager-exp-right">
              <p class="manager-exp-position">{{ exp.position }}</p>
              <p v-if="exp.company" class="manager-exp-company">{{ exp.company }}</p>
              <ul v-if="descriptionLines(exp.description).length" class="manager-exp-bullets">
                <li
                  v-for="(line, li) in descriptionLines(exp.description)"
                  :key="li"
                >{{ line }}</li>
              </ul>
              <p
                v-else-if="exp.description?.trim()"
                class="manager-exp-desc"
              >{{ exp.description }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Education -->
      <section v-if="hasEducations" class="manager-section">
        <h2 class="manager-section-title">Education</h2>
        <hr class="manager-divider" />
        <div class="manager-educations">
          <div
            v-for="(edu, i) in snapshot.educations"
            :key="i"
            class="manager-education"
          >
            <!-- Left: dates + location -->
            <div class="manager-exp-left">
              <p class="manager-exp-period">
                {{ formatEducationPeriod(edu.startDate, edu.endDate) }}
              </p>
              <p v-if="edu.location" class="manager-exp-location">{{ edu.location }}</p>
            </div>
            <!-- Right: degree + institution -->
            <div class="manager-exp-right">
              <p class="manager-edu-degree">{{ edu.degree }}</p>
              <p v-if="edu.field" class="manager-edu-field">{{ edu.field }}</p>
              <p v-if="edu.institution" class="manager-edu-institution">{{ edu.institution }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Skills -->
      <section v-if="hasSkills" class="manager-section">
        <h2 class="manager-section-title">Skills</h2>
        <hr class="manager-divider" />
        <div class="manager-skills-grid">
          <div
            v-for="(skill, i) in snapshot.skills"
            :key="i"
            class="manager-skill-row"
          >
            <span class="manager-skill-name">{{ skill.name }}</span>
            <div class="manager-skill-dots">
              <span
                v-for="(filled, di) in skillDots(skill.level)"
                :key="di"
                class="manager-skill-dot"
                :class="filled ? 'filled' : 'empty'"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- Languages -->
      <section v-if="hasLanguages" class="manager-section">
        <h2 class="manager-section-title">Languages</h2>
        <hr class="manager-divider" />
        <div class="manager-languages">
          <span
            v-for="(lang, i) in snapshot.languages"
            :key="i"
            class="manager-lang-item"
          >
            <span class="manager-lang-bullet">•</span>
            {{ lang.name }}
          </span>
        </div>
      </section>

      <!-- Awards / Certifications -->
      <section v-if="hasCertifications" class="manager-section">
        <h2 class="manager-section-title">Awards</h2>
        <hr class="manager-divider" />
        <div class="manager-awards">
          <div
            v-for="(cert, i) in snapshot.certifications"
            :key="i"
            class="manager-award"
          >
            <p class="manager-award-name">{{ cert.name }}</p>
            <p v-if="cert.issuer" class="manager-award-issuer">{{ cert.issuer }}</p>
          </div>
        </div>
      </section>

      <!-- Favorite Quote (from interests, parsed as Author: Quote text) -->
      <section v-if="hasInterests" class="manager-section">
        <h2 class="manager-section-title">Favorite Quote</h2>
        <hr class="manager-divider" />
        <div class="manager-quotes">
          <div
            v-for="(interest, i) in snapshot.interests"
            :key="i"
            class="manager-quote"
          >
            <template v-if="parseQuote(interest.name).author">
              <p class="manager-quote-author">{{ parseQuote(interest.name).author }}</p>
              <p class="manager-quote-text">{{ parseQuote(interest.name).quote }}</p>
            </template>
            <p v-else class="manager-quote-text">{{ interest.name }}</p>
          </div>
        </div>
      </section>
    </div>
  </TemplatesTemplateShell>
</template>

<style scoped>
:deep(.resume-a4) {
  font-family: 'Georgia', 'Times New Roman', serif;
  background: #fff;
}

.manager-page {
  color: #1e293b;
  font-size: 9.5pt;
  line-height: 1.55;
}

/* ── Header ── */
.manager-header {
  margin-bottom: 12px;
}

.manager-header-name-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.manager-name {
  font-size: 20pt;
  font-weight: 700;
  line-height: 1.1;
  color: #0f172a;
  letter-spacing: -0.01em;
}

.manager-title {
  font-size: 11pt;
  font-style: italic;
  color: #475569;
  font-weight: 400;
}

.manager-contact-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3px 24px;
  margin-top: 4px;
}

.manager-contact-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 8.5pt;
  color: #334155;
}

.manager-contact-icon {
  width: 11px;
  height: 11px;
  flex-shrink: 0;
  color: #1e293b;
}

/* ── Section ── */
.manager-section {
  margin-bottom: 11px;
}

.manager-section-title {
  font-size: 10pt;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 3px;
  letter-spacing: 0;
}

.manager-divider {
  border: none;
  border-top: 1.5px solid #1e293b;
  margin: 0 0 8px;
}

.manager-summary {
  font-size: 9pt;
  color: #334155;
  line-height: 1.6;
  text-align: justify;
  hyphens: auto;
}

/* ── Experience / Education shared two-col layout ── */
.manager-experiences,
.manager-educations {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.manager-experience,
.manager-education {
  display: grid;
  grid-template-columns: 30mm 1fr;
  gap: 0 10px;
  align-items: start;
}

.manager-exp-left {
  padding-top: 1px;
}

.manager-exp-period {
  font-size: 8pt;
  color: #334155;
  line-height: 1.4;
}

.manager-exp-location {
  font-size: 8pt;
  color: #64748b;
  line-height: 1.4;
  margin-top: 1px;
}

.manager-exp-right {
  padding-top: 1px;
}

.manager-exp-position {
  font-size: 9.5pt;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.3;
}

.manager-exp-company {
  font-size: 9pt;
  font-style: italic;
  color: #475569;
  margin-top: 1px;
}

.manager-exp-bullets {
  list-style: disc;
  padding-left: 14px;
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 8.5pt;
  color: #334155;
  line-height: 1.5;
}

.manager-exp-desc {
  font-size: 8.5pt;
  color: #334155;
  margin-top: 4px;
  white-space: pre-line;
}

/* Education specific */
.manager-edu-degree {
  font-size: 9.5pt;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.3;
}

.manager-edu-field {
  font-size: 9pt;
  font-style: italic;
  color: #475569;
  margin-top: 1px;
}

.manager-edu-institution {
  font-size: 9pt;
  font-style: italic;
  color: #475569;
  margin-top: 1px;
}

/* ── Skills ── */
.manager-skills-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px 24px;
}

.manager-skill-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 9pt;
  color: #334155;
}

.manager-skill-name {
  flex: 1;
  min-width: 0;
}

.manager-skill-dots {
  display: flex;
  gap: 3px;
  flex-shrink: 0;
}

.manager-skill-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1.5px solid #1e293b;
}

.manager-skill-dot.filled {
  background: #1e293b;
}

.manager-skill-dot.empty {
  background: transparent;
}

/* ── Languages ── */
.manager-languages {
  display: flex;
  flex-wrap: wrap;
  gap: 0 20px;
  font-size: 9pt;
  color: #334155;
}

.manager-lang-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.manager-lang-bullet {
  font-size: 10pt;
  color: #1e293b;
}

/* ── Awards ── */
.manager-awards {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.manager-award-name {
  font-size: 9.5pt;
  font-weight: 700;
  color: #0f172a;
}

.manager-award-issuer {
  font-size: 9pt;
  font-style: italic;
  color: #475569;
  margin-top: 1px;
}

/* ── Quotes ── */
.manager-quotes {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.manager-quote-author {
  font-size: 9.5pt;
  font-weight: 700;
  color: #0f172a;
}

.manager-quote-text {
  font-size: 9pt;
  font-style: italic;
  color: #475569;
  margin-top: 1px;
}
</style>
