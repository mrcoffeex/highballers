#!/usr/bin/env bash
# Upload EXPO_PUBLIC_* vars from .env to EAS (preview + production).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE — copy from .env.example first." >&2
  exit 1
fi

cd "$ROOT"

for env_name in preview production; do
  echo "Pushing env to EAS environment: $env_name"
  eas env:push --environment "$env_name" --path "$ENV_FILE"
done

echo "Done. Verify at https://expo.dev → Project → Environment variables"
