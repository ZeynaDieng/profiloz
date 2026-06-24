# 09 — Tasks Profilo'Z

> **Statut :** Backlog de développement complet — à valider avant implémentation  
> **Format :** Epic → Feature → Task → Subtask  
> **Estimation :** heures (h) | **Priorité :** P0 (critique) · P1 (important) · P2 (nice) · P3 (later)

---

## Légende

| Champ | Description |
|-------|-------------|
| **ID** | Identifiant unique |
| **Est.** | Estimation en heures |
| **Dep.** | Dépendances (IDs) |
| **Assign.** | FE = Frontend · BE = Backend · FS = Full-stack · DevOps · Design |

---

# EPIC E0 — Setup Projet & Infrastructure

## Feature F0.1 — Monorepo Initialization

| ID | Task | Subtasks | Est. | P | Dep. | Assign. |
|----|------|----------|------|---|------|---------|
| T0.1.1 | Initialiser monorepo pnpm + Turborepo | Créer `pnpm-workspace.yaml`; Configurer `turbo.json` pipelines dev/build/lint; Root `package.json` scripts | 4h | P0 | — | DevOps |
| T0.1.2 | Scaffold `apps/web` Nuxt 4 | `nuxi init`; TypeScript strict; Configurer alias `~`; `.env.example` | 4h | P0 | T0.1.1 | FE |
| T0.1.3 | Scaffold `apps/api` Next.js 15 | App Router; TypeScript; Structure `src/modules/`; `.env.example` | 4h | P0 | T0.1.1 | BE |
| T0.1.4 | Package `@profiloz/shared` | Types communs Resume, Template, Document; Constants; Export index | 6h | P0 | T0.1.1 | FS |
| T0.1.5 | Package `@profiloz/validators` | Zod schemas auth, resume, document; Export types inférés | 8h | P0 | T0.1.4 | FS |
| T0.1.6 | ESLint + Prettier shared config | Package `eslint-config`; Husky pre-commit; lint-staged | 4h | P1 | T0.1.1 | DevOps |

## Feature F0.2 — Docker & Database

| ID | Task | Subtasks | Est. | P | Dep. | Assign. |
|----|------|----------|------|---|------|---------|
| T0.2.1 | Docker Compose dev | Service postgres:16; volumes; networks; healthcheck | 3h | P0 | T0.1.1 | DevOps |
| T0.2.2 | Prisma init | `schema.prisma` baseline; migration init; seed script stub | 4h | P0 | T0.2.1 | BE |
| T0.2.3 | Dockerfile.api | Multi-stage; Node 20; Puppeteer deps; Chrome install | 6h | P0 | T0.1.3 | DevOps |
| T0.2.4 | Dockerfile.web | Multi-stage; Node 20; Nuxt output standalone | 4h | P0 | T0.1.2 | DevOps |
| T0.2.5 | Docker Compose full stack | web + api + postgres; env vars; port mapping 3000/3001 | 4h | P0 | T0.2.3, T0.2.4 | DevOps |

## Feature F0.3 — CI/CD Basique

| ID | Task | Subtasks | Est. | P | Dep. | Assign. |
|----|------|----------|------|---|------|---------|
| T0.3.1 | GitHub Actions CI | Workflow PR: install, lint, typecheck, test | 4h | P0 | T0.1.6 | DevOps |
| T0.3.2 | GitHub Actions Docker build | Build images on main; cache layers | 4h | P1 | T0.2.5 | DevOps |
| T0.3.3 | Environment secrets doc | Documenter secrets requis GitHub | 2h | P1 | T0.3.1 | DevOps |

**Total Epic E0 : ~57h**

---

# EPIC E1 — Design System & Layouts

## Feature F1.1 — Design Tokens

| ID | Task | Subtasks | Est. | P | Dep. | Assign. |
|----|------|----------|------|---|------|---------|
| T1.1.1 | Migrer tokens Stitch → CSS vars | `tokens.css` complet; `@theme` Tailwind v4; Document mapping | 6h | P0 | T0.1.2 | FE |
| T1.1.2 | Configurer fonts Geist + Inter | `@nuxt/fonts` ou Google Fonts; font-face fallbacks | 2h | P0 | T1.1.1 | FE |
| T1.1.3 | Material Symbols setup | Import unique; composable `PzIcon`; FILL variant helper | 3h | P0 | T1.1.1 | FE |
| T1.1.4 | Utilities CSS custom | `soft-elevation`, `bento-card`, `glass-card`, scrollbar | 3h | P0 | T1.1.1 | FE |

## Feature F1.2 — Composants UI Primitifs

| ID | Task | Subtasks | Est. | P | Dep. | Assign. |
|----|------|----------|------|---|------|---------|
| T1.2.1 | `PzButton` | variants: primary/secondary/ghost/outline; sizes; loading; icon slot | 4h | P0 | T1.1.1 | FE |
| T1.2.2 | `PzInput` + `PzTextarea` | label, error, hint, icon prefix; focus ring secondary | 4h | P0 | T1.2.1 | FE |
| T1.2.3 | `PzCard` | variants default/bento/glass; hover animations | 3h | P0 | T1.2.1 | FE |
| T1.2.4 | `PzBadge` + `PzProgress` | status colors; animated progress | 3h | P1 | T1.2.1 | FE |
| T1.2.5 | `PzAvatar` + `PzModal` + `PzAlert` | Nuxt UI wrappers stylés | 4h | P1 | T1.2.1 | FE |
| T1.2.6 | `PzStepper` | horizontal steps; active/completed states | 4h | P0 | T1.2.1 | FE |
| T1.2.7 | `PzFileUpload` | hidden input; drag events; validation display | 6h | P0 | T1.2.2 | FE |
| T1.2.8 | `PzEmptyState` + `PzSkeleton` | loading/empty patterns | 3h | P2 | T1.2.1 | FE |

## Feature F1.3 — Layouts

| ID | Task | Subtasks | Est. | P | Dep. | Assign. |
|----|------|----------|------|---|------|---------|
| T1.3.1 | `AppHeader.vue` | 3 variants; responsive; sticky blur | 6h | P0 | T1.2.1 | FE |
| T1.3.2 | `AppSidebar.vue` | nav items; active state; bottom actions | 6h | P0 | T1.2.1 | FE |
| T1.3.3 | `AppFooter.vue` | 3 variants; social icons; dynamic year | 4h | P0 | T1.2.1 | FE |
| T1.3.4 | `AppMobileNav.vue` | bottom nav; FAB; md:hidden | 4h | P1 | T1.3.2 | FE |
| T1.3.5 | Layout `default.vue` | marketing shell | 2h | P0 | T1.3.1, T1.3.3 | FE |
| T1.3.6 | Layout `dashboard.vue` | sidebar + main + mobile nav | 3h | P0 | T1.3.2, T1.3.4 | FE |
| T1.3.7 | Layout `wizard.vue` | minimal header + wizard progress slot | 3h | P0 | T1.3.1 | FE |
| T1.3.8 | Layout `auth.vue` | transactional shell | 2h | P0 | T1.3.1, T1.3.3 | FE |
| T1.3.9 | `WizardProgress.vue` | 6 steps; scroll mobile; connector lines | 4h | P0 | T1.2.6 | FE |

## Feature F1.4 — i18n

| ID | Task | Subtasks | Est. | P | Dep. | Assign. |
|----|------|----------|------|---|------|---------|
| T1.4.1 | Setup `@nuxtjs/i18n` | fr default; en stub; config lazy loading | 3h | P0 | T0.1.2 | FE |
| T1.4.2 | Fichier `fr.json` landing | Hero, features, FAQ, CTA, footer — sans mentions IA | 4h | P0 | T1.4.1 | FE + Design |
| T1.4.3 | Fichier `fr.json` app | wizard, dashboard, auth, errors | 6h | P0 | T1.4.1 | FE |
| T1.4.4 | Remplacer textes hardcodés | Audit all components use `$t()` | 8h | P0 | T1.4.2, T1.4.3 | FE |

**Total Epic E1 : ~96h**

---

# EPIC E2 — Landing Page

## Feature F2.1 — Sections Landing

| ID | Task | Subtasks | Est. | P | Dep. | Assign. |
|----|------|----------|------|---|------|---------|
| T2.1.1 | `HeroSection.vue` | badge, h1, subtitle, 2 CTAs, routes | 6h | P0 | E1 | FE |
| T2.1.2 | `ResumePreviewMockup.vue` | decorative mockup; external img → local asset | 4h | P1 | T2.1.1 | FE |
| T2.1.3 | `FeaturesBento.vue` + `FeatureCard.vue` | 3 cards; hover; icons — textes FR sans IA | 6h | P0 | E1 | FE |
| T2.1.4 | `TemplatesShowcase.vue` | 4 previews; hover Use Template; routes | 6h | P0 | E1 | FE |
| T2.1.5 | `FaqSection.vue` | details/summary; 3+ questions FR | 4h | P1 | E1 | FE |
| T2.1.6 | `CtaSection.vue` | dark container; final CTA | 3h | P0 | E1 | FE |
| T2.1.7 | `pages/index.vue` | assemble sections; scroll reveal composable | 4h | P0 | T2.1.1–T2.1.6 | FE |
| T2.1.8 | Landing SEO meta | title, description, og tags | 2h | P1 | T2.1.7 | FE |

**Total Epic E2 : ~35h**

---

# EPIC E3 — Backend Foundation

## Feature F3.1 — Database Schema

| ID | Task | Subtasks | Est. | P | Dep. | Assign. |
|----|------|----------|------|---|------|---------|
| T3.1.1 | Prisma schema complet | All models per DB design doc | 8h | P0 | T0.2.2 | BE |
| T3.1.2 | Migrations initiales | dev migration; reset script | 2h | P0 | T3.1.1 | BE |
| T3.1.3 | Seed templates | 10 templates JSON; seed command | 4h | P0 | T3.1.1 | BE |
| T3.1.4 | Prisma client singleton | `lib/prisma.ts`; connection pooling | 2h | P0 | T3.1.1 | BE |

## Feature F3.2 — API Infrastructure

| ID | Task | Subtasks | Est. | P | Dep. | Assign. |
|----|------|----------|------|---|------|---------|
| T3.2.1 | Error handler middleware | RFC 7807 format; Zod error mapping | 4h | P0 | T0.1.5 | BE |
| T3.2.2 | CORS config | allow web origin; credentials | 2h | P0 | T0.1.3 | BE |
| T3.2.3 | Rate limiter | in-memory dev; configurable limits per route group | 6h | P1 | T3.2.1 | BE |
| T3.2.4 | Request logging | pino structured; requestId | 3h | P1 | T3.2.1 | BE |
| T3.2.5 | Health endpoints | `/health`, `/ready` | 2h | P0 | T3.1.4 | BE |

## Feature F3.3 — Guest Session

| ID | Task | Subtasks | Est. | P | Dep. | Assign. |
|----|------|----------|------|---|------|---------|
| T3.3.1 | Guest session module | service, repository, controller | 6h | P0 | T3.1.1 | BE |
| T3.3.2 | POST `/guest/session` | create/validate; TTL 7 days | 3h | P0 | T3.3.1 | BE |
| T3.3.3 | Guest middleware | validate `X-Guest-Session-Id` header | 3h | P0 | T3.3.1 | BE |
| T3.3.4 | Cleanup cron job | delete expired sessions | 3h | P1 | T3.3.1 | BE |

## Feature F3.4 — Auth Module

| ID | Task | Subtasks | Est. | P | Dep. | Assign. |
|----|------|----------|------|---|------|---------|
| T3.4.1 | Auth service | bcrypt hash; JWT sign/verify; refresh tokens | 8h | P0 | T3.1.1, T0.1.5 | BE |
| T3.4.2 | POST `/auth/register` | validation; create user; return tokens | 4h | P0 | T3.4.1 | BE |
| T3.4.3 | POST `/auth/login` | validate credentials; tokens | 3h | P0 | T3.4.1 | BE |
| T3.4.4 | POST `/auth/refresh` | rotate refresh token | 3h | P0 | T3.4.1 | BE |
| T3.4.5 | POST `/auth/logout` | invalidate refresh | 2h | P1 | T3.4.1 | BE |
| T3.4.6 | Auth middleware | JWT verify; attach user to request | 3h | P0 | T3.4.1 | BE |

**Total Epic E3 : ~67h**

---

# EPIC E4 — Frontend Foundation

## Feature F4.1 — API Client & Stores

| ID | Task | Subtasks | Est. | P | Dep. | Assign. |
|----|------|----------|------|---|------|---------|
| T4.1.1 | `useApiClient` composable | fetch wrapper; auth header; guest header; error handling | 6h | P0 | E3 | FE |
| T4.1.2 | `useGuestSession` composable | UUID gen; localStorage; API init | 4h | P0 | T3.3.2 | FE |
| T4.1.3 | `auth.store.ts` | login, logout, register, token refresh | 6h | P0 | T4.1.1, T3.4.x | FE |
| T4.1.4 | `auth.service.ts` | API calls auth endpoints | 3h | P0 | T4.1.1 | FE |
| T4.1.5 | `ui.store.ts` | toasts, modals, loading states | 4h | P1 | T0.1.2 | FE |

## Feature F4.2 — Auth Pages

| ID | Task | Subtasks | Est. | P | Dep. | Assign. |
|----|------|----------|------|---|------|---------|
| T4.2.1 | `SignupForm.vue` | email, password, confirm; toggle visibility; validation | 6h | P0 | F1, T4.1.3 | FE |
| T4.2.2 | `LoginForm.vue` | email, password; forgot link stub | 4h | P0 | F1, T4.1.3 | FE |
| T4.2.3 | `pages/inscription.vue` | auth layout; success state; loading | 4h | P0 | T4.2.1 | FE |
| T4.2.4 | `pages/connexion.vue` | auth layout; redirect dashboard | 3h | P0 | T4.2.2 | FE |
| T4.2.5 | Auth middleware Nuxt | protect dashboard routes | 3h | P0 | T4.1.3 | FE |

**Total Epic E4 : ~43h**

---

# EPIC E5 — Resume Domain

## Feature F5.1 — Backend Resume Module

| ID | Task | Subtasks | Est. | P | Dep. | Assign. |
|----|------|----------|------|---|------|---------|
| T5.1.1 | Resume repository | CRUD; nested relations; pagination | 8h | P0 | T3.1.1 | BE |
| T5.1.2 | Resume service | business rules; completeness calc; validation | 10h | P0 | T5.1.1, T0.1.5 | BE |
| T5.1.3 | GET/POST `/resumes` | list + create | 4h | P0 | T5.1.2 | BE |
| T5.1.4 | GET/PATCH/DELETE `/resumes/:id` | detail + update + archive | 6h | P0 | T5.1.2 | BE |
| T5.1.5 | Nested routes experiences | CRUD + reorder | 6h | P0 | T5.1.2 | BE |
| T5.1.6 | Nested routes educations | CRUD + reorder | 5h | P0 | T5.1.2 | BE |
| T5.1.7 | Nested routes skills | CRUD | 4h | P0 | T5.1.2 | BE |
| T5.1.8 | Nested routes certifications | CRUD | 4h | P0 | T5.1.2 | BE |
| T5.1.9 | Nested routes interests + languages | CRUD | 4h | P1 | T5.1.2 | BE |
| T5.1.10 | POST `/resumes/:id/duplicate` | clone full resume | 4h | P1 | T5.1.2 | BE |
| T5.1.11 | GET `/resumes/:id/completeness` | score + missing sections | 3h | P1 | T5.1.2 | BE |
| T5.1.12 | POST `/resumes/migrate` | guest snapshot → DB | 6h | P0 | T5.1.2, T3.3.1 | BE |
| T5.1.13 | POST `/resumes/:id/merge-import` | merge OCR data | 6h | P0 | T5.1.2 | BE |
| T5.1.14 | Unit tests resume service | completeness, validation, merge | 8h | P1 | T5.1.2 | BE |

## Feature F5.2 — Frontend Resume Store

| ID | Task | Subtasks | Est. | P | Dep. | Assign. |
|----|------|----------|------|---|------|---------|
| T5.2.1 | `resume.store.ts` | current draft, list, dirty state, actions | 8h | P0 | T0.1.4 | FE |
| T5.2.2 | Pinia persist plugin | localStorage key; serialize/deserialize | 3h | P0 | T5.2.1 | FE |
| T5.2.3 | `resume.service.ts` | all resume API calls | 6h | P0 | T4.1.1, T5.1.x | FE |
| T5.2.4 | `useResumeDraft` composable | auto-save debounce; load/save orchestration | 6h | P0 | T5.2.1 | FE |
| T5.2.5 | `useCompleteness` composable | mirror backend calc for UI | 4h | P1 | T5.2.1 | FE |
| T5.2.6 | `utils/completeness.ts` | shared logic with `@profiloz/shared` | 4h | P1 | T0.1.4 | FS |

**Total Epic E5 : ~113h**

---

# EPIC E6 — Wizard CV

## Feature F6.1 — Wizard Infrastructure

| ID | Task | Subtasks | Est. | P | Dep. | Assign. |
|----|------|----------|------|---|------|---------|
| T6.1.1 | `wizard.store.ts` | currentStep, completedSteps, validation | 4h | P0 | T5.2.1 | FE |
| T6.1.2 | `useWizardNavigation` | next/prev; step guards; route mapping | 6h | P0 | T6.1.1 | FE |
| T6.1.3 | Wizard middleware | prevent skip; redirect incomplete | 4h | P0 | T6.1.2 | FE |
| T6.1.4 | `WizardFooter.vue` | back/continue; disabled states | 3h | P0 | T1.2.1 | FE |
| T6.1.5 | `pages/creer/index.vue` | choix parcours 4 cartes | 6h | P1 | E1 | FE + Design |

## Feature F6.2 — Wizard Steps

| ID | Task | Subtasks | Est. | P | Dep. | Assign. |
|----|------|----------|------|---|------|---------|
| T6.2.1 | `PersonalInfoForm.vue` | 6 fields; help tooltips; validation | 6h | P0 | F1, T5.2.1 | FE |
| T6.2.2 | `pages/.../informations.vue` | step 1 page; ProTipBox | 4h | P0 | T6.2.1, T6.1.4 | FE |
| T6.2.3 | `EducationForm.vue` | dynamic list; add/remove; date pickers | 8h | P0 | F1, T5.2.1 | FE |
| T6.2.4 | `pages/.../formation.vue` | step 2 page | 3h | P0 | T6.2.3 | FE |
| T6.2.5 | `ExperienceForm.vue` | dynamic list; current job toggle; rich text optional | 10h | P0 | F1, T5.2.1 | FE |
| T6.2.6 | `pages/.../experience.vue` | step 3 page | 3h | P0 | T6.2.5 | FE |
| T6.2.7 | `SkillsForm.vue` | tag input; level selector | 6h | P0 | F1, T5.2.1 | FE |
| T6.2.8 | `pages/.../competences.vue` | step 4 page | 3h | P0 | T6.2.7 | FE |
| T6.2.9 | `CertificationsForm.vue` | dynamic list; dates | 6h | P1 | F1, T5.2.1 | FE |
| T6.2.10 | `pages/.../certifications.vue` | step 5 page | 3h | P1 | T6.2.9 | FE |
| T6.2.11 | `InterestsForm.vue` | tag input simple | 4h | P2 | F1, T5.2.1 | FE |
| T6.2.12 | `pages/.../interets.vue` | step 6 → navigate templates | 3h | P2 | T6.2.11 | FE |
| T6.2.13 | Exit confirmation modal | save/discard draft | 3h | P1 | T6.1.2 | FE |

**Total Epic E6 : ~75h**

---

# EPIC E7 — Templates & Preview

## Feature F7.1 — Template Backend

| ID | Task | Subtasks | Est. | P | Dep. | Assign. |
|----|------|----------|------|---|------|---------|
| T7.1.1 | Template module | service, repository | 4h | P0 | T3.1.3 | BE |
| T7.1.2 | GET `/templates` | list with filters | 3h | P0 | T7.1.1 | BE |
| T7.1.3 | GET `/templates/:slug` | detail + default config | 2h | P0 | T7.1.1 | BE |

## Feature F7.2 — Template Frontend Registry

| ID | Task | Subtasks | Est. | P | Dep. | Assign. |
|----|------|----------|------|---|------|---------|
| T7.2.1 | `registry.ts` + types | 10 template metadata; categories FR | 4h | P0 | T0.1.4 | FE |
| T7.2.2 | `template.store.ts` | selected template; config; API cache | 4h | P0 | T7.1.2 | FE |
| T7.2.3 | `useTemplateRegistry` composable | get component; apply config | 3h | P0 | T7.2.1 | FE |
| T7.2.4 | `TemplateCard.vue` | preview img; hover overlay; select btn | 4h | P0 | F1 | FE |
| T7.2.5 | `TemplateGrid.vue` + `TemplateFilters.vue` | grid 4 col; radio filters | 6h | P0 | T7.2.4 | FE |
| T7.2.6 | `pages/creer/modele.vue` | full page per mockup; strength widget | 6h | P0 | T7.2.5 | FE |

## Feature F7.3 — Template Components (10)

| ID | Task | Subtasks | Est. | P | Dep. | Assign. |
|----|------|----------|------|---|------|---------|
| T7.3.1 | `TemplateEtudiant.vue` | layout + sections; print mode | 8h | P0 | T7.2.1 | FE |
| T7.3.2 | `TemplateProfessionnel.vue` | idem | 8h | P0 | T7.2.1 | FE |
| T7.3.3 | `TemplateModerne.vue` | idem | 8h | P0 | T7.2.1 | FE |
| T7.3.4 | `TemplateDeveloppeur.vue` | idem | 8h | P0 | T7.2.1 | FE |
| T7.3.5 | `TemplateCommercial.vue` | idem | 6h | P0 | T7.2.1 | FE |
| T7.3.6 | `TemplateManager.vue` | idem | 6h | P0 | T7.2.1 | FE |
| T7.3.7 | `TemplateInternational.vue` | photo support | 8h | P0 | T7.2.1 | FE |
| T7.3.8 | `TemplateMinimaliste.vue` | idem | 6h | P0 | T7.2.1 | FE |
| T7.3.9 | `TemplateCreatif.vue` | idem | 8h | P1 | T7.2.1 | FE |
| T7.3.10 | `TemplatePremium.vue` | idem | 8h | P1 | T7.2.1 | FE |
| T7.3.11 | Template preview assets | 10 webp screenshots local | 4h | P1 | — | Design |

## Feature F7.4 — Editor & Preview

| ID | Task | Subtasks | Est. | P | Dep. | Assign. |
|----|------|----------|------|---|------|---------|
| T7.4.1 | `ResumePreviewA4.vue` | 210mm dimensions; scale responsive | 6h | P0 | T7.3.x | FE |
| T7.4.2 | `EditorSidebar.vue` | sections assembly | 4h | P0 | F1 | FE |
| T7.4.3 | `TemplatePicker.vue` | mini grid 2 col | 4h | P0 | T7.2.4 | FE |
| T7.4.4 | `AccentColorPicker.vue` | color circles; apply to preview | 4h | P1 | T7.4.1 | FE |
| T7.4.5 | `TypographyPicker.vue` | font combos | 4h | P2 | T7.4.1 | FE |
| T7.4.6 | `PageSettingsSliders.vue` | margins, line height | 4h | P2 | T7.4.1 | FE |
| T7.4.7 | `PreviewStatusBar.vue` | save indicator animation | 3h | P1 | T5.2.4 | FE |
| T7.4.8 | Zoom controls | scale preview client-side | 3h | P2 | T7.4.1 | FE |
| T7.4.9 | `pages/creer/editeur.vue` | full editor page per mockup | 8h | P0 | T7.4.1–T7.4.3 | FE |

**Total Epic E7 : ~149h**

---

# EPIC E8 — Import & OCR

## Feature F8.1 — Document Storage Backend

| ID | Task | Subtasks | Est. | P | Dep. | Assign. |
|----|------|----------|------|---|------|---------|
| T8.1.1 | Storage provider interface | port/adapter pattern | 4h | P0 | T0.1.4 | BE |
| T8.1.2 | LocalStorageProvider | file system; key generation | 4h | P0 | T8.1.1 | BE |
| T8.1.3 | S3StorageProvider stub | interface ready; not wired V1 | 3h | P2 | T8.1.1 | BE |
| T8.1.4 | Upload validation | MIME, size, extension; sanitize filename | 4h | P0 | T0.1.5 | BE |

## Feature F8.2 — Document Module

| ID | Task | Subtasks | Est. | P | Dep. | Assign. |
|----|------|----------|------|---|------|---------|
| T8.2.1 | Document repository + service | CRUD; link guest/user | 6h | P0 | T3.1.1, T8.1.2 | BE |
| T8.2.2 | POST `/documents/upload` | multipart; return metadata | 6h | P0 | T8.2.1, T8.1.4 | BE |
| T8.2.3 | GET `/documents` | list history auth | 3h | P1 | T8.2.1 | BE |
| T8.2.4 | DELETE `/documents/:id` | delete file + record | 3h | P1 | T8.2.1 | BE |

## Feature F8.3 — OCR Module

| ID | Task | Subtasks | Est. | P | Dep. | Assign. |
|----|------|----------|------|---|------|---------|
| T8.3.1 | OcrProvider interface | swappable architecture | 3h | P0 | T0.1.4 | BE |
| T8.3.2 | TesseractOcrProvider | install tesseract; image/pdf preprocess | 12h | P0 | T8.3.1 | BE |
| T8.3.3 | OcrParser service | heuristics → structured fields | 16h | P0 | T8.3.2 | BE |
| T8.3.4 | ExternalOcrProvider stub | empty impl for V2 | 2h | P3 | T8.3.1 | BE |
| T8.3.5 | POST `/documents/:id/process` | async process; status update | 4h | P0 | T8.3.3 | BE |
| T8.3.6 | GET `/documents/:id/ocr-result` | return parsed data | 3h | P0 | T8.3.3 | BE |
| T8.3.7 | Unit tests OCR parser | sample fixtures; field extraction | 8h | P1 | T8.3.3 | BE |

## Feature F8.4 — Import Frontend

| ID | Task | Subtasks | Est. | P | Dep. | Assign. |
|----|------|----------|------|---|------|---------|
| T8.4.1 | `document.service.ts` | upload, process, getOcr API calls | 4h | P0 | T4.1.1, T8.2.x | FE |
| T8.4.2 | `useFileUpload` composable | validation client; progress; error states | 6h | P0 | T1.2.7 | FE |
| T8.4.3 | `FileDropZone.vue` | glass card; drag events | 4h | P0 | T8.4.2 | FE |
| T8.4.4 | `ExtractionProgress.vue` | progress bar animation | 3h | P0 | F1 | FE |
| T8.4.5 | `ExtractedPreview.vue` | bento cards per section | 6h | P0 | F1 | FE |
| T8.4.6 | `ExtractedFieldCard.vue` | edit toggle ring | 4h | P0 | T8.4.5 | FE |
| T8.4.7 | `ImportTypeSelector.vue` | tabs CV/diplôme/attestation | 3h | P1 | F1 | FE |
| T8.4.8 | `pages/creer/importer/cv.vue` | full flow per mockup | 8h | P0 | T8.4.3–T8.4.6 | FE |
| T8.4.9 | `pages/creer/importer/diplome.vue` | adapt labels; education focus | 4h | P0 | T8.4.8 | FE |
| T8.4.10 | `pages/creer/importer/attestation.vue` | certification focus | 4h | P0 | T8.4.8 | FE |
| T8.4.11 | Merge confirm action | call merge-import; navigate templates | 4h | P0 | T5.1.13, T8.4.8 | FE |

**Total Epic E8 : ~130h**

---

# EPIC E9 — PDF Generation

## Feature F9.1 — PDF Backend

| ID | Task | Subtasks | Est. | P | Dep. | Assign. |
|----|------|----------|------|---|------|---------|
| T9.1.1 | Puppeteer pool manager | launch, reuse, timeout, cleanup | 10h | P0 | T0.2.3 | BE |
| T9.1.2 | HTML template renderer server | mirror client templates; SSR HTML | 12h | P0 | T7.3.x | BE |
| T9.1.3 | PdfService | generate from HTML; store file | 6h | P0 | T9.1.1, T8.1.2 | BE |
| T9.1.4 | POST `/pdf/generate` | auth/guest; create job | 4h | P0 | T9.1.3 | BE |
| T9.1.5 | POST `/pdf/generate-from-snapshot` | guest body snapshot | 4h | P0 | T9.1.3 | BE |
| T9.1.6 | GET `/pdf/jobs/:id` | poll status | 3h | P0 | T9.1.3 | BE |
| T9.1.7 | GET `/pdf/download/:token` | signed URL; TTL | 4h | P0 | T9.1.3 | BE |
| T9.1.8 | PDF cleanup cron | delete expired files | 3h | P1 | T9.1.3 | BE |
| T9.1.9 | Unit/integration tests PDF | sample generation; file valid | 6h | P1 | T9.1.3 | BE |

## Feature F9.2 — PDF Frontend

| ID | Task | Subtasks | Est. | P | Dep. | Assign. |
|----|------|----------|------|---|------|---------|
| T9.2.1 | `pdf.service.ts` | generate, poll, download | 4h | P0 | T4.1.1, T9.1.x | FE |
| T9.2.2 | Download PDF flow in editor | loading state; error retry; trigger download | 6h | P0 | T9.2.1, T7.4.9 | FE |
| T9.2.3 | `SuccessCelebration.vue` | confetti composable | 4h | P0 | F1 | FE |
| T9.2.4 | `AccountPromptCard.vue` | benefits; create account / guest | 4h | P0 | F1 | FE |
| T9.2.5 | `PdfDownloadChip.vue` | re-download chip | 2h | P1 | F1 | FE |
| T9.2.6 | `pages/creer/succes.vue` | full success page per mockup | 4h | P0 | T9.2.3–T9.2.5 | FE |
| T9.2.7 | Post-signup migration trigger | call migrate on register | 4h | P0 | T5.1.12, T4.2.3 | FE |

**Total Epic E9 : ~72h**

---

# EPIC E10 — Dashboard

## Feature F10.1 — Dashboard Backend (minimal)

| ID | Task | Subtasks | Est. | P | Dep. | Assign. |
|----|------|----------|------|---|------|---------|
| T10.1.1 | Resume list optimization | indexes; select fields; pagination | 4h | P1 | T5.1.3 | BE |
| T10.1.2 | User profile endpoints | GET/PATCH `/users/me` | 4h | P1 | T3.4.x | BE |

## Feature F10.2 — Dashboard Frontend

| ID | Task | Subtasks | Est. | P | Dep. | Assign. |
|----|------|----------|------|---|------|---------|
| T10.2.1 | `ResumeCard.vue` | preview, status badge, hover overlay | 6h | P0 | F1 | FE |
| T10.2.2 | `ResumeActionOverlay.vue` | edit, copy, download buttons | 4h | P0 | T10.2.1 | FE |
| T10.2.3 | `ResumeGrid.vue` | grid + ghost create card | 4h | P0 | T10.2.1 | FE |
| T10.2.4 | `ProfileStrengthBanner.vue` | progress bar; tip text | 4h | P1 | T5.2.5 | FE |
| T10.2.5 | `OptimizationCard.vue` | rename sans IA; CTA stub | 3h | P2 | F1 | FE |
| T10.2.6 | `DocumentList.vue` | table/cards history | 6h | P1 | T8.2.3 | FE |
| T10.2.7 | `pages/tableau-de-bord/index.vue` | dashboard per mockup | 6h | P0 | T10.2.3 | FE |
| T10.2.8 | `pages/tableau-de-bord/documents.vue` | documents history page | 4h | P1 | T10.2.6 | FE |
| T10.2.9 | `pages/tableau-de-bord/modeles.vue` | reuse template grid | 3h | P2 | T7.2.6 | FE |
| T10.2.10 | Duplicate resume action | API call + toast + refresh | 3h | P1 | T5.1.10 | FE |
| T10.2.11 | Delete/archive resume action | confirm modal | 3h | P1 | T5.1.4 | FE |

**Total Epic E10 : ~50h**

---

# EPIC E11 — Cover Letters

## Feature F11.1 — Cover Letter Backend

| ID | Task | Subtasks | Est. | P | Dep. | Assign. |
|----|------|----------|------|---|------|---------|
| T11.1.1 | Cover letter module | CRUD service + repository | 6h | P1 | T3.1.1 | BE |
| T11.1.2 | REST endpoints | GET/POST/PATCH/DELETE | 4h | P1 | T11.1.1 | BE |
| T11.1.3 | POST `/cover-letters/:id/pdf` | reuse PDF service | 4h | P1 | T9.1.3, T11.1.1 | BE |

## Feature F11.2 — Cover Letter Frontend

| ID | Task | Subtasks | Est. | P | Dep. | Assign. |
|----|------|----------|------|---|------|---------|
| T11.2.1 | `LetterForm.vue` | company, position, recruiter, content | 6h | P1 | F1 | FE |
| T11.2.2 | `LetterPreview.vue` | letterhead live preview | 6h | P1 | F1 | FE |
| T11.2.3 | Static template suggestions | 3 letter templates FR | 4h | P2 | — | Design |
| T11.2.4 | `pages/tableau-de-bord/lettres/index.vue` | full page per mockup; no AI generate | 8h | P1 | T11.2.1, T11.2.2 | FE |
| T11.2.5 | Copy to clipboard action | VueUse clipboard | 2h | P2 | T11.2.4 | FE |
| T11.2.6 | Download letter PDF | integrate pdf service | 3h | P1 | T11.1.3 | FE |

**Total Epic E11 : ~43h**

---

# EPIC E12 — QA, Security & Launch

## Feature F12.1 — Testing

| ID | Task | Subtasks | Est. | P | Dep. | Assign. |
|----|------|----------|------|---|------|---------|
| T12.1.1 | Vitest setup monorepo | config shared; sample tests | 4h | P1 | E0 | FS |
| T12.1.2 | Frontend unit tests | stores, composables, utils | 12h | P1 | E4–E7 | FE |
| T12.1.3 | Backend unit tests | services critical paths | 12h | P1 | E3, E5, E8 | BE |
| T12.1.4 | Playwright setup | config; fixtures; CI integration | 6h | P0 | E0 | FS |
| T12.1.5 | E2E parcours guest wizard → PDF | full flow test | 8h | P0 | E6, E7, E9 | FS |
| T12.1.6 | E2E parcours import CV → PDF | OCR mock or fixture | 6h | P0 | E8, E9 | FS |
| T12.1.7 | E2E auth + dashboard | login, list, edit | 6h | P1 | E4, E10 | FS |

## Feature F12.2 — Security Hardening

| ID | Task | Subtasks | Est. | P | Dep. | Assign. |
|----|------|----------|------|---|------|---------|
| T12.2.1 | Input sanitization audit | XSS vectors in preview content | 4h | P0 | E7 | FS |
| T12.2.2 | Upload security audit | MIME sniffing; path traversal | 4h | P0 | E8 | BE |
| T12.2.3 | Auth security review | JWT expiry; refresh rotation | 4h | P0 | E3 | BE |
| T12.2.4 | Rate limit production config | tune limits | 2h | P1 | T3.2.3 | BE |
| T12.2.5 | HTTPS + secure headers | production nginx config | 3h | P0 | E13 | DevOps |

## Feature F12.3 — Performance & A11y

| ID | Task | Subtasks | Est. | P | Dep. | Assign. |
|----|------|----------|------|---|------|---------|
| T12.3.1 | Lighthouse audit landing | perf > 80; fix issues | 6h | P1 | E2 | FE |
| T12.3.2 | Accessibility audit | labels, focus, contrast, keyboard | 8h | P1 | ALL FE | FE |
| T12.3.3 | Mobile responsive QA | all pages breakpoints | 8h | P0 | ALL FE | FE + Design |
| T12.3.4 | PDF generation load test | 10 concurrent; memory profile | 4h | P1 | E9 | BE |

## Feature F12.4 — Documentation & Launch

| ID | Task | Subtasks | Est. | P | Dep. | Assign. |
|----|------|----------|------|---|------|---------|
| T12.4.1 | OpenAPI spec generation | zod-to-openapi; publish docs/openapi.yaml | 6h | P1 | E3–E9 | BE |
| T12.4.2 | README projet | setup dev; commands; architecture link | 4h | P0 | E0 | FS |
| T12.4.3 | Content audit FR | no EN strings; no IA mentions | 4h | P0 | E1 | FE + Design |
| T12.4.4 | Production smoke test | checklist post-deploy | 4h | P0 | E13 | DevOps |

**Total Epic E12 : ~115h**

---

# EPIC E13 — Deployment (voir 10-deployment.md)

## Feature F13.1 — Production Infrastructure

| ID | Task | Subtasks | Est. | P | Dep. | Assign. |
|----|------|----------|------|---|------|---------|
| T13.1.1 | Production docker-compose | prod overrides; secrets; volumes | 6h | P0 | T0.2.5 | DevOps |
| T13.1.2 | Nginx reverse proxy | SSL termination; route web + api | 6h | P0 | T13.1.1 | DevOps |
| T13.1.3 | GitHub Actions deploy workflow | build, push, deploy staging/prod | 8h | P0 | T0.3.2 | DevOps |
| T13.1.4 | Database backup strategy | pg_dump cron; restore doc | 4h | P1 | T13.1.1 | DevOps |
| T13.1.5 | Environment management | staging + prod env vars doc | 3h | P0 | T13.1.1 | DevOps |
| T13.1.6 | Monitoring alerts | health check uptime; error rate | 4h | P1 | T13.1.1 | DevOps |

**Total Epic E13 : ~31h**

---

## Récapitulatif par Epic

| Epic | Nom | Estimation |
|------|-----|------------|
| E0 | Setup | 57h |
| E1 | Design System | 96h |
| E2 | Landing | 35h |
| E3 | Backend Foundation | 67h |
| E4 | Frontend Foundation | 43h |
| E5 | Resume Domain | 113h |
| E6 | Wizard | 75h |
| E7 | Templates & Preview | 149h |
| E8 | Import & OCR | 130h |
| E9 | PDF | 72h |
| E10 | Dashboard | 50h |
| E11 | Cover Letters | 43h |
| E12 | QA & Launch | 115h |
| E13 | Deployment | 31h |
| **TOTAL** | | **~1076h** |

**Capacité équipe 2 devs :** ~35h/semaine/dev → ~70h/semaine → **~15 semaines**

---

## Chemin critique

```
E0 → E1 → E2 (landing)
E0 → E3 → E5 → E6 → E7 → E9 (core product)
E3 → E8 → E9 (import path)
E3 → E4 → E10 (auth dashboard)
E7 + E9 → E12 (QA)
E13 parallèle dès S10
```

---

## Priorisation Sprint suggérée

| Sprint | Semaine | Epics |
|--------|---------|-------|
| S1 | 1 | E0 |
| S2 | 2 | E1 (partial), E3 (partial) |
| S3 | 3 | E1, E3, E4 |
| S4 | 4 | E2, E5 |
| S5 | 5 | E6 |
| S6 | 6 | E7 (templates 1-5) |
| S7 | 7 | E7 (templates 6-10, editor) |
| S8 | 8 | E8 (upload, OCR) |
| S9 | 9 | E8 (import UI), E9 |
| S10 | 10 | E9, E10 |
| S11 | 11 | E10, E11 |
| S12 | 12 | E11, E12 |
| S13 | 13 | E12, E13 |
| S14 | 14 | Buffer + polish |
| S15 | 15 | Launch |

---

## Definition of Done (rappel)

Chaque task est DONE quand :
- Code mergé sur main
- Types strict OK
- i18n FR si UI
- Responsive vérifié
- Pas de régression lint
- Tests associés si P0 backend logic
