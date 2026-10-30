#!/bin/bash

set -e

PROJECT_DIR="/opt/profiloz/profiloz"
COMPOSE_FILE="$PROJECT_DIR/docker/docker-compose.prod.yml"
ENV_FILE="$PROJECT_DIR/docker/.env.production"

# Définir les ports de secours pour éviter les collisions sur le VPS
export WEB_PORT=3005
export UPTIME_KUMA_PORT=3009

echo "==================================="
echo "🚀 Déploiement Profilo'Z (Scale x3)"
echo "==================================="

cd "$PROJECT_DIR"

echo ""
echo "💾 Sauvegarde de la base avant déploiement..."
BACKUP_DIR="${BACKUP_DIR:-/opt/profiloz/backups}"
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/profiloz_$(date +%Y%m%d_%H%M%S).sql.gz"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres \
  sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > "$BACKUP_FILE"
# Une sauvegarde vide = postgres injoignable : ne pas déployer sans filet
if [ "$(gzip -dc "$BACKUP_FILE" | head -c 100 | wc -c)" -lt 100 ]; then
  echo "❌ Sauvegarde vide ($BACKUP_FILE) : déploiement annulé."
  exit 1
fi
echo "Sauvegarde : $BACKUP_FILE"

echo ""
echo "📥 Récupération des dernières modifications..."
git pull

echo ""
echo "🐳 Reconstruction des images Docker..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build

echo ""
echo "🛑 Arrêt des conteneurs en cours..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down

echo ""
echo "🚀 Démarrage avec une seule API (mise à jour du schéma et seed sans concurrence)..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up --scale api=1 -d --remove-orphans

echo "Attente de l'API..."
if ! timeout 300 bash -c "until docker compose -f '$COMPOSE_FILE' --env-file '$ENV_FILE' exec -T api node -e \"fetch('http://127.0.0.1:3001/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))\" >/dev/null 2>&1; do sleep 3; done"; then
  echo "❌ L'API ne répond pas. Logs :"
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs --tail=80 api
  echo "Base sauvegardée avant déploiement : $BACKUP_FILE"
  exit 1
fi

echo ""
echo "🚀 Passage à 3 instances API..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up --scale api=3 -d --remove-orphans

echo ""
echo "🧹 Nettoyage des anciennes images..."
docker image prune -f

echo ""
echo "📊 État des conteneurs"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps

echo ""
echo "✅ Déploiement terminé avec succès !"
