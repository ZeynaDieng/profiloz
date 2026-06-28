# Infrastructure Production Profilo'Z

## Vue d'ensemble

L'infrastructure de production Profilo'Z est basée sur Docker Compose avec 5 services :

- **PostgreSQL** : Base de données principale
- **Redis** : Cache, sessions, files d'attente, rate limiting
- **API** : Backend Next.js (port 3001)
- **Web** : Frontend Nuxt (port 3000)
- **Uptime Kuma** : Monitoring (port 3002)

Le reverse proxy Nginx est géré par le serveur hôte et non inclus dans Docker Compose.

## Architecture

```
Internet → Nginx (serveur hôte) → Web (3000) / API (3001)
                                    ↓
                                 PostgreSQL (5432)
                                 Redis (6379)
                                 Uptime Kuma (3002)
```

**Note** : Le reverse proxy Nginx est géré par le serveur hôte et doit être configuré pour :
- Router `/api/*` vers `http://localhost:3001`
- Router `/*` vers `http://localhost:3000`

## Services

### PostgreSQL
- Image : `postgres:16-alpine`
- Volume persistant : `postgres_data`
- Healthcheck : `pg_isready`
- Logs : Rotation automatique (10MB max, 3 fichiers)

### Redis
- Image : `redis:7-alpine`
- Configuration :
  - Persistence AOF activée
  - Mémoire max : 256MB
  - Policy : allkeys-lru
- Volume persistant : `redis_data`
- Healthcheck : `redis-cli ping`
- Logs : Rotation automatique (10MB max, 3 fichiers)

### API
- Build : Multi-stage Dockerfile
- Dépendances : PostgreSQL, Redis, Web
- Healthcheck : `/api/v1/health`
- Variables d'environnement :
  - `DATABASE_URL`
  - `REDIS_URL`
  - `REDIS_CACHE_TTL`
  - `STORAGE_PERSISTENT_PATH` : `/app/storage/persistent`
  - `STORAGE_TEMP_PATH` : `/app/storage/temp`
- Volumes :
  - `storage_persistent` : Photos, CV importés, diplômes, attestations
  - `storage_temp` : PDF générés, traitements temporaires
- Logs : Rotation automatique (10MB max, 3 fichiers)

### Web
- Build : Multi-stage Dockerfile
- Healthcheck : HTTP GET `/`
- Logs : Rotation automatique (10MB max, 3 fichiers)

### Uptime Kuma
- Image : `louislam/uptime-kuma:1`
- Port : 3002
- Volume persistant : `uptime_kuma_data`
- Logs : Rotation automatique (10MB max, 3 fichiers)

## Stockage

### Structure

```
/app/storage/
├── persistent/          # Stockage persistant (sauvegardé)
│   ├── photos/         # Photos de profil
│   ├── resumes/        # CV importés
│   ├── diplomas/       # Diplômes
│   └── certificates/   # Attestations
└── temp/               # Stockage temporaire (non sauvegardé)
    ├── pdfs/          # PDF générés
    └── processing/    # Fichiers de traitement
```

### Volumes Docker

- `postgres_data` : Données PostgreSQL
- `redis_data` : Données Redis
- `storage_persistent` : Fichiers persistants
- `storage_temp` : Fichiers temporaires
- `uptime_kuma_data` : Configuration Uptime Kuma

## Sauvegardes

### Script de sauvegarde

`docker/scripts/backup.sh`

**Sauvegarde automatique de :**
- PostgreSQL (dump compressé)
- Storage persistant (tar.gz)
- Configuration (.env.production)

**Rétention :** 7 jours par défaut (configurable via `RETENTION_DAYS`)

**Exécution :**
```bash
# Manuel
docker/scripts/backup.sh

# Automatique (cron)
0 2 * * * /path/to/docker/scripts/backup.sh
```

**Variables :**
- `BACKUP_DIR` : Répertoire de sauvegarde (défaut : `/backups`)
- `RETENTION_DAYS` : Jours de rétention (défaut : 7)

## Déploiement

### Script de déploiement

`docker/scripts/deploy.sh`

**Processus :**
1. Sauvegarde automatique de l'état actuel
2. Pull des dernières images
3. Build des nouvelles images
4. Déploiement zéro-downtime
5. Vérification post-déploiement
6. Rollback automatique en cas d'échec

**Exécution :**
```bash
docker/scripts/deploy.sh
```

**Variables :**
- `COMPOSE_FILE` : Fichier compose (défaut : `docker/docker-compose.prod.yml`)
- `ENV_FILE` : Fichier environnement (défaut : `docker/.env.production`)

### Script de rollback

`docker/scripts/rollback.sh`

**Processus :**
1. Identification de la dernière sauvegarde
2. Restauration PostgreSQL
3. Restauration storage persistant
4. Restauration configuration
5. Redémarrage des services

**Exécution :**
```bash
docker/scripts/rollback.sh
```

## Monitoring

### Uptime Kuma

**Accès :** http://localhost:3002

**Moniteurs recommandés :**
- Frontend : http://localhost/
- API Health : http://localhost/api/v1/health
- PostgreSQL : healthcheck interne
- Redis : healthcheck interne

**Alertes :**
- Email (configurable dans Uptime Kuma)
- Telegram (configurable dans Uptime Kuma)
- Webhooks (configurable dans Uptime Kuma)

## Logs

### Rotation automatique

Tous les services ont une rotation de logs configurée :
- Taille max par fichier : 10MB
- Nombre de fichiers conservés : 3
- Taille totale max par service : ~30MB

### Accès aux logs

```bash
# Logs d'un service
docker compose -f docker/docker-compose.prod.yml logs -f api

# Logs de tous les services
docker compose -f docker/docker-compose.prod.yml logs -f
```

## Configuration

### Variables d'environnement

Copier `docker/env.production.example` en `docker/.env.production` et modifier :

```bash
cp docker/env.production.example docker/.env.production
```

**Variables essentielles :**
- `POSTGRES_PASSWORD` : Mot de passe PostgreSQL
- `JWT_SECRET` : Secret JWT (générer une chaîne forte)
- `CORS_ORIGIN` : Origine autorisée (ex: https://profiloz.com)
- `NUXT_PUBLIC_API_BASE_URL` : URL publique API
- `NUXT_PUBLIC_APP_URL` : URL publique application

## Premier déploiement

```bash
# 1. Configuration
cp docker/env.production.example docker/.env.production
# Éditer docker/.env.production

# 2. Build et déploiement
docker/scripts/deploy.sh

# 3. Configuration Uptime Kuma
# Ouvrir http://localhost:3002
# Créer un compte admin
# Ajouter les moniteurs recommandés

# 4. Configuration cron backups
# Ajouter au crontab :
# 0 2 * * * /path/to/docker/scripts/backup.sh
```

## Maintenance

### Mise à jour

```bash
docker/scripts/deploy.sh
```

### Rollback

```bash
docker/scripts/rollback.sh
```

### Sauvegarde manuelle

```bash
docker/scripts/backup.sh
```

### Nettoyage

```bash
# Nettoyage des images non utilisées
docker image prune -f

# Nettoyage des volumes non utilisés
docker volume prune -f

# Nettoyage des arrêts
docker system prune -f
```

## Sécurité

### Recommandations

1. **Mots de passe forts** : Utiliser des mots de passe générés pour PostgreSQL et JWT
2. **HTTPS** : Configurer un certificat SSL/TLS (Let's Encrypt recommandé)
3. **Firewall** : Limiter l'accès aux ports nécessaires uniquement
4. **Updates** : Maintenir les images Docker à jour
5. **Backups** : Vérifier régulièrement que les sauvegardes fonctionnent
6. **Monitoring** : Configurer les alertes Uptime Kuma

### Ports exposés

- 80 : HTTP (Nginx)
- 3002 : Uptime Kuma (à sécuriser avec authentification)

## Dépannage

### Services unhealthy

```bash
# Vérifier l'état des services
docker compose -f docker/docker-compose.prod.yml ps

# Logs d'un service spécifique
docker compose -f docker/docker-compose.prod.yml logs api
```

### Problèmes de stockage

```bash
# Vérifier l'espace disque
df -h

# Vérifier les volumes Docker
docker volume ls

# Nettoyer les anciens backups
find /backups -name "profiloz_*" -type f -mtime +7 -delete
```

### Problèmes de base de données

```bash
# Se connecter à PostgreSQL
docker compose -f docker/docker-compose.prod.yml exec postgres psql -U profiloz profiloz

# Restaurer une sauvegarde
gunzip < /backups/profiloz_TIMESTAMP_postgres.sql.gz | docker compose -f docker/docker-compose.prod.yml exec -T postgres psql -U profiloz profiloz
```

## Scalabilité

### Évolutions futures possibles

1. **Load balancing** : Ajouter plusieurs instances web/api
2. **CDN** : CloudFlare ou similaire pour les assets statiques
3. **Object storage** : S3 ou MinIO pour les fichiers
4. **Message queue** : Redis Bull ou RabbitMQ
5. **Rate limiting** : Redis pour limiter les requêtes
6. **Session store** : Redis pour les sessions utilisateur

## Support

En cas de problème :

1. Vérifier les logs des services concernés
2. Consulter Uptime Kuma pour l'historique
3. Vérifier les sauvegardes si rollback nécessaire
4. Contacter l'équipe technique avec les logs pertinents
