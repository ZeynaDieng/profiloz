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
echo "📥 Récupération des dernières modifications..."
git pull

echo ""
echo "🐳 Reconstruction des images Docker..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build

echo ""
echo "🛑 Arrêt des conteneurs en cours..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down

echo ""
echo "🚀 Redémarrage des services (avec scaling API x3)..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up --scale api=3 -d --remove-orphans

echo ""
echo "🗄️ Application des migrations et seed Prisma..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" run --rm api pnpm --filter @profiloz/api exec prisma migrate deploy
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" run --rm api pnpm --filter @profiloz/api db:seed

echo ""
echo "🧹 Nettoyage des anciennes images..."
docker image prune -f

echo ""
echo "📊 État des conteneurs"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps

echo ""
echo "✅ Déploiement terminé avec succès !"
