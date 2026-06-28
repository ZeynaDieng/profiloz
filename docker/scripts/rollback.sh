#!/bin/bash
set -e

# Script de rollback Profilo'Z
# Restaure la version précédente en cas d'échec de déploiement

# Configuration
COMPOSE_FILE="${COMPOSE_FILE:-docker/docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-docker/.env.production}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
DEPLOYMENTS_DIR="${DEPLOYMENTS_DIR:-/deployments}"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=== Début du rollback Profilo'Z ==="

# 1. Identifier la dernière sauvegarde
echo -e "${YELLOW}Étape 1/4 : Identification de la dernière sauvegarde${NC}"
LATEST_BACKUP=$(ls -t "${BACKUP_DIR}"/profiloz_*_postgres.sql.gz 2>/dev/null | head -1)

if [ -z "$LATEST_BACKUP" ]; then
  echo -e "${RED}ERREUR : Aucune sauvegarde trouvée dans ${BACKUP_DIR}${NC}"
  exit 1
fi

BACKUP_TIMESTAMP=$(basename "$LATEST_BACKUP" | sed 's/profiloz_\(.*\)_postgres.sql.gz/\1/')
echo "Sauvegarde trouvée : ${BACKUP_TIMESTAMP}"

# 2. Restaurer PostgreSQL
echo -e "${YELLOW}Étape 2/4 : Restauration PostgreSQL${NC}"
docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" exec -T postgres psql -U "${POSTGRES_USER:-profiloz}" "${POSTGRES_DB:-profiloz}" < <(gunzip -c "${BACKUP_DIR}/profiloz_${BACKUP_TIMESTAMP}_postgres.sql.gz")
echo -e "${GREEN}PostgreSQL restauré${NC}"

# 3. Restaurer le storage persistant
echo -e "${YELLOW}Étape 3/4 : Restauration storage persistant${NC}"
docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" exec -T api tar xzf - -C / < <(cat "${BACKUP_DIR}/profiloz_${BACKUP_TIMESTAMP}_storage_persistent.tar.gz")
echo -e "${GREEN}Storage persistant restauré${NC}"

# 4. Restaurer la configuration (optionnel)
echo -e "${YELLOW}Étape 4/4 : Restauration configuration${NC}"
if [ -f "${BACKUP_DIR}/profiloz_${BACKUP_TIMESTAMP}_env.production" ]; then
  cp "${BACKUP_DIR}/profiloz_${BACKUP_TIMESTAMP}_env.production" "${ENV_FILE}"
  echo -e "${GREEN}Configuration restaurée${NC}"
else
  echo "Configuration non modifiée (fichier non trouvé)"
fi

# Redémarrage des services
echo -e "${YELLOW}Redémarrage des services...${NC}"
docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" restart api web nginx

# Attente de la santé des services
echo "Attente de la santé des services..."
timeout 120 bash -c "until docker compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} ps web | grep -q healthy; do sleep 2; done"
timeout 120 bash -c "until docker compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} ps api | grep -q healthy; do sleep 2; done"

echo -e "${GREEN}=== Rollback terminé avec succès ===${NC}"
echo "Version restaurée : ${BACKUP_TIMESTAMP}"
