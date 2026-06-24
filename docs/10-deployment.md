# 10 — Déploiement Profilo'Z

> **Statut :** Document d'architecture — à valider avant implémentation

---

## 1. Architecture de déploiement

```
                    Internet
                        │
                        ▼
              ┌─────────────────┐
              │  Nginx / Caddy   │
              │  SSL (Let's Encrypt)
              └────────┬────────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
         ▼                           ▼
┌─────────────────┐       ┌─────────────────┐
│  apps/web       │       │  apps/api       │
│  Nuxt 4         │       │  Next.js 15     │
│  :3000          │       │  :3001          │
└─────────────────┘       └────────┬────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
            ┌────────────┐  ┌──────────┐  ┌──────────┐
            │ PostgreSQL │  │  Storage │  │ Puppeteer│
            │    16      │  │  Volume  │  │  Chrome  │
            └────────────┘  └──────────┘  └──────────┘
```

---

## 2. Environnements

| Env | URL Web | URL API | Usage |
|-----|---------|---------|-------|
| local | http://localhost:3000 | http://localhost:3001 | Dev |
| staging | https://staging.profiloz.fr | https://api-staging.profiloz.fr | QA, demos |
| production | https://profiloz.fr | https://api.profiloz.fr | Live |

---

## 3. Variables d'environnement

### 3.1 `apps/web`

```bash
# .env
NUXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1
NUXT_PUBLIC_APP_URL=http://localhost:3000
NUXT_PUBLIC_GUEST_SESSION_ENABLED=true
```

### 3.2 `apps/api`

```bash
# .env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://profiloz:profiloz@localhost:5432/profiloz
JWT_SECRET=<random-64-chars>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
STORAGE_PROVIDER=local
STORAGE_LOCAL_PATH=./storage
STORAGE_MAX_FILE_SIZE=10485760
CORS_ORIGIN=http://localhost:3000
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
PDF_TTL_HOURS=24
GUEST_SESSION_TTL_DAYS=7
RATE_LIMIT_ENABLED=true
```

### 3.3 Production additions

```bash
DATABASE_URL=postgresql://user:pass@postgres:5432/profiloz
STORAGE_PROVIDER=local  # → s3 in V1.1
S3_BUCKET=profiloz-prod
S3_REGION=eu-west-3
S3_ACCESS_KEY=
S3_SECRET_KEY=
SENTRY_DSN=
```

---

## 4. Docker Compose — Développement

```yaml
# docker/docker-compose.dev.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: profiloz
      POSTGRES_PASSWORD: profiloz
      POSTGRES_DB: profiloz
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U profiloz"]
      interval: 5s
      timeout: 5s
      retries: 5

  api:
    build:
      context: ..
      dockerfile: docker/Dockerfile.api
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://profiloz:profiloz@postgres:5432/profiloz
    volumes:
      - ../apps/api:/app/apps/api
      - storage_data:/app/storage
    depends_on:
      postgres:
        condition: service_healthy

  web:
    build:
      context: ..
      dockerfile: docker/Dockerfile.web
    ports:
      - "3000:3000"
    environment:
      NUXT_PUBLIC_API_BASE_URL: http://localhost:3001/api/v1
    volumes:
      - ../apps/web:/app/apps/web
    depends_on:
      - api

volumes:
  postgres_data:
  storage_data:
```

---

## 5. Dockerfile API (Puppeteer)

```dockerfile
# docker/Dockerfile.api
FROM node:20-slim AS base
RUN apt-get update && apt-get install -y \
    chromium \
    tesseract-ocr \
    tesseract-ocr-fra \
    tesseract-ocr-eng \
    fonts-liberation \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/ ./packages/
RUN corepack enable && pnpm install --frozen-lockfile

COPY . .
RUN pnpm --filter @profiloz/api build

EXPOSE 3001
CMD ["pnpm", "--filter", "@profiloz/api", "start"]
```

---

## 6. Dockerfile Web

```dockerfile
# docker/Dockerfile.web
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN corepack enable && pnpm install --frozen-lockfile
RUN pnpm --filter @profiloz/web build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/apps/web/.output ./.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

---

## 7. Nginx — Production

```nginx
# docker/nginx/profiloz.conf

upstream web {
    server web:3000;
}

upstream api {
    server api:3001;
}

server {
    listen 443 ssl http2;
    server_name profiloz.fr www.profiloz.fr;

    ssl_certificate /etc/letsencrypt/live/profiloz.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/profiloz.fr/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location / {
        proxy_pass http://web;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl http2;
    server_name api.profiloz.fr;

    ssl_certificate /etc/letsencrypt/live/profiloz.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/profiloz.fr/privkey.pem;

    client_max_body_size 10M;

    location / {
        proxy_pass http://api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts for OCR/PDF
        proxy_read_timeout 120s;
        proxy_connect_timeout 10s;
    }
}
```

---

## 8. GitHub Actions — CI

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test

  e2e:
    runs-on: ubuntu-latest
    needs: lint-and-test
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps
      - run: docker compose -f docker/docker-compose.dev.yml up -d postgres
      - run: pnpm e2e
```

---

## 9. GitHub Actions — Deploy Production

```yaml
# .github/workflows/deploy.yml
name: Deploy Production

on:
  push:
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build and push Docker images
        run: |
          echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin
          docker build -f docker/Dockerfile.api -t profiloz/api:${{ github.ref_name }} .
          docker build -f docker/Dockerfile.web -t profiloz/web:${{ github.ref_name }} .
          docker push profiloz/api:${{ github.ref_name }}
          docker push profiloz/web:${{ github.ref_name }}

      - name: Deploy to server
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /opt/profiloz
            export VERSION=${{ github.ref_name }}
            docker compose -f docker/docker-compose.prod.yml pull
            docker compose -f docker/docker-compose.prod.yml up -d
            docker compose -f docker/docker-compose.prod.yml exec api pnpm prisma migrate deploy
```

---

## 10. Migrations base de données

### Développement

```bash
pnpm --filter @profiloz/api prisma migrate dev
pnpm --filter @profiloz/api prisma db seed
```

### Production

```bash
pnpm --filter @profiloz/api prisma migrate deploy
```

**Règle :** Jamais `migrate dev` en production.

---

## 11. Stockage fichiers

### MVP — Local volume

```yaml
# docker-compose.prod.yml
volumes:
  storage_data:
    driver: local
```

Path mapping : `/app/storage/uploads`, `/app/storage/pdf`

### V1.1 — S3 compatible

| Bucket path | Contenu | TTL |
|-------------|---------|-----|
| `uploads/{userId}/{docId}` | Documents importés | Permanent |
| `pdf/{jobId}` | PDF générés guest | 24h |
| `pdf/{userId}/{resumeId}` | PDF utilisateur | Permanent |
| `avatars/{userId}` | Photos profil | Permanent |

---

## 12. Monitoring & Health

### Endpoints

| URL | Expected |
|-----|----------|
| `GET api.profiloz.fr/api/v1/health` | `{ "status": "ok" }` |
| `GET api.profiloz.fr/api/v1/ready` | 200 if DB connected |

### Uptime monitoring

- Ping health every 60s (UptimeRobot / Better Stack)
- Alert on 2 consecutive failures

### Logs

```bash
# Structured JSON logs
docker compose logs -f api | pino-pretty
```

### Métriques clés

| Métrique | Seuil alerte |
|----------|--------------|
| API p95 latency | > 2s |
| PDF generation p95 | > 15s |
| OCR failure rate | > 20% |
| Error rate 5xx | > 1% |
| Disk usage storage | > 80% |

---

## 13. Backup & Recovery

### PostgreSQL

```bash
# Cron daily 2am
pg_dump -U profiloz profiloz | gzip > /backups/profiloz_$(date +%Y%m%d).sql.gz

# Retention: 30 days
```

### Restore procedure

```bash
gunzip -c backup.sql.gz | psql -U profiloz profiloz
```

### RTO / RPO cibles

| Métrique | Cible |
|----------|-------|
| RPO | 24h |
| RTO | 4h |

---

## 14. Sécurité production

| Mesure | Implementation |
|--------|----------------|
| HTTPS only | Nginx redirect 80→443 |
| Secrets | GitHub Secrets + server env, never in repo |
| DB credentials | Strong password, no public port |
| File upload | 10MB limit, MIME whitelist |
| Rate limiting | Enabled all env except local |
| CORS | Strict origin prod domains |
| JWT | Short expiry 15m + refresh |
| Container | Non-root user |
| Dependencies | Dependabot weekly |

---

## 15. Scaling considerations (post-V1)

| Composant | Scale strategy |
|-----------|----------------|
| Web | Horizontal, stateless |
| API | Horizontal, stateless |
| PostgreSQL | Read replicas |
| PDF generation | Dedicated worker queue (BullMQ) |
| OCR | Separate worker containers |
| Storage | S3 + CDN |

---

## 16. Checklist pre-launch

- [ ] DNS configuré (profiloz.fr, api.profiloz.fr)
- [ ] SSL certificats actifs
- [ ] Variables prod configurées
- [ ] Migrations appliquées
- [ ] Seed templates exécuté
- [ ] Health checks OK
- [ ] Backup cron actif
- [ ] Rate limiting activé
- [ ] CORS production configuré
- [ ] Smoke test E2E sur staging
- [ ] Content audit FR
- [ ] Rollback procedure documentée

---

## 17. Rollback procedure

```bash
# 1. Identifier version précédente
export PREV_VERSION=v1.0.0

# 2. Rollback containers
docker compose -f docker/docker-compose.prod.yml down
export VERSION=$PREV_VERSION
docker compose -f docker/docker-compose.prod.yml up -d

# 3. Rollback DB si migration breaking (manual review)
# pnpm prisma migrate resolve --rolled-back <migration_name>
```

---

## 18. Coûts infrastructure estimés (V1)

| Service | Provider | Coût/mois |
|---------|----------|-----------|
| VPS 4 vCPU / 8GB | Hetzner/OVH | ~€20–40 |
| Domaine .fr | — | ~€1 |
| SSL | Let's Encrypt | Gratuit |
| Backups | VPS snapshot | ~€5 |
| **Total MVP** | | **~€30–50/mois** |

Scale post-V1 : managed PostgreSQL + S3 + workers → ~€150–300/mois.
