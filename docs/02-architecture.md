# 02 — Architecture Système Profilo'Z

> **Statut :** Document d'architecture — à valider avant implémentation  
> **Version :** 1.0

---

## 1. Vue d'ensemble

Profilo'Z adopte une **architecture modulaire en monorepo** avec séparation frontend (Nuxt 4) et backend (Next.js 15), unifiée par des packages partagés et une base PostgreSQL.

```
┌─────────────────────────────────────────────────────────────────┐
│                         UTILISATEUR                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
              ┌──────────────▼──────────────┐
              │     Reverse Proxy (Nginx)    │
              │  profiloz.fr / api.profiloz  │
              └──────┬───────────────┬───────┘
                     │               │
         ┌───────────▼───┐   ┌───────▼──────────┐
         │  apps/web     │   │   apps/api       │
         │  Nuxt 4       │   │   Next.js 15     │
         │  Vue 3 + TS   │   │   App Router     │
         │  Pinia        │   │   Prisma ORM     │
         └───────┬───────┘   └───────┬──────────┘
                 │                   │
                 │    REST / JSON    │
                 └─────────┬─────────┘
                           │
         ┌─────────────────▼─────────────────┐
         │         PostgreSQL 16              │
         └─────────────────┬─────────────────┘
                           │
         ┌─────────────────▼─────────────────┐
         │  Stockage fichiers (local → S3)    │
         └───────────────────────────────────┘

Packages partagés :
  @profiloz/shared      — types, Zod, constants
  @profiloz/validators  — schémas validation
  @profiloz/template-engine — définitions templates (optionnel V1)
```

---

## 2. Principes architecturaux

| Principe | Application |
|----------|-------------|
| **Clean Architecture** | Domaine indépendant des frameworks |
| **DDD léger** | Agrégats : Resume, Document, User, Template |
| **SOLID** | Services injectables, interfaces OCR/PDF/Storage |
| **Repository Pattern** | Abstraction accès données |
| **Feature-Based** | Organisation par feature côté FE et modules côté BE |
| **Ports & Adapters** | OCR, PDF, Storage interchangeables |

---

## 3. Structure monorepo

```
profiloz/
├── apps/
│   ├── web/                    # Nuxt 4 — Frontend
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── components/
│   │   ├── features/
│   │   ├── composables/
│   │   ├── stores/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   │
│   └── api/                    # Next.js 15 — Backend
│       └── src/
│           ├── modules/
│           │   ├── auth/
│           │   ├── resume/
│           │   ├── template/
│           │   ├── document/
│           │   ├── pdf/
│           │   ├── ocr/
│           │   └── user/
│           ├── lib/
│           ├── middleware/
│           └── app/api/        # Route Handlers
│
├── packages/
│   ├── shared/                 # Types + constants
│   ├── validators/             # Zod schemas
│   └── eslint-config/
│
├── prisma/
│   └── schema.prisma
│
├── docker/
│   ├── Dockerfile.web
│   ├── Dockerfile.api
│   └── docker-compose.yml
│
├── .github/workflows/
├── docs/
└── turbo.json
```

---

## 4. Couches backend (Clean Architecture)

```
┌──────────────────────────────────────────────┐
│  Presentation (Route Handlers / Controllers)  │  ← HTTP, DTO mapping
├──────────────────────────────────────────────┤
│  Application (Services)                       │  ← Use cases, orchestration
├──────────────────────────────────────────────┤
│  Domain (Entities, Value Objects, Events)     │  ← Règles métier pures
├──────────────────────────────────────────────┤
│  Infrastructure (Repositories, OCR, PDF, S3)  │  ← Implémentations
└──────────────────────────────────────────────┘
```

### 4.1 Module backend — structure type

```
modules/resume/
├── resume.controller.ts      # Route handler entry
├── resume.service.ts         # Use cases
├── resume.repository.ts      # Prisma queries
├── resume.dto.ts             # Request/Response types
├── resume.types.ts           # Domain types
├── resume.validators.ts      # Zod (réexport @profiloz/validators)
└── resume.mapper.ts          # Entity ↔ DTO
```

**Règle :** Aucune logique métier dans les controllers. Aucun accès Prisma direct depuis les controllers.

---

## 5. Couches frontend

```
┌──────────────────────────────────────────────┐
│  Pages (routing, layout assignment)           │
├──────────────────────────────────────────────┤
│  Features (smart components, orchestration)   │
├──────────────────────────────────────────────┤
│  Components (UI dumb, < 300 lignes)           │
├──────────────────────────────────────────────┤
│  Stores (Pinia — état UI + cache)             │
├──────────────────────────────────────────────┤
│  Services (API calls, pas de logique métier)  │
├──────────────────────────────────────────────┤
│  Composables (logique réutilisable UI)        │
└──────────────────────────────────────────────┘
```

**Règle :** Les composants UI ne font pas de `fetch` direct. Ils appellent services ou stores.

---

## 6. Flux de données

### 6.1 Parcours sans compte (MVP)

```
[Landing] → [Wizard/Import] → [localStorage via Pinia persist]
     → [Template] → [Preview] → [PDF API] → [Success]
                                        ↓
                              [Signup optionnel] → [Migration API]
```

### 6.2 Parcours avec compte

```
[Auth] → [Dashboard] → [CRUD Resume] → [Editor] → [PDF]
                    → [Documents history]
```

### 6.3 Import OCR

```
[Upload file] → [POST /documents/upload]
     → [OCR Service (Tesseract)] → [Parse → ResumeDraft]
     → [Correction UI] → [Merge into Resume aggregate]
```

---

## 7. Modules métier

### 7.1 Resume (agrégat central)

**Responsabilités :**
- CRUD resume
- Versioning
- Calcul complétude
- Merge données importées

**Entités :**
- `Resume`
- `PersonalInfo`
- `Experience[]`
- `Education[]`
- `Skill[]`
- `Certification[]`
- `Interest[]`

### 7.2 Document

**Responsabilités :**
- Upload sécurisé
- Métadonnées fichier
- Lien vers session/user
- Historique imports

**Types :** `CV`, `DIPLOMA`, `CERTIFICATE`

### 7.3 Template

**Responsabilités :**
- Registry 10 modèles V1
- Configuration (couleur, typo, sections visibles)
- Rendu HTML pour PDF

### 7.4 PDF

**Responsabilités :**
- HTML → PDF via Puppeteer
- Templates server-side mirror client preview

### 7.5 OCR

**Responsabilités :**
- Extraction texte
- Parsing heuristique → champs structurés
- Interface swappable

### 7.6 Auth / User

**Responsabilités :**
- Inscription post-génération
- JWT + refresh
- Migration localStorage → cloud

---

## 8. Template Engine

### 8.1 Registry extensible

```typescript
interface ResumeTemplate {
  id: string;
  slug: TemplateSlug;
  name: string;
  category: TemplateCategory;
  previewImage: string;
  supportedSections: SectionType[];
  defaultStyles: TemplateStyles;
  component: string; // Vue component name
}
```

### 8.2 Modèles V1

| Slug | Nom FR | Catégorie |
|------|--------|-----------|
| `etudiant` | Étudiant | Entry-level |
| `professionnel` | Professionnel | Corporate |
| `moderne` | Moderne | Creative |
| `developpeur` | Développeur | Technical |
| `commercial` | Commercial | Sales |
| `manager` | Manager | Executive |
| `international` | International | Global |
| `minimaliste` | Minimaliste | Clean |
| `creatif` | Créatif | Artistic |
| `premium` | Premium | Exclusive |

**Extension :** Ajouter entrée registry + composant Vue + CSS scoped.

---

## 9. Stockage

### 9.1 MVP — Local

| Donnée | Emplacement |
|--------|-------------|
| Brouillon CV (guest) | `localStorage` (Pinia persist) |
| Fichiers uploadés | `./storage/uploads/` (volume Docker) |
| PDF générés | `./storage/pdf/` (TTL 24h guest) |

### 9.2 Production-ready — S3 compatible

```typescript
interface StorageProvider {
  upload(file: Buffer, key: string, mime: string): Promise<string>;
  getSignedUrl(key: string, expiresIn: number): Promise<string>;
  delete(key: string): Promise<void>;
}
```

Implémentations : `LocalStorageProvider`, `S3StorageProvider`.

---

## 10. Sécurité (architecture)

| Couche | Mesure |
|--------|--------|
| Upload | MIME validation, size limit, extension whitelist |
| API | Rate limiting (upstash/redis ou in-memory dev) |
| Auth | JWT httpOnly, CSRF token sur mutations |
| Input | Zod validation serveur obligatoire |
| Output | Sanitization HTML (DOMPurify côté rendu) |
| OCR/PDF | Sandbox Puppeteer, timeout, file quarantine |
| Headers | Helmet equivalents Next.js |

---

## 11. Communication inter-services

### 11.1 API REST

- Base URL : `/api/v1`
- Format : JSON
- Auth : `Authorization: Bearer <token>` ou `X-Guest-Session-Id`

### 11.2 Guest Session

Header `X-Guest-Session-Id` (UUID généré côté client) pour :
- Upload documents
- Génération PDF
- Migration à l'inscription

---

## 12. Observabilité

| Outil | Usage |
|-------|-------|
| Structured logging (pino) | API requests, OCR, PDF |
| Health checks | `/api/health`, `/api/ready` |
| Error tracking | Sentry (phase 2) |

---

## 13. Environnements

| Env | Frontend | Backend | DB |
|-----|----------|---------|-----|
| local | localhost:3000 | localhost:3001 | PostgreSQL Docker |
| staging | staging.profiloz.fr | api-staging | RDS/managed |
| prod | profiloz.fr | api.profiloz.fr | RDS/managed |

---

## 14. Décisions techniques (ADR summary)

| ADR | Décision | Justification |
|-----|----------|---------------|
| ADR-001 | Monorepo Turborepo | Partage types, CI unifiée |
| ADR-002 | Zod partagé | Single source of validation |
| ADR-003 | Pinia + persist | MVP guest sans backend |
| ADR-004 | Prisma | Productivité, migrations |
| ADR-005 | Puppeteer pool | PDF fidèle au preview |
| ADR-006 | Tesseract adapter | Swappable OCR |
| ADR-007 | Nuxt layouts × 3 | Cohérence shells maquettes |

---

## 15. Risques architecture

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Puppeteer en Docker | Haute | Moyen | Image optimisée, pool limité |
| OCR qualité faible | Haute | Moyen | UX correction, provider externe V2 |
| Split Nuxt/Next complexity | Moyenne | Moyen | Packages shared, docs strictes |
| localStorage limits (~5MB) | Faible | Moyen | Compression, sync early signup |
| Preview/PDF divergence | Moyenne | Haut | Même template HTML SSR |

---

## 16. Validation requise

Avant implémentation, valider :

- [ ] Structure monorepo
- [ ] Séparation modules backend
- [ ] Stratégie guest session + migration
- [ ] Template engine approach
- [ ] Stockage local → S3 path
- [ ] ADRs listés

**Référence :** Voir `03-database-design.md`, `04-api-design.md`, `05-frontend-architecture.md`.
