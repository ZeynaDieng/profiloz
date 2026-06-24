# 08 — Roadmap de Développement Profilo'Z

> **Statut :** Document d'architecture — à valider avant implémentation  
> **Durée totale estimée :** 16 semaines (équipe 2 devs + 1 designer part-time)

---

## 1. Phases

```
Phase 0 ──► Phase 1 ──► Phase 2 ──► Phase 3 ──► Phase 4 ──► Phase 5
Setup       Foundation   Core         Features     Polish       Launch
(1 sem)     (2 sem)      (4 sem)      (4 sem)      (3 sem)      (2 sem)
```

---

## 2. Phase 0 — Setup & Infrastructure (Semaine 1)

**Objectif :** Monorepo fonctionnel, CI basique, environnement dev.

| Livrable | Critère done |
|----------|--------------|
| Monorepo Turborepo | `pnpm dev` lance web + api |
| Docker Compose | PostgreSQL + apps |
| Prisma init | Migrations baseline |
| Packages shared | Types + Zod exportables |
| ESLint + Prettier | Config partagée |
| GitHub Actions | Lint + typecheck on PR |

**Risques :** Nuxt 4 release candidate — pin versions.

---

## 3. Phase 1 — Foundation (Semaines 2–3)

**Objectif :** Design system, layouts, auth skeleton, guest session.

### Sprint 1.1 (Semaine 2)

| Feature | Priorité |
|---------|----------|
| Design tokens Tailwind v4 | P0 |
| Layouts (4 types) | P0 |
| Composants UI primitifs | P0 |
| Landing page (statique) | P0 |
| i18n fr-FR base | P0 |

### Sprint 1.2 (Semaine 3)

| Feature | Priorité |
|---------|----------|
| API health + guest session | P0 |
| Auth register/login | P0 |
| Pinia stores skeleton | P0 |
| API client composable | P0 |
| Page connexion + inscription | P0 |

**Milestone M1 :** Landing live + auth + layouts ✅

---

## 4. Phase 2 — Core Resume Engine (Semaines 4–7)

**Objectif :** Modèle données, wizard, templates, preview.

### Sprint 2.1 (Semaine 4)

| Feature | Priorité |
|---------|----------|
| Prisma schema complet | P0 |
| Resume CRUD API | P0 |
| Resume store + localStorage | P0 |
| Wizard step 1–2 | P0 |

### Sprint 2.2 (Semaine 5)

| Feature | Priorité |
|---------|----------|
| Wizard step 3–6 | P0 |
| Wizard navigation guards | P0 |
| Completeness calculator | P1 |
| Écran choix parcours `/creer` | P1 |

### Sprint 2.3 (Semaine 6)

| Feature | Priorité |
|---------|----------|
| Template registry (10) | P0 |
| 5 premiers templates Vue | P0 |
| Page sélection modèle | P0 |
| Preview A4 component | P0 |

### Sprint 2.4 (Semaine 7)

| Feature | Priorité |
|---------|----------|
| 5 templates restants | P0 |
| Editor sidebar | P0 |
| Page éditeur | P0 |
| Template config (colors, margins) | P1 |

**Milestone M2 :** Parcours manuel complet jusqu'à preview ✅

---

## 5. Phase 3 — Import & PDF (Semaines 8–11)

**Objectif :** OCR, imports, génération PDF, success flow.

### Sprint 3.1 (Semaine 8)

| Feature | Priorité |
|---------|----------|
| Document upload API | P0 |
| Storage provider local | P0 |
| FileDropZone component | P0 |
| Import CV page | P0 |

### Sprint 3.2 (Semaine 9)

| Feature | Priorité |
|---------|----------|
| Tesseract OCR integration | P0 |
| OCR parser service | P0 |
| Extracted preview UI | P0 |
| Import diplôme + attestation | P0 |

### Sprint 3.3 (Semaine 10)

| Feature | Priorité |
|---------|----------|
| Puppeteer PDF service | P0 |
| PDF generate API | P0 |
| PDF download flow | P0 |
| Success page + confetti | P0 |

### Sprint 3.4 (Semaine 11)

| Feature | Priorité |
|---------|----------|
| Guest → user migration | P0 |
| Resume merge import | P0 |
| Document history API + UI | P1 |
| Rate limiting | P1 |

**Milestone M3 :** Parcours complet guest → PDF ✅

---

## 6. Phase 4 — Dashboard & Cover Letters (Semaines 12–14)

**Objectif :** Expérience utilisateur authentifiée.

### Sprint 4.1 (Semaine 12)

| Feature | Priorité |
|---------|----------|
| Dashboard layout + sidebar | P0 |
| Resume grid + cards | P0 |
| CRUD dashboard actions | P0 |
| Duplicate resume | P1 |

### Sprint 4.2 (Semaine 13)

| Feature | Priorité |
|---------|----------|
| Profile strength widget | P1 |
| Documents list page | P1 |
| Templates page (dashboard) | P2 |
| Settings page stub | P3 |

### Sprint 4.3 (Semaine 14)

| Feature | Priorité |
|---------|----------|
| Cover letter form + preview | P1 |
| Cover letter PDF | P1 |
| Cover letter CRUD API | P1 |
| Francisation complète | P0 |

**Milestone M4 :** App authentifiée complète ✅

---

## 7. Phase 5 — Polish & Launch (Semaines 15–16)

**Objectif :** QA, performance, déploiement production.

### Sprint 5.1 (Semaine 15)

| Feature | Priorité |
|---------|----------|
| E2E tests parcours critiques | P0 |
| Performance audit | P1 |
| Accessibility audit | P1 |
| Error handling polish | P0 |
| Mobile responsive QA | P0 |

### Sprint 5.2 (Semaine 16)

| Feature | Priorité |
|---------|----------|
| Production Docker images | P0 |
| CI/CD deploy pipeline | P0 |
| Monitoring health checks | P1 |
| Documentation ops | P1 |
| Soft launch | P0 |

**Milestone M5 :** Production live ✅

---

## 8. Timeline Gantt (simplifié)

```
Sem  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16
─────────────────────────────────────────────────────
P0 Setup    █
P1 Found      ████
P2 Core           ████████
P3 Import                 ████████
P4 Dashboard                      ██████
P5 Launch                               ████
```

---

## 9. Dépendances inter-phases

```
P0 ──► P1 ──► P2 ──► P3 ──► P4 ──► P5
         │       │       │
         │       │       └── PDF depends on templates
         │       └── Templates depend on resume model
         └── Auth depends on DB schema
```

---

## 10. Équipe recommandée

| Rôle | Allocation | Responsabilités |
|------|------------|-----------------|
| Dev Frontend | 100% | Nuxt, composants, stores |
| Dev Backend | 100% | Next.js, Prisma, OCR, PDF |
| Designer | 25% | Écrans manquants, QA visuelle |
| QA | 25% (S15+) | E2E, regression |

---

## 11. Critères de release V1

| Critère | Mesure |
|---------|--------|
| Parcours guest complet | E2E pass |
| 10 templates render | Visual QA |
| OCR import CV | > 70% champs on test set |
| PDF fidelity | Visual diff < 5% vs preview |
| Auth + migration | E2E pass |
| FR locale 100% | No EN strings in UI |
| No IA mentions | Content audit |
| Lighthouse perf | > 80 landing |
| Security | OWASP top 10 review |

---

## 12. Post-launch V1.1 (Semaines 17–20)

| Feature | Priorité |
|---------|----------|
| Mot de passe oublié | P1 |
| Settings page complete | P2 |
| Export JSON resume | P2 |
| S3 storage migration | P1 |
| OCR provider externe | P2 |
| EN locale | P3 |

---

## 13. Risques planning

| Risque | Impact timeline | Contingence |
|--------|-----------------|-------------|
| Puppeteer Docker issues | +1 sem | Playwright alternative |
| OCR quality | +0.5 sem UX | More correction UI |
| Nuxt 4 breaking changes | +1 sem | Pin version |
| Template complexity | +1 sem | Ship 8/10 templates |

---

## 14. Définition of Done (global)

- [ ] Code reviewed + merged
- [ ] Types strict pass
- [ ] Unit tests critical paths
- [ ] API documented
- [ ] i18n keys added
- [ ] Responsive tested
- [ ] No console errors
- [ ] Accessible labels
