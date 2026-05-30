#!/usr/bin/env bash
# Upload EXPO_PUBLIC_* vars to EAS (preview + production).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
run_eas() {
  if [[ -x "$ROOT/node_modules/.bin/eas" ]]; then
    "$ROOT/node_modules/.bin/eas" "$@"
    return
  fi
  # Package name is eas-cli; binary is eas
  npx --yes eas-cli "$@"
}

pick_env_file() {
  for candidate in "$ROOT/.env" "$ROOT/env.local" "$ROOT/.env.local"; do
    if [[ -f "$candidate" ]]; then
      echo "$candidate"
      return 0
    fi
  done
  return 1
}

ENV_FILE="$(pick_env_file || true)"
if [[ -z "$ENV_FILE" ]]; then
  echo "Missing env file — add .env or env.local (see .env.example)." >&2
  exit 1
fi

cd "$ROOT"

if [[ ! -x "$ROOT/node_modules/.bin/eas" ]]; then
  echo "Installing eas-cli..."
  npm install eas-cli@^16.17.4 --save-dev
fi

echo "Using env file: $ENV_FILE"

for env_name in preview production; do
  echo "Pushing env to EAS environment: $env_name"
  run_eas env:push --environment "$env_name" --path "$ENV_FILE"
done

echo "Done. Verify at https://expo.dev → Project → Environment variables"
