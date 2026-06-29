#!/usr/bin/env bash
# Vérifie que le conteneur API reçoit bien les variables PayTech (sans afficher les secrets).
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker/docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-docker/.env.production}"

echo "=== PayTech / PUBLIC_APP_URL (conteneur api) ==="
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T api node - <<'NODE'
const key = Boolean(process.env.PAYTECH_API_KEY?.trim())
const secret = Boolean(process.env.PAYTECH_API_SECRET?.trim())
const publicUrl = process.env.PUBLIC_APP_URL || '(missing)'
const ipn = process.env.PAYTECH_IPN_URL || '(missing)'
const env = process.env.PAYTECH_ENV || '(missing)'

console.log('PAYTECH_API_KEY:', key ? 'set' : 'MISSING')
console.log('PAYTECH_API_SECRET:', secret ? 'set' : 'MISSING')
console.log('PAYTECH_ENV:', env)
console.log('PUBLIC_APP_URL:', publicUrl)
console.log('PAYTECH_IPN_URL:', ipn)

if (!key || !secret) {
  console.error('\nERREUR: checkout renverra 503 tant que PAYTECH_* ne sont pas définis dans docker/.env.production puis api redémarré.')
  process.exit(1)
}
console.log('\nOK — variables présentes. Test PayTech: pnpm exec tsx src/scripts/verify-paytech.ts (depuis apps/api avec le même .env).')
NODE
