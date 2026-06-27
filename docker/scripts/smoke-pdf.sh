#!/usr/bin/env bash
# Smoke test PDF — stack Docker prod (nginx sur localhost par défaut).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BASE_URL="${SMOKE_BASE_URL:-http://localhost}"
API_BASE="${SMOKE_API_BASE:-${BASE_URL}/api/v1}"
FIXTURE="${ROOT_DIR}/fixtures/pdf-snapshot.json"
TIMEOUT="${SMOKE_TIMEOUT_SEC:-180}"

if ! command -v curl >/dev/null 2>&1; then
  echo "curl requis" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq requis" >&2
  exit 1
fi

echo "→ Health API"
curl -sf "${API_BASE}/health?detailed=1" | jq -e '.status == "ok"' >/dev/null

echo "→ PDF render readiness"
PDF_OK="$(curl -sf "${API_BASE}/health?detailed=1" | jq -r '.pdfRender.ok')"
if [ "$PDF_OK" != "true" ]; then
  echo "pdfRender.ok != true — vérifier APP_URL et le service web" >&2
  curl -sf "${API_BASE}/health?detailed=1" | jq '.pdfRender' >&2 || true
  exit 1
fi

echo "→ Guest session"
SESSION_ID="$(curl -sf -X POST "${API_BASE}/guest/session" \
  -H 'Content-Type: application/json' \
  -d '{}' | jq -r '.sessionId')"
if [ -z "$SESSION_ID" ] || [ "$SESSION_ID" = "null" ]; then
  echo "sessionId manquant" >&2
  exit 1
fi

echo "→ Génération PDF (timeout ${TIMEOUT}s)"
START=$(date +%s)
RESP="$(curl -sf --max-time "$TIMEOUT" -X POST "${API_BASE}/pdf/generate-from-snapshot" \
  -H 'Content-Type: application/json' \
  -H "X-Guest-Session-Id: ${SESSION_ID}" \
  --data-binary "@${FIXTURE}")"
ELAPSED=$(( $(date +%s) - START ))
echo "   généré en ${ELAPSED}s"

JOB_ID="$(echo "$RESP" | jq -r '.jobId')"
DOWNLOAD_PATH="$(echo "$RESP" | jq -r '.downloadUrl')"
if [ -z "$JOB_ID" ] || [ "$JOB_ID" = "null" ]; then
  echo "jobId manquant: $RESP" >&2
  exit 1
fi

OUT="$(mktemp -t profiloz-smoke-XXXXXX.pdf)"
trap 'rm -f "$OUT"' EXIT

echo "→ Téléchargement ${DOWNLOAD_PATH}"
curl -sf -H "X-Guest-Session-Id: ${SESSION_ID}" "${API_BASE}${DOWNLOAD_PATH}" -o "$OUT"

SIZE="$(wc -c < "$OUT" | tr -d ' ')"
MAGIC="$(head -c 4 "$OUT")"
if [ "$MAGIC" != "%PDF" ]; then
  echo "Fichier invalide (magic: $MAGIC)" >&2
  exit 1
fi
if [ "$SIZE" -lt 1000 ]; then
  echo "PDF trop petit (${SIZE} octets)" >&2
  exit 1
fi

echo "OK — PDF valide (${SIZE} octets, job ${JOB_ID})"
