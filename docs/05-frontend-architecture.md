# 05 — Architecture Frontend Profilo'Z

> **Statut :** Document d'architecture — à valider avant implémentation  
> **Stack :** Nuxt 4 · Vue 3 · TypeScript · Tailwind v4 · Pinia · VueUse · Nuxt UI

---

## 1. Configuration Nuxt

```typescript
// nuxt.config.ts (extrait)
export default defineNuxtConfig({
  future: { compatibilityVersion: 4 },
  modules: ['@nuxt/ui', '@pinia/nuxt', '@vueuse/nuxt', '@nuxtjs/i18n'],
  typescript: { strict: true, typeCheck: true },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api/v1',
    },
  },
  pinia: { storesDirs: ['./stores/**'] },
  i18n: {
    defaultLocale: 'fr',
    locales: [{ code: 'fr', file: 'fr.json' }, { code: 'en', file: 'en.json' }],
  },
});
```

---

## 2. Arborescence `apps/web`

```
apps/web/
├── app.vue
├── nuxt.config.ts
├── assets/
│   └── css/
│       ├── main.css              # Tailwind v4 @import
│       └── tokens.css            # Design tokens Stitch → CSS vars
├── layouts/
│   ├── default.vue               # Marketing (landing)
│   ├── dashboard.vue             # Sidebar + topbar
│   ├── wizard.vue                # Wizard + footer nav fixe
│   └── auth.vue                  # Transactional (signup/login)
├── pages/
│   ├── index.vue                 # Landing
│   ├── connexion.vue
│   ├── inscription.vue
│   ├── tableau-de-bord/
│   │   ├── index.vue             # My resumes
│   │   ├── modeles.vue
│   │   ├── documents.vue
│   │   └── lettres/
│   │       └── index.vue
│   ├── creer/
│   │   ├── index.vue             # Choix parcours
│   │   ├── assistant/
│   │   │   ├── informations.vue  # Step 1
│   │   │   ├── formation.vue     # Step 2
│   │   │   ├── experience.vue    # Step 3
│   │   │   ├── competences.vue   # Step 4
│   │   │   ├── certifications.vue
│   │   │   └── interets.vue
│   │   ├── importer/
│   │   │   ├── cv.vue
│   │   │   ├── diplome.vue
│   │   │   └── attestation.vue
│   │   ├── modele.vue
│   │   ├── editeur.vue
│   │   └── succes.vue
│   └── ...
├── components/
│   ├── ui/                       # Wrappers Nuxt UI + tokens
│   ├── layout/
│   │   ├── AppHeader.vue
│   │   ├── AppSidebar.vue
│   │   ├── AppFooter.vue
│   │   ├── AppMobileNav.vue
│   │   └── WizardProgress.vue
│   └── resume/
│       ├── ResumePreviewA4.vue
│       └── ResumeCard.vue
├── features/
│   ├── landing/
│   │   ├── HeroSection.vue
│   │   ├── FeaturesBento.vue
│   │   ├── TemplatesShowcase.vue
│   │   ├── FaqSection.vue
│   │   └── CtaSection.vue
│   ├── wizard/
│   │   ├── PersonalInfoForm.vue
│   │   ├── EducationForm.vue
│   │   ├── ExperienceForm.vue
│   │   ├── SkillsForm.vue
│   │   ├── CertificationsForm.vue
│   │   └── InterestsForm.vue
│   ├── import/
│   │   ├── FileDropZone.vue
│   │   ├── ExtractionProgress.vue
│   │   └── ExtractedPreview.vue
│   ├── templates/
│   │   ├── TemplateGrid.vue
│   │   ├── TemplateCard.vue
│   │   └── TemplateFilters.vue
│   ├── editor/
│   │   ├── EditorSidebar.vue
│   │   ├── TemplatePicker.vue
│   │   ├── ColorPicker.vue
│   │   └── TypographyPicker.vue
│   ├── dashboard/
│   │   ├── ResumeGrid.vue
│   │   ├── ProfileStrength.vue
│   │   └── DocumentList.vue
│   ├── cover-letter/
│   │   ├── LetterForm.vue
│   │   └── LetterPreview.vue
│   └── auth/
│       ├── SignupForm.vue
│       └── LoginForm.vue
├── composables/
│   ├── useGuestSession.ts
│   ├── useResumeDraft.ts
│   ├── useFileUpload.ts
│   ├── useWizardNavigation.ts
│   ├── useTemplateRegistry.ts
│   ├── useCompleteness.ts
│   └── useApiClient.ts
├── stores/
│   ├── resume.store.ts
│   ├── wizard.store.ts
│   ├── template.store.ts
│   ├── auth.store.ts
│   └── ui.store.ts
├── services/
│   ├── api.client.ts
│   ├── resume.service.ts
│   ├── document.service.ts
│   ├── template.service.ts
│   ├── pdf.service.ts
│   └── auth.service.ts
├── types/
│   ├── resume.types.ts
│   ├── template.types.ts
│   └── api.types.ts
└── utils/
    ├── completeness.ts
    ├── date.ts
    ├── storage.ts
    └── sanitize.ts
```

---

## 3. Design Tokens (Stitch → Tailwind v4)

Fichier `assets/css/tokens.css` :

```css
@theme {
  --color-background: #f8f9ff;
  --color-on-background: #0b1c30;
  --color-on-surface: #0b1c30;
  --color-on-surface-variant: #45464d;
  --color-primary: #000000;
  --color-on-primary: #ffffff;
  --color-secondary: #0051d5;
  --color-secondary-container: #316bf3;
  --color-on-secondary-container: #fefcff;
  --color-tertiary-fixed-dim: #4fdbc8;
  --color-surface-container-low: #eff4ff;
  --color-surface-container-lowest: #ffffff;
  --color-outline-variant: #c6c6cd;
  /* ... autres tokens maquettes ... */

  --spacing-gutter: 24px;
  --spacing-margin-desktop: 40px;
  --spacing-margin-mobile: 16px;

  --font-headline: 'Geist', sans-serif;
  --font-body: 'Inter', sans-serif;
}
```

**Règle :** Ne pas dupliquer la config Tailwind inline des maquettes HTML. Une seule source tokens.

---

## 4. Layouts

### 4.1 `default` — Marketing

- Header fixe (landing)
- Pas de sidebar
- Footer complet 4 colonnes
- Usage : `/`, pages publiques

### 4.2 `dashboard` — App authentifiée

- Sidebar fixe 256px (desktop)
- TopAppBar sticky
- Mobile bottom nav
- Footer réduit
- Usage : `/tableau-de-bord/*`

### 4.3 `wizard` — Parcours création

- Header minimal (logo + exit)
- Progress tracker horizontal
- Footer fixe (back / continue)
- Pas de sidebar
- Usage : `/creer/assistant/*`, `/creer/importer/*`

### 4.4 `auth` — Transactionnel

- Header centré logo only
- Footer légal
- Usage : `/inscription`, `/connexion`

---

## 5. State Management (Pinia)

### 5.1 `resume.store.ts`

```typescript
interface ResumeState {
  current: ResumeSnapshot | null;
  list: ResumeListItem[];
  isDirty: boolean;
  lastSavedAt: Date | null;
}

// Actions
// - loadFromStorage()
// - saveToStorage()
// - syncToApi()
// - updateSection()
// - setTemplate()
// - calculateCompleteness()
```

**Persistence :** `pinia-plugin-persistedstate` → `localStorage` key `profiloz:resume:draft`

### 5.2 `wizard.store.ts`

```typescript
interface WizardState {
  currentStep: 1 | 2 | 3 | 4 | 5 | 6;
  completedSteps: number[];
  validationErrors: Record<string, string[]>;
}
```

### 5.3 `auth.store.ts`

```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}
```

Tokens en httpOnly cookie (preferred) ou memory + refresh.

### 5.4 `template.store.ts`

Cache templates API + selected template.

---

## 6. Services Layer

### 6.1 `api.client.ts`

```typescript
export function useApiClient() {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();
  const { guestSessionId } = useGuestSession();

  async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(authStore.accessToken && { Authorization: `Bearer ${authStore.accessToken}` }),
      ...(guestSessionId && { 'X-Guest-Session-Id': guestSessionId }),
    };
    // fetch + error handling
  }

  return { get, post, patch, delete: del, upload };
}
```

### 6.2 Règles

- Services = appels HTTP uniquement
- Pas de logique métier (→ utils ou composables domain)
- Typage strict request/response

---

## 7. Composables clés

### 7.1 `useGuestSession`

- Génère UUID au premier visit
- Stocke en localStorage
- Sync header sur chaque requête API

### 7.2 `useResumeDraft`

- Orchestration resume store + auto-save debounced
- Merge import OCR

### 7.3 `useWizardNavigation`

- Guard steps (validation before next)
- Routes nommées par étape

### 7.4 `useCompleteness`

- Calcul score (miroir backend)
- Sections manquantes pour UI hints

---

## 8. Routing & Navigation Guards

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore();
  if (!auth.isAuthenticated) {
    return navigateTo('/connexion');
  }
});

// middleware/wizard-guard.ts
// Empêche skip steps sans validation
```

| Route | Middleware | Layout |
|-------|------------|--------|
| `/` | — | default |
| `/creer/assistant/*` | wizard-guard | wizard |
| `/tableau-de-bord/*` | auth | dashboard |
| `/inscription` | — | auth |

---

## 9. Template Engine Frontend

```
features/templates/
├── registry.ts           # 10 templates metadata
├── components/
│   ├── TemplateEtudiant.vue
│   ├── TemplateProfessionnel.vue
│   └── ... (10 composants)
└── composables/
    └── useTemplateRenderer.ts
```

```typescript
// registry.ts
export const TEMPLATE_REGISTRY: Record<TemplateSlug, Component> = {
  ETUDIANT: defineAsyncComponent(() => import('./components/TemplateEtudiant.vue')),
  // ...
};
```

**Preview live :** `<component :is="templateComponent" :resume="resume" :config="config" />`

---

## 10. i18n — Francisation

Fichier `locales/fr.json` — extraits :

```json
{
  "landing.hero.title": "Créez un CV professionnel en quelques minutes",
  "landing.hero.subtitle": "Construisez votre CV manuellement ou importez vos documents existants.",
  "features.extraction.title": "Import intelligent",
  "features.extraction.description": "Importez votre PDF ou DOCX. Nous extrayons vos informations et les organisez automatiquement.",
  "cta.create": "Créer mon CV",
  "cta.import": "Importer un CV existant"
}
```

**Règle V1 :** Supprimer toute mention « IA » des clés i18n.

---

## 11. Règles composants

| Règle | Limite |
|-------|--------|
| Max lignes par composant | 300 |
| Logique métier | Interdite dans `.vue` → composable/store |
| API calls | Interdits dans `.vue` → service |
| Props | Typées strictement |
| Emits | Typés |

---

## 12. Performance

| Technique | Application |
|-----------|-------------|
| Lazy routes | Pages wizard |
| Async components | Templates preview |
| Debounced auto-save | 500ms |
| Virtual scroll | Liste templates (si > 20) |
| Image optimization | `@nuxt/image` pour previews |

---

## 13. Accessibilité

- Labels sur tous inputs
- Focus visible (tokens secondary)
- `aria-expanded` sur FAQ `<details>`
- Contraste WCAG AA minimum
- Navigation clavier wizard

---

## 14. Tests frontend

| Type | Outil | Cible |
|------|-------|-------|
| Unit | Vitest | utils, stores, composables |
| Component | Vue Test Utils | forms, preview |
| E2E | Playwright | parcours complet guest → PDF |

---

## 15. Mapping maquettes → pages Nuxt

| Maquette Stitch | Page Nuxt |
|-----------------|-----------|
| Landing Page | `pages/index.vue` |
| Select Template | `pages/creer/modele.vue` |
| Success | `pages/creer/succes.vue` |
| Import Resume | `pages/creer/importer/cv.vue` |
| Resume Wizard step 1 | `pages/creer/assistant/informations.vue` |
| Join Profilo'Z | `pages/inscription.vue` |
| Dashboard | `pages/tableau-de-bord/index.vue` |
| Cover Letter Generator | `pages/tableau-de-bord/lettres/index.vue` |
| Resume Editor & Preview | `pages/creer/editeur.vue` |

---

## 16. Dépendances npm (web)

```json
{
  "dependencies": {
    "nuxt": "^4.0.0",
    "@nuxt/ui": "^3.0.0",
    "@pinia/nuxt": "^0.5.0",
    "pinia-plugin-persistedstate": "^4.0.0",
    "@vueuse/nuxt": "^11.0.0",
    "@profiloz/shared": "workspace:*",
    "@profiloz/validators": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vitest": "^2.0.0",
    "@playwright/test": "^1.45.0"
  }
}
```
