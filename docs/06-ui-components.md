# 06 — Composants UI Profilo'Z

> **Statut :** Document d'architecture — à valider avant implémentation  
> **Base :** Maquettes Stitch + Nuxt UI extensions

---

## 1. Stratégie composants

```
Nuxt UI (primitives)
       ↓
components/ui/ (design system Profilo'Z)
       ↓
features/*/ (composants métier)
       ↓
pages/ (assemblage minimal)
```

**Principe :** Les maquettes Stitch ne sont pas refaites. Chaque section HTML devient un composant Vue isolé reprenant classes Tailwind et structure.

---

## 2. Design System — Tokens sémantiques

### 2.1 Couleurs (usage)

| Token | Usage UI |
|-------|----------|
| `background` | Fond page |
| `surface-container-lowest` | Cards, modals |
| `secondary` | CTA secondaires, liens actifs |
| `primary` | CTA principaux (noir) |
| `secondary-container` | Nav active, badges |
| `tertiary-fixed-dim` | Success, progress |
| `on-surface-variant` | Texte secondaire |
| `outline-variant` | Bordures |

### 2.2 Typographie

| Classe | Font | Taille | Usage |
|--------|------|--------|-------|
| `text-display-lg` | Geist 700 | 48/56 | Hero H1 desktop |
| `text-display-lg-mobile` | Geist 700 | 32/40 | Hero H1 mobile |
| `text-headline-md` | Geist 600 | 24/32 | H2 sections |
| `text-body-lg` | Inter 400 | 18/28 | Sous-titres |
| `text-body-md` | Inter 400 | 16/24 | Corps |
| `text-label-sm` | Geist 500 | 13/18 | Boutons, nav |
| `text-label-xs` | Geist 600 | 11/16 | Badges, captions |

### 2.3 Espacements

| Token | Valeur | Usage |
|-------|--------|-------|
| `gutter` | 24px | Grid gap |
| `stack-sm` | 8px | Inline gaps |
| `stack-md` | 16px | Section padding |
| `stack-lg` | 32px | Section spacing |
| `margin-mobile` | 16px | Container px mobile |
| `margin-desktop` | 40px | Container px desktop |
| `container-max` | 1280px | Max width |

### 2.4 Effets

| Classe | CSS |
|--------|-----|
| `soft-elevation` | `box-shadow: 0 12px 32px rgba(15,23,42,0.08)` |
| `bento-card` | hover translateY + shadow |
| `glass-card` | backdrop-blur + rgba white |

---

## 3. Composants UI primitifs (`components/ui/`)

| Composant | Props | Basé sur | Maquette source |
|-----------|-------|----------|-----------------|
| `PzButton` | `variant`, `size`, `icon`, `loading` | Nuxt UButton | Tous boutons |
| `PzInput` | `label`, `hint`, `error`, `icon` | Nuxt UInput | Wizard, auth |
| `PzTextarea` | idem | Nuxt UTextarea | Cover letter |
| `PzCard` | `variant: default\|bento\|glass` | Custom | Bento grid |
| `PzBadge` | `color`, `size` | Nuxt UBadge | Status CV |
| `PzProgress` | `value`, `max`, `label` | Custom | Strength bars |
| `PzAvatar` | `src`, `alt`, `size` | Nuxt UAvatar | Topbar |
| `PzIcon` | `name` | Material Symbols | Tous |
| `PzRadioGroup` | `options`, `modelValue` | Nuxt URadioGroup | Template filters |
| `PzModal` | `open`, `title` | Nuxt UModal | Confirmations |
| `PzAlert` | `type`, `title` | Nuxt UAlert | Errors |
| `PzSkeleton` | `type` | Nuxt USkeleton | Loading |
| `PzFileUpload` | `accept`, `maxSize` | Custom | Import |
| `PzStepper` | `steps`, `current` | Custom | Wizard |
| `PzEmptyState` | `icon`, `title`, `action` | Custom | Dashboard empty |
| `PzTooltip` | `content` | Nuxt UTooltip | Help icons |

---

## 4. Composants Layout (`components/layout/`)

### 4.1 `AppHeader.vue`

**Variants :** `marketing` | `dashboard` | `minimal`

| Variant | Éléments |
|---------|----------|
| marketing | Logo, nav links, Sign In, CTA |
| dashboard | Search, notifications, avatar |
| minimal | Logo + exit link |

**Source :** Landing header + Import header + Wizard header

### 4.2 `AppSidebar.vue`

- Logo + subtitle « Premium Builder »
- Nav items avec état actif (`secondary-container`)
- Bottom : New Resume CTA, Support, Logout
- Width: 256px fixed

**Source :** Dashboard + Template selection sidebars (unifier)

### 4.3 `AppFooter.vue`

**Variants :** `full` | `minimal` | `transactional`

| Variant | Colonnes |
|---------|----------|
| full | 4 cols Product/Resources/Support/Social |
| minimal | Copyright only (success page) |
| transactional | Legal + SSL badge |

### 4.4 `AppMobileNav.vue`

- 5 items + FAB center « add »
- Visible `< md` breakpoint
- **Source :** Template selection mobile nav

### 4.5 `WizardProgress.vue`

- 6 steps horizontal scroll mobile
- Active = `secondary` ring
- **Source :** Resume wizard nav

---

## 5. Composants Feature — Landing

| Composant | Lignes estimées | Description |
|-----------|-----------------|-------------|
| `HeroSection` | ~120 | Badge trust, H1, CTAs, preview mockup |
| `ResumePreviewMockup` | ~80 | Fake resume UI (decorative) |
| `FeaturesBento` | ~100 | 3 cards hover animation |
| `FeatureCard` | ~40 | Icon + title + description |
| `TemplatesShowcase` | ~120 | 4 template previews landing |
| `TemplatePreviewCard` | ~50 | Hover « Use Template » |
| `FaqSection` | ~80 | `<details>` accordion |
| `CtaSection` | ~40 | Dark container final CTA |

**Changements V1 vs maquette :**
- Retirer « AI-Powered Extraction » → « Import intelligent »
- Retirer « AI Optimization » du dashboard
- Franciser tous textes via i18n

---

## 6. Composants Feature — Wizard

| Composant | Step | Champs |
|-----------|------|--------|
| `PersonalInfoForm` | 1 | fullName, email, phone, jobTitle, location, linkedin |
| `EducationForm` | 2 | Liste éducations (dynamic rows) |
| `ExperienceForm` | 3 | Liste expériences |
| `SkillsForm` | 4 | Tags + niveaux |
| `CertificationsForm` | 5 | Liste certifications |
| `InterestsForm` | 6 | Tags intérêts |
| `WizardFooter` | — | Back / Continue buttons |
| `ProTipBox` | — | Tip animé step 1 |

**Pattern list forms :**
```vue
<EducationForm
  v-model="educations"
  @add="addEducation"
  @remove="removeEducation"
  @reorder="reorderEducations"
/>
```

---

## 7. Composants Feature — Import

| Composant | Description |
|-----------|-------------|
| `FileDropZone` | Drag & drop + click, glass-card style |
| `UploadStepper` | 3 steps : Upload / Details / Layout |
| `ExtractionProgress` | Progress bar teal animation |
| `ExtractedPreview` | Bento cards Personal/Experience/Education |
| `ExtractedFieldCard` | Section éditable avec Edit/Save toggle |
| `ImportTypeSelector` | Tabs CV / Diplôme / Attestation |

**Différences par type import :**

| Type | Label FR | Champs extraits prioritaires |
|------|----------|------------------------------|
| CV | Curriculum Vitae | Tout |
| DIPLOMA | Diplôme | Education, institution, date |
| CERTIFICATE | Attestation | Certification, issuer, date |

---

## 8. Composants Feature — Templates

| Composant | Description |
|-----------|-------------|
| `TemplateGrid` | Grid responsive 1/2/4 cols |
| `TemplateCard` | Preview + category badge + Select btn |
| `TemplateFilters` | Radio filters sidebar |
| `TemplatePreviewOverlay` | Hover instant preview |
| `ResumeStrengthWidget` | Sidebar 75% widget |

**Data-driven :** Plus de `document.write`. Array `templates[]` → `v-for`.

---

## 9. Composants Feature — Editor

| Composant | Description |
|-----------|-------------|
| `EditorSidebar` | Template, color, typography, page settings |
| `TemplatePicker` | 2-col grid mini previews |
| `AccentColorPicker` | Color circles |
| `TypographyPicker` | Font combo selector |
| `PageSettingsSliders` | Margins, line height |
| `ResumePreviewA4` | A4 210mm live preview |
| `PreviewStatusBar` | « LIVE PREVIEW: CHANGES SAVED » |
| `ZoomControls` | Fixed bottom-right |

---

## 10. Composants Feature — Dashboard

| Composant | Description |
|-----------|-------------|
| `ResumeGrid` | Cards grid + ghost « Create New » |
| `ResumeCard` | Preview img + status badge + actions overlay |
| `ResumeActionOverlay` | Edit / Copy / Download on hover |
| `ProfileStrengthBanner` | 85% progress + tip |
| `OptimizationCard` | « Analyse de conformité » (sans IA) |
| `DocumentList` | Historique imports |

**Status badges :**

| Status | Couleur | Label FR |
|--------|---------|----------|
| ACTIVE | tertiary-fixed | Actif |
| DRAFT | surface-variant | Brouillon |
| ARCHIVED | outline-variant | Archivé |

---

## 11. Composants Feature — Cover Letter

| Composant | Description |
|-----------|-------------|
| `LetterForm` | Company, position, recruiter, points |
| `LetterPreview` | A4 letterhead live |
| `LetterToolbar` | Copy, Download PDF |

**V1 :** Pas de bouton « Generate Draft » IA. Remplissage manuel + templates texte.

---

## 12. Composants Feature — Auth

| Composant | Description |
|-----------|-------------|
| `SignupForm` | Email (readonly si post-CV), password, confirm |
| `LoginForm` | Email, password, forgot link |
| `PasswordToggle` | visibility icon |
| `AuthSuccessState` | Check + redirect message |

---

## 13. Composants Feature — Success

| Composant | Description |
|-----------|-------------|
| `SuccessCelebration` | Confetti animation (CSS) |
| `AccountPromptCard` | Benefits list + Create Account / Guest |
| `PdfDownloadChip` | PDF filename + download icon |

---

## 14. Composants Template CV (10)

Chaque template = 1 composant Vue :

```
TemplateEtudiant.vue
TemplateProfessionnel.vue
TemplateModerne.vue
TemplateDeveloppeur.vue
TemplateCommercial.vue
TemplateManager.vue
TemplateInternational.vue
TemplateMinimaliste.vue
TemplateCreatif.vue
TemplatePremium.vue
```

**Props communes :**

```typescript
interface TemplateProps {
  resume: ResumeSnapshot;
  config: TemplateConfig;
  mode: 'preview' | 'print';
}
```

**Sections configurables :**
- Header (name, title, contact)
- Summary
- Experience
- Education
- Skills
- Certifications
- Languages
- Interests
- Photo (optional)

---

## 15. Animations & Micro-interactions

| Animation | Source maquette | Implémentation |
|-----------|-----------------|----------------|
| Bento hover lift | Landing features | CSS transition |
| Template scale hover | Template grid | `group-hover:scale-110` |
| Confetti | Success page | JS createConfetti → composable |
| Scroll reveal | Landing script | IntersectionObserver composable |
| Progress bar fill | Import OCR | CSS transition width |
| Save indicator | Editor | Keydown debounce → status dot |
| FAQ chevron rotate | Landing | `group-open:rotate-180` |

---

## 16. Responsive breakpoints

| Breakpoint | Comportement |
|------------|--------------|
| `< sm` | Stack CTAs, hide desktop nav |
| `< md` | Hide sidebar, show mobile nav |
| `< lg` | Wizard 1 col, editor sidebar collapse |
| `≥ xl` | Template grid 4 cols |

---

## 17. Icons

**Library :** Material Symbols Outlined via Google Fonts

```css
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}
```

**Filled variant :** Nav active items `FILL 1`

---

## 18. Checklist conformité maquettes

- [ ] Tokens couleurs identiques
- [ ] Geist + Inter fonts
- [ ] Border radius 3xl cards
- [ ] Soft elevation shadows
- [ ] Glass card import page
- [ ] A4 preview dimensions
- [ ] Sidebar 256px
- [ ] Mobile bottom nav
- [ ] Confetti success
- [ ] Progress steppers

---

## 19. Composants à ne PAS créer V1

| Composant | Raison |
|-----------|--------|
| `AnalyticsDashboard` | Hors scope |
| `PricingTable` | Landing link only |
| `AiWritingAssistant` | IA retirée V1 |
| `ChatSupport` | Hors scope |
