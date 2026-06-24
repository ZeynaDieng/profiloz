# Profilo'Z — Documentation Architecture

> **Statut :** Phase architecture — **aucune implémentation code** tant que validation non obtenue.

## Mission

Profilo'Z permet de créer un CV professionnel en quelques minutes : création manuelle, import de documents (CV, diplômes, attestations), choix de modèle, preview temps réel, export PDF. Compte optionnel post-génération.

## Stack

| Couche | Technologies |
|--------|-------------|
| Frontend | Nuxt 4, Vue 3, TypeScript, Tailwind v4, Pinia, VueUse, Nuxt UI |
| Backend | Next.js 15, App Router, Prisma, PostgreSQL |
| Infra | Docker, Docker Compose, GitHub Actions |
| PDF | Puppeteer (HTML → PDF) |
| OCR | Tesseract (architecture swappable) |

## Documents

| # | Fichier | Contenu |
|---|---------|---------|
| 01 | [01-product-analysis.md](./01-product-analysis.md) | Analyse PRD, critique maquettes, incohérences, améliorations |
| 02 | [02-architecture.md](./02-architecture.md) | Architecture système, monorepo, modules, ADR |
| 03 | [03-database-design.md](./03-database-design.md) | Schéma Prisma, ERD, migrations |
| 04 | [04-api-design.md](./04-api-design.md) | REST API, endpoints, validation, rate limiting |
| 05 | [05-frontend-architecture.md](./05-frontend-architecture.md) | Structure Nuxt, stores, routing, i18n |
| 06 | [06-ui-components.md](./06-ui-components.md) | Design system, mapping composants Stitch |
| 07 | [07-user-flows.md](./07-user-flows.md) | Parcours utilisateur complets |
| 08 | [08-development-roadmap.md](./08-development-roadmap.md) | Roadmap 16 semaines, milestones |
| 09 | [09-tasks.md](./09-tasks.md) | Backlog détaillé Epic/Feature/Task (~1076h) |
| 10 | [10-deployment.md](./10-deployment.md) | Docker, CI/CD, nginx, monitoring |

## Décisions clés à valider

1. Monorepo Turborepo + packages `@profiloz/shared` / `@profiloz/validators`
2. Guest session + localStorage MVP → migration PostgreSQL à l'inscription
3. 10 templates Vue extensibles via registry
4. OCR Tesseract V1 avec interface swappable
5. Francisation UI + suppression mentions IA V1
6. Écrans manquants : connexion, wizard steps 2–6, import diplôme/attestation, choix parcours

## Estimation

- **~1076 heures** de développement
- **~15 semaines** avec 2 développeurs
- **16 semaines** roadmap incluant polish et launch

## Prochaine étape

Valider cette documentation architecture, puis démarrer **Epic E0 — Setup Projet** (`09-tasks.md`).
