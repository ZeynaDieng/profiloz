#!/bin/bash
set -e

# Script de sauvegarde automatique Profilo'Z
# Sauvegarde : PostgreSQL, storage persistant, fichiers de configuration

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="profiloz_${TIMESTAMP}"
COMPOSE_FILE="${COMPOSE_FILE:-docker/docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-docker/.env.production}"

# Création du répertoire de sauvegarde
mkdir -p "${BACKUP_DIR}"

echo "=== Début de la sauvegarde Profilo'Z (${TIMESTAMP}) ==="

# 1. Sauvegarde PostgreSQL
echo "Sauvegarde PostgreSQL..."
docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" exec -T postgres pg_dump -U "${POSTGRES_USER:-profiloz}" "${POSTGRES_DB:-profiloz}" | gzip > "${BACKUP_DIR}/${BACKUP_NAME}_postgres.sql.gz"
echo "PostgreSQL sauvegardé : ${BACKUP_DIR}/${BACKUP_NAME}_postgres.sql.gz"

# 2. Sauvegarde du storage persistant (photos, CV importés, diplômes, attestations)
echo "Sauvegarde storage persistant..."
docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" exec -T api tar czf - /app/storage/persistent > "${BACKUP_DIR}/${BACKUP_NAME}_storage_persistent.tar.gz"
echo "Storage persistant sauvegardé : ${BACKUP_DIR}/${BACKUP_NAME}_storage_persistent.tar.gz"

# 3. Sauvegarde des fichiers de configuration (.env)
echo "Sauvegarde configuration..."
if [ -f "${ENV_FILE}" ]; then
  cp "${ENV_FILE}" "${BACKUP_DIR}/${BACKUP_NAME}_env.production"
  echo "Configuration sauvegardée : ${BACKUP_DIR}/${BACKUP_NAME}_env.production"
else
  echo "AVERTISSEMENT : Fichier ${ENV_FILE} non trouvé"
fi

# 4. Nettoyage des anciennes sauvegardes (rétention)
echo "Nettoyage des sauvegardes anciennes (> ${RETENTION_DAYS} jours)..."
find "${BACKUP_DIR}" -name "profiloz_*" -type f -mtime +${RETENTION_DAYS} -delete
echo "Nettoyage terminé"

# 5. Vérification de la sauvegarde
echo "Vérification de la sauvegarde..."
BACKUP_SIZE=$(du -sh "${BACKUP_DIR}/${BACKUP_NAME}"* | awk '{sum+=$1} END {print sum}')
echo "Taille totale de la sauvegarde : ${BACKUP_SIZE}"

echo "=== Sauvegarde terminée avec succès ==="
echo "Fichiers créés :"
ls -lh "${BACKUP_DIR}/${BACKUP_NAME}"*
