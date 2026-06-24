#!/bin/sh
set -e

cd /app

echo "Running database migrations..."
pnpm --filter @profiloz/api exec prisma migrate deploy

if [ "$RUN_SEED" = "true" ]; then
  echo "Seeding database..."
  pnpm --filter @profiloz/api db:seed
fi

echo "Starting API server..."
exec pnpm --filter @profiloz/api start
