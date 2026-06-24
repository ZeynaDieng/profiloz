# 04 — Conception API Profilo'Z

> **Statut :** Document d'architecture — à valider avant implémentation  
> **Base URL :** `/api/v1` | **Format :** JSON

---

## 1. Conventions

| Aspect | Convention |
|--------|------------|
| Versioning | URL prefix `/api/v1` |
| Auth | `Authorization: Bearer <jwt>` |
| Guest | Header `X-Guest-Session-Id: <uuid>` |
| Errors | RFC 7807 Problem Details |
| Pagination | `?page=1&limit=20` |
| Sort | `?sort=-updatedAt` |
| IDs | CUID strings |

### 1.1 Format erreur

```json
{
  "type": "https://profiloz.fr/errors/validation",
  "title": "Validation Error",
  "status": 422,
  "detail": "Le champ email est invalide",
  "errors": [
    { "field": "email", "message": "Format email invalide" }
  ]
}
```

### 1.2 Codes HTTP

| Code | Usage |
|------|-------|
| 200 | Succès GET/PATCH |
| 201 | Création |
| 204 | Suppression |
| 400 | Requête malformée |
| 401 | Non authentifié |
| 403 | Interdit |
| 404 | Ressource absente |
| 422 | Validation échouée |
| 429 | Rate limit |
| 500 | Erreur serveur |

---

## 2. Authentification

### POST `/auth/register`

Création compte post-génération CV.

**Body :**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "guestSessionId": "uuid-optional",
  "resumeSnapshot": { }
}
```

**Response 201 :**
```json
{
  "user": { "id": "...", "email": "..." },
  "accessToken": "...",
  "refreshToken": "...",
  "migratedResumeId": "..."
}
```

### POST `/auth/login`

**Body :** `{ "email", "password" }`

**Response 200 :** `{ user, accessToken, refreshToken }`

### POST `/auth/refresh`

**Body :** `{ "refreshToken" }`

### POST `/auth/logout`

**Headers :** Authorization required

### POST `/auth/forgot-password` (V1.1)

**Body :** `{ "email" }`

---

## 3. Guest Session

### POST `/guest/session`

Initialise ou valide une session invité.

**Response 201 :**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "expiresAt": "2025-06-30T00:00:00Z"
}
```

---

## 4. Resumes

### GET `/resumes`

Liste CV utilisateur connecté.

**Query :** `status`, `page`, `limit`, `sort`

**Response 200 :**
```json
{
  "data": [
    {
      "id": "...",
      "title": "Senior Product Designer",
      "status": "ACTIVE",
      "templateSlug": "MODERNE",
      "completeness": 85,
      "updatedAt": "..."
    }
  ],
  "meta": { "total": 3, "page": 1, "limit": 20 }
}
```

### POST `/resumes`

Crée un CV (auth ou guest snapshot sync).

**Body :**
```json
{
  "title": "Mon CV",
  "templateSlug": "PROFESSIONNEL",
  "personalInfo": { "fullName": "...", "email": "..." }
}
```

### GET `/resumes/:id`

Retourne CV complet avec relations.

### PATCH `/resumes/:id`

Mise à jour partielle (personalInfo, summary, templateConfig, title, status).

### DELETE `/resumes/:id`

Soft delete → status ARCHIVED (ou hard delete selon politique).

### POST `/resumes/:id/duplicate`

Duplique un CV existant.

### GET `/resumes/:id/completeness`

**Response :** `{ "score": 85, "missingSections": ["summary"] }`

### POST `/resumes/migrate`

Migration guest → user (voir DB design).

---

## 5. Sous-ressources Resume

Pattern REST nested :

| Méthode | Endpoint | Action |
|---------|----------|--------|
| GET | `/resumes/:id/experiences` | Liste |
| POST | `/resumes/:id/experiences` | Ajouter |
| PATCH | `/resumes/:id/experiences/:expId` | Modifier |
| DELETE | `/resumes/:id/experiences/:expId` | Supprimer |
| PUT | `/resumes/:id/experiences/reorder` | `{ "orderedIds": [] }` |

Même pattern pour :
- `/educations`
- `/skills`
- `/certifications`
- `/interests`
- `/languages`

### POST `/resumes/:id/merge-import`

Fusionne données OCR parsées dans le CV.

**Body :**
```json
{
  "ocrResultId": "...",
  "mergeStrategy": "replace" | "append" | "merge"
}
```

---

## 6. Documents

### POST `/documents/upload`

Upload multipart.

**Form fields :**
- `file` (required)
- `type` : `CV` | `DIPLOMA` | `CERTIFICATE`

**Headers :** Auth OR `X-Guest-Session-Id`

**Validations :**
- Max 10 MB
- MIME : `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `image/jpeg`, `image/png`

**Response 201 :**
```json
{
  "id": "...",
  "type": "CV",
  "status": "UPLOADED",
  "originalName": "mon-cv.pdf",
  "sizeBytes": 245000
}
```

### GET `/documents`

Historique documents (auth required).

### GET `/documents/:id`

Métadonnées document.

### DELETE `/documents/:id`

Suppression document + fichier storage.

### POST `/documents/:id/process`

Lance OCR + parsing.

**Response 202 :**
```json
{
  "id": "...",
  "status": "PROCESSING"
}
```

### GET `/documents/:id/ocr-result`

**Response 200 :**
```json
{
  "rawText": "...",
  "parsedData": {
    "personalInfo": { },
    "experiences": [],
    "educations": [],
    "skills": []
  },
  "confidence": 0.72,
  "provider": "tesseract"
}
```

---

## 7. Templates

### GET `/templates`

Liste modèles actifs.

**Query :** `category`

**Response 200 :**
```json
{
  "data": [
    {
      "slug": "PROFESSIONNEL",
      "name": "Professionnel",
      "category": "Corporate",
      "previewUrl": "/templates/previews/professionnel.webp",
      "supportedSections": ["summary", "experience", "education", "skills"]
    }
  ]
}
```

### GET `/templates/:slug`

Détail + config par défaut.

---

## 8. PDF

### POST `/pdf/generate`

Génère PDF à partir d'un CV.

**Body :**
```json
{
  "resumeId": "...",
  "templateSlug": "PROFESSIONNEL",
  "templateConfig": { "accentColor": "#0051d5" }
}
```

**Auth :** JWT ou Guest session

**Response 202 :**
```json
{
  "jobId": "...",
  "status": "processing"
}
```

### POST `/pdf/generate-from-snapshot`

Pour guests sans resumeId en DB.

**Body :** `{ "snapshot": ResumeSnapshot, "templateSlug": "..." }`

### GET `/pdf/jobs/:jobId`

**Response :**
```json
{
  "id": "...",
  "status": "completed",
  "downloadUrl": "/api/v1/pdf/download/...",
  "expiresAt": "..."
}
```

### GET `/pdf/download/:token`

Téléchargement fichier (signed token, TTL).

---

## 9. Cover Letters

### GET `/cover-letters`

### POST `/cover-letters`

**Body :**
```json
{
  "resumeId": "...",
  "companyName": "Acme Corp",
  "position": "Designer UX Senior",
  "recruiterName": "Marie Dupont",
  "content": "...",
  "templateId": "classic"
}
```

### PATCH `/cover-letters/:id`

### DELETE `/cover-letters/:id`

### POST `/cover-letters/:id/pdf`

Génère PDF lettre.

---

## 10. User

### GET `/users/me`

Profil utilisateur.

### PATCH `/users/me`

Mise à jour profil (firstName, lastName, locale, avatarUrl).

### DELETE `/users/me`

Suppression compte (RGPD).

---

## 11. Health

### GET `/health`

```json
{ "status": "ok", "timestamp": "..." }
```

### GET `/ready`

Vérifie DB + storage connectivity.

---

## 12. Rate Limiting

| Endpoint group | Limite | Fenêtre |
|----------------|--------|---------|
| Auth (login/register) | 10 req | 15 min / IP |
| Upload | 20 req | 1 h / session |
| OCR process | 10 req | 1 h / session |
| PDF generate | 30 req | 1 h / session |
| General API | 100 req | 1 min / IP |

**Header response :** `X-RateLimit-Remaining`, `Retry-After`

---

## 13. Validation (Zod — packages/validators)

Exemples :

```typescript
// registerSchema
z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  guestSessionId: z.string().uuid().optional(),
});

// experienceSchema
z.object({
  company: z.string().min(1).max(200),
  position: z.string().min(1).max(200),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  isCurrent: z.boolean().default(false),
  description: z.string().max(5000).optional(),
});
```

---

## 14. Middleware Next.js

```
middleware.ts
├── cors (web origin only)
├── rateLimit
├── auth (JWT verify)
├── guestSession (validate UUID)
└── requestId (logging)
```

---

## 15. Mapping modules → routes

| Module | Routes prefix |
|--------|---------------|
| auth | `/auth/*` |
| user | `/users/*` |
| resume | `/resumes/*` |
| document | `/documents/*` |
| template | `/templates/*` |
| pdf | `/pdf/*` |
| ocr | (interne, via document service) |

---

## 16. Webhooks (V2)

Non implémenté V1. Prévoir stub :
- `POST /webhooks/ocr-complete` (provider externe)

---

## 17. OpenAPI

Générer spec OpenAPI 3.1 depuis Zod (zod-to-openapi) — tâche Sprint 2.

Fichier cible : `/docs/openapi.yaml`
