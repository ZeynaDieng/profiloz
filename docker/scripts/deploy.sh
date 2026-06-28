#!/bin/bash
set -e

# Script de déploiement Profilo'Z
# Déploie la nouvelle version avec sauvegarde automatique et rollback en cas d'échec

# Configuration
COMPOSE_FILE="${COMPOSE_FILE:-docker/docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-docker/.env.production}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
DEPLOYMENTS_DIR="${DEPLOYMENTS_DIR:-/deployments}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DEPLOYMENT_NAME="profiloz_${TIMESTAMP}"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=== Début du déploiement Profilo'Z (${TIMESTAMP}) ==="

# 1. Pré-déploiement : Sauvegarde
echo -e "${YELLOW}Étape 1/5 : Sauvegarde de l'état actuel${NC}"
mkdir -p "${BACKUP_DIR}"
docker/scripts/backup.sh
echo -e "${GREEN}Sauvegarde terminée${NC}"

# 2. Pull des dernières images
echo -e "${YELLOW}Étape 2/5 : Pull des images Docker${NC}"
docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" pull
echo -e "${GREEN}Pull terminé${NC}"

# 3. Build des nouvelles images
echo -e "${YELLOW}Étape 3/5 : Build des images${NC}"
docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" build
echo -e "${GREEN}Build terminé${NC}"

# 4. Déploiement avec zéro-downtime
echo -e "${YELLOW}Étape 4/5 : Déploiement${NC}"

# Arrêt gracieux des services
docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" up -d --no-deps --build postgres redis

# Déploiement des services applicatifs
docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" up -d --no-deps web

# Attente de la santé du web
echo "Attente de la santé du service web..."
timeout 120 bash -c "until docker compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} exec -T web wget -qO- http://127.0.0.1:3000/ > /dev/null 2>&1; do sleep 2; done"

# Déploiement de l'API
docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" up -d --no-deps api

# Attente de la santé de l'API
echo "Attente de la santé du service API..."
timeout 120 bash -c "until docker compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} exec -T api node -e \"fetch('http://127.0.0.1:3001/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))\"; do sleep 2; done"

# Redéploiement de nginx
docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" up -d nginx

echo -e "${GREEN}Déploiement terminé${NC}"

# 5. Post-déploiement : Vérification
echo -e "${YELLOW}Étape 5/5 : Vérification post-déploiement${NC}"

# Vérification des services
SERVICES=("postgres" "redis" "web" "api" "nginx")
ALL_HEALTHY=true

for service in "${SERVICES[@]}"; do
  if docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" ps "$service" | grep -q "healthy"; then
    echo -e "${GREEN}✓ $service : healthy${NC}"
  else
    echo -e "${RED}✗ $service : unhealthy${NC}"
    ALL_HEALTHY=false
  fi
done

if [ "$ALL_HEALTHY" = false ]; then
  echo -e "${RED}ERREUR : Certains services ne sont pas healthy${NC}"
  echo "Rollback automatique en cours..."
  docker/scripts/rollback.sh
  exit 1
fi

# Nettoyage des anciennes images
echo "Nettoyage des anciennes images Docker..."
docker image prune -f

# Sauvegarde du déploiement réussi
mkdir -p "${DEPLOYMENTS_DIR}"
echo "${TIMESTAMP}" > "${DEPLOYMENTS_DIR}/last_successful_deployment.txt"

echo -e "${GREEN}=== Déploiement terminé avec succès ===${NC}"
echo "Version déployée : ${TIMESTAMP}"
echo "Application disponible sur : http://localhost"
echo "Uptime Kuma disponible sur : http://localhost:3002"
