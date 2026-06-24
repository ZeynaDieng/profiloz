# 03 — Conception Base de Données Profilo'Z

> **Statut :** Document d'architecture — à valider avant implémentation  
> **ORM :** Prisma | **SGBD :** PostgreSQL 16

---

## 1. Modèle conceptuel (ERD)

```
┌──────────┐       ┌──────────────┐       ┌─────────────┐
│   User   │──1:N──│    Resume    │──1:N──│ResumeVersion│
└──────────┘       └──────┬───────┘       └─────────────┘
     │                    │
     │                    │ N:1
     │              ┌─────▼─────┐
     │              │ Template  │
     │              └───────────┘
     │
     │──1:N──┌──────────────┐
     │       │  Document    │
     │       └──────┬───────┘
     │              │ 1:1 (optional)
     │       ┌──────▼───────┐
     │       │  OcrResult   │
     │       └──────────────┘
     │
     │──1:N──┌──────────────┐
             │ CoverLetter  │
             └──────────────┘

┌──────────────┐
│ GuestSession │  (temporaire, TTL)
└──────────────┘
```

---

## 2. Schéma Prisma

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Enums ───────────────────────────────────────────────

enum UserRole {
  USER
  ADMIN
}

enum DocumentType {
  CV
  DIPLOMA
  CERTIFICATE
}

enum DocumentStatus {
  UPLOADED
  PROCESSING
  PARSED
  FAILED
}

enum ResumeStatus {
  DRAFT
  ACTIVE
  ARCHIVED
}

enum TemplateSlug {
  ETUDIANT
  PROFESSIONNEL
  MODERNE
  DEVELOPPEUR
  COMMERCIAL
  MANAGER
  INTERNATIONAL
  MINIMALISTE
  CREATIF
  PREMIUM
}

enum SkillLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
  EXPERT
}

enum LanguageLevel {
  BASIC
  CONVERSATIONAL
  PROFESSIONAL
  NATIVE
}

// ─── User & Auth ───────────────────────────────────────

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  firstName     String?
  lastName      String?
  avatarUrl     String?
  role          UserRole  @default(USER)
  locale        String    @default("fr-FR")
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastLoginAt   DateTime?

  resumes       Resume[]
  documents     Document[]
  coverLetters  CoverLetter[]
  refreshTokens RefreshToken[]

  @@map("users")
}

model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([userId])
  @@map("refresh_tokens")
}

// ─── Guest Session (pre-auth) ──────────────────────────

model GuestSession {
  id        String   @id @default(cuid())
  sessionId String   @unique // UUID from client header
  data      Json?    // Snapshot resume draft for server-side PDF
  expiresAt DateTime
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  documents Document[]
  pdfJobs   PdfJob[]

  @@index([sessionId])
  @@index([expiresAt])
  @@map("guest_sessions")
}

// ─── Resume Aggregate ──────────────────────────────────

model Resume {
  id              String       @id @default(cuid())
  userId          String?
  user            User?        @relation(fields: [userId], references: [id], onDelete: Cascade)
  guestSessionId  String?

  title           String       @default("Mon CV")
  status          ResumeStatus @default(DRAFT)
  templateSlug    TemplateSlug @default(PROFESSIONNEL)
  templateConfig  Json         @default("{}") // accent color, margins, typography

  // Personal Info (embedded for query simplicity V1)
  fullName        String?
  email           String?
  phone           String?
  location        String?
  jobTitle        String?
  linkedinUrl     String?
  websiteUrl      String?
  summary         String?      @db.Text
  photoUrl        String?

  completeness    Int          @default(0) // 0-100

  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  publishedAt     DateTime?

  experiences     Experience[]
  educations      Education[]
  skills          Skill[]
  certifications  Certification[]
  interests       Interest[]
  languages       Language[]
  versions        ResumeVersion[]
  coverLetters    CoverLetter[]

  @@index([userId])
  @@index([status])
  @@map("resumes")
}

model Experience {
  id          String    @id @default(cuid())
  resumeId    String
  resume      Resume    @relation(fields: [resumeId], references: [id], onDelete: Cascade)
  company     String
  position    String
  location    String?
  startDate   DateTime?
  endDate     DateTime?
  isCurrent   Boolean   @default(false)
  description String?   @db.Text
  sortOrder   Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([resumeId])
  @@map("experiences")
}

model Education {
  id          String    @id @default(cuid())
  resumeId    String
  resume      Resume    @relation(fields: [resumeId], references: [id], onDelete: Cascade)
  institution String
  degree      String
  field       String?
  location    String?
  startDate   DateTime?
  endDate     DateTime?
  description String?   @db.Text
  sortOrder   Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([resumeId])
  @@map("educations")
}

model Skill {
  id        String     @id @default(cuid())
  resumeId  String
  resume    Resume     @relation(fields: [resumeId], references: [id], onDelete: Cascade)
  name      String
  level     SkillLevel @default(INTERMEDIATE)
  category  String?
  sortOrder Int        @default(0)

  @@index([resumeId])
  @@map("skills")
}

model Certification {
  id           String    @id @default(cuid())
  resumeId     String
  resume       Resume    @relation(fields: [resumeId], references: [id], onDelete: Cascade)
  name         String
  issuer       String?
  issueDate    DateTime?
  expiryDate   DateTime?
  credentialId String?
  sortOrder    Int       @default(0)

  @@index([resumeId])
  @@map("certifications")
}

model Interest {
  id        String @id @default(cuid())
  resumeId  String
  resume    Resume @relation(fields: [resumeId], references: [id], onDelete: Cascade)
  name      String
  sortOrder Int    @default(0)

  @@index([resumeId])
  @@map("interests")
}

model Language {
  id        String        @id @default(cuid())
  resumeId  String
  resume    Resume        @relation(fields: [resumeId], references: [id], onDelete: Cascade)
  name      String
  level     LanguageLevel @default(CONVERSATIONAL)
  sortOrder Int           @default(0)

  @@index([resumeId])
  @@map("languages")
}

// ─── Versioning ────────────────────────────────────────

model ResumeVersion {
  id        String   @id @default(cuid())
  resumeId  String
  resume    Resume   @relation(fields: [resumeId], references: [id], onDelete: Cascade)
  snapshot  Json     // Full resume JSON at point in time
  label     String?
  createdAt DateTime @default(now())

  @@index([resumeId])
  @@map("resume_versions")
}

// ─── Documents & OCR ───────────────────────────────────

model Document {
  id             String         @id @default(cuid())
  userId         String?
  user           User?          @relation(fields: [userId], references: [id], onDelete: SetNull)
  guestSessionId String?
  guestSession   GuestSession?  @relation(fields: [guestSessionId], references: [id], onDelete: SetNull)

  type           DocumentType
  status         DocumentStatus @default(UPLOADED)
  originalName   String
  mimeType       String
  sizeBytes      Int
  storageKey     String         @unique
  checksum       String?

  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  ocrResult      OcrResult?

  @@index([userId])
  @@index([guestSessionId])
  @@index([type])
  @@map("documents")
}

model OcrResult {
  id           String   @id @default(cuid())
  documentId   String   @unique
  document     Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  rawText      String   @db.Text
  parsedData   Json     // Structured extraction
  confidence   Float?
  provider     String   @default("tesseract")
  processedAt  DateTime @default(now())

  @@map("ocr_results")
}

// ─── PDF Jobs ──────────────────────────────────────────

model PdfJob {
  id             String        @id @default(cuid())
  guestSessionId String?
  guestSession   GuestSession? @relation(fields: [guestSessionId], references: [id], onDelete: SetNull)
  resumeId       String?
  storageKey     String?
  status         String        @default("pending") // pending, processing, completed, failed
  errorMessage   String?
  createdAt      DateTime      @default(now())
  completedAt    DateTime?
  expiresAt      DateTime?

  @@index([status])
  @@map("pdf_jobs")
}

// ─── Cover Letters ─────────────────────────────────────

model CoverLetter {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  resumeId     String?
  resume       Resume?  @relation(fields: [resumeId], references: [id], onDelete: SetNull)

  title        String   @default("Lettre de motivation")
  companyName  String?
  position     String?
  recruiterName String?
  content      String   @db.Text
  templateId   String   @default("classic")

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([userId])
  @@map("cover_letters")
}

// ─── Templates (seed data) ─────────────────────────────

model Template {
  id          String       @id @default(cuid())
  slug        TemplateSlug @unique
  name        String
  category    String
  description String?
  previewUrl  String
  isActive    Boolean      @default(true)
  sortOrder   Int          @default(0)
  config      Json         @default("{}")

  @@map("templates")
}
```

---

## 3. Indexes et performance

| Table | Index | Raison |
|-------|-------|--------|
| `users.email` | UNIQUE | Login |
| `resumes.userId` | B-tree | Dashboard listing |
| `documents.guestSessionId` | B-tree | Guest uploads |
| `guest_sessions.expiresAt` | B-tree | Cleanup cron |
| `pdf_jobs.status` | B-tree | Queue processing |

---

## 4. Contraintes métier (DB + application)

| Règle | Implémentation |
|-------|----------------|
| Email unique | `@unique` |
| Guest session TTL 7 jours | Cron delete + `expiresAt` |
| PDF guest TTL 24h | `pdf_jobs.expiresAt` |
| Max 50 experiences/resume | Validation service |
| Max 10MB upload | Validation avant insert |
| Cascade delete resume → children | `onDelete: Cascade` |

---

## 5. Seed data — Templates V1

```typescript
const TEMPLATE_SEED = [
  { slug: 'ETUDIANT',       name: 'Étudiant',       category: 'Entry-level',  sortOrder: 1 },
  { slug: 'PROFESSIONNEL',  name: 'Professionnel',  category: 'Corporate',    sortOrder: 2 },
  { slug: 'MODERNE',        name: 'Moderne',        category: 'Creative',     sortOrder: 3 },
  { slug: 'DEVELOPPEUR',    name: 'Développeur',    category: 'Technical',    sortOrder: 4 },
  { slug: 'COMMERCIAL',     name: 'Commercial',     category: 'Sales',        sortOrder: 5 },
  { slug: 'MANAGER',        name: 'Manager',        category: 'Executive',    sortOrder: 6 },
  { slug: 'INTERNATIONAL',  name: 'International',  category: 'Global',       sortOrder: 7 },
  { slug: 'MINIMALISTE',    name: 'Minimaliste',    category: 'Clean',        sortOrder: 8 },
  { slug: 'CREATIF',        name: 'Créatif',        category: 'Artistic',       sortOrder: 9 },
  { slug: 'PREMIUM',        name: 'Premium',        category: 'Exclusive',    sortOrder: 10 },
];
```

---

## 6. Modèle JSON — Resume Snapshot (localStorage + versions)

Structure partagée FE/BE via `@profiloz/shared` :

```typescript
interface ResumeSnapshot {
  id: string;
  title: string;
  templateSlug: TemplateSlug;
  templateConfig: TemplateConfig;
  personalInfo: PersonalInfo;
  summary?: string;
  experiences: Experience[];
  educations: Education[];
  skills: Skill[];
  certifications: Certification[];
  interests: Interest[];
  languages: Language[];
  metadata: {
    completeness: number;
    lastModified: string;
    source: 'wizard' | 'import' | 'manual';
  };
}
```

---

## 7. Migration localStorage → PostgreSQL

**Trigger :** Inscription ou connexion après génération CV guest.

```
1. Client envoie POST /api/v1/resumes/migrate
   Body: { guestSessionId, resumeSnapshot }
2. Service crée User (si signup) + Resume + relations
3. Service lie Documents guest → userId
4. Client purge localStorage key `profiloz:resume:draft`
```

---

## 8. Jobs planifiés

| Job | Fréquence | Action |
|-----|-----------|--------|
| `cleanup-guest-sessions` | Daily | DELETE expired guest_sessions |
| `cleanup-pdf-files` | Hourly | DELETE pdf storage + records expired |
| `cleanup-failed-ocr` | Daily | Archive documents FAILED > 7 days |

---

## 9. Estimation volumétrie V1

| Entité | Volume Y1 (estimé) |
|--------|-------------------|
| Users | 10 000 |
| Resumes | 25 000 |
| Documents | 15 000 |
| PDF jobs/month | 8 000 |

**Taille DB estimée Y1 :** < 2 GB (hors fichiers)

---

## 10. Évolutions V2

- Table `Subscription` / `Plan`
- Table `ResumeShare` (lien public)
- Table `AuditLog`
- Full-text search sur `ocr_results.rawText` (PostgreSQL tsvector)
- Partition `pdf_jobs` par date
