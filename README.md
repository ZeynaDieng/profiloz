# Profilo'Z

Générateur de CV professionnel — monorepo Nuxt 4 + Next.js 15.

## Stack

- **Frontend** : Nuxt 4, Vue 3, TypeScript, Tailwind v4, Pinia, Nuxt UI
- **Backend** : Next.js 15, Prisma, PostgreSQL
- **Packages** : `@profiloz/shared`, `@profiloz/validators`

## Prérequis

- Node.js 20+
- pnpm 9+
- Docker (PostgreSQL)

> **Note :** le projet doit être cloné dans un chemin **sans apostrophe** (ex. `ProfiloZ`). Les chemins contenant `'` cassent le typecheck Nuxt/Vite.

## Démarrage rapide

```bash
# Installer les dépendances
pnpm install

# Démarrer PostgreSQL
docker compose -f docker/docker-compose.dev.yml up -d

# Configurer l'API
cp apps/api/.env.example apps/api/.env

# Migrations + seed
pnpm db:migrate
pnpm db:seed

# Lancer web + api
pnpm dev
```

- Web : http://localhost:3000
- API : http://localhost:3001/api/v1/health

## Structure

```
apps/web/          # Frontend Nuxt
apps/api/          # Backend Next.js
packages/shared/   # Types partagés
packages/validators/ # Schémas Zod
docs/              # Documentation architecture
docker/            # Docker Compose & Dockerfiles
```

## Documentation

Voir [`docs/README.md`](docs/README.md) pour l'architecture complète.

## Scripts

| Commande | Description |
|----------|-------------|
| `pnpm dev` | Dev web + api |
| `pnpm build` | Build production |
| `pnpm db:migrate` | Migrations Prisma |
| `pnpm db:seed` | Seed templates |
| `pnpm typecheck` | Vérification TypeScript |
| `pnpm test` | Tests unitaires (API) |
| `pnpm test:e2e` | Tests E2E Playwright |
| `pnpm lint` | ESLint |

## Déploiement production (Docker)

```bash
cp docker/.env.production.example docker/.env.production
# Éditer docker/.env.production (JWT_SECRET, mots de passe)

docker compose -f docker/docker-compose.prod.yml --env-file docker/.env.production up --build -d
```

- Application : http://localhost (nginx → web + api)
- API directe (interne) : http://api:3001/api/v1/health

Le conteneur API exécute automatiquement `prisma migrate deploy` au démarrage.

## Tests

```bash
# Tests unitaires API
pnpm --filter @profiloz/api test

# E2E (web + api doivent tourner, ou laisser Playwright les démarrer)
pnpm test:e2e
```
