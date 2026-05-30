#!/usr/bin/env bash
# Combine HighBallers SQL into one file (correct order) for Supabase SQL Editor or psql.
#
# Migrations live in supabase/migrations/ as:
#   YYYYMMDDHHMMSS_short-description.sql
# Sorted by filename (timestamp) = apply order. Latest file = highest timestamp.
#
# Optional seeds: supabase/seeds/ (same timestamp prefix, run manually in order)
#
# Usage:
#   ./scripts/db-migrate-all.sh              # writes supabase/_apply-all.sql
#   ./scripts/db-migrate-all.sh --execute    # needs linked project + Supabase CLI
#
# Fresh database: includes schema.sql
# Existing database (already ran schema before): use migrations-only mode:
#   SKIP_SCHEMA=1 ./scripts/db-migrate-all.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/supabase/_apply-all.sql"
MIGRATIONS_DIR="$ROOT/supabase/migrations"
SEEDS_DIR="$ROOT/supabase/seeds"
EXECUTE=false

for arg in "$@"; do
  case "$arg" in
    --execute) EXECUTE=true ;;
    -h|--help)
      sed -n '2,18p' "$0"
      exit 0
      ;;
  esac
done

if [[ ! -d "$MIGRATIONS_DIR" ]]; then
  echo "Missing migrations directory: $MIGRATIONS_DIR" >&2
  exit 1
fi

MIGRATIONS=()
while IFS= read -r path; do
  MIGRATIONS+=("$(basename "$path")")
done < <(find "$MIGRATIONS_DIR" -maxdepth 1 -name '*.sql' | sort)

if [[ ${#MIGRATIONS[@]} -eq 0 ]]; then
  echo "No migration files in $MIGRATIONS_DIR" >&2
  exit 1
fi

{
  echo "-- HighBallers: combined schema + migrations"
  echo "-- Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo "-- Paste into Supabase Dashboard → SQL Editor → Run"
  echo ""

  if [[ "${SKIP_SCHEMA:-}" != "1" ]]; then
    echo "-- ========== schema.sql (baseline) =========="
    cat "$ROOT/supabase/schema.sql"
    echo ""
  else
    echo "-- SKIP_SCHEMA=1: baseline schema.sql omitted"
    echo ""
  fi

  for file in "${MIGRATIONS[@]}"; do
    path="$MIGRATIONS_DIR/$file"
    echo "-- ========== migrations/$file =========="
    cat "$path"
    echo ""
  done

  echo "-- Done."
  if [[ -d "$SEEDS_DIR" ]]; then
    echo "-- Optional seeds (manual, filename order = run order):"
    while IFS= read -r seed; do
      echo "--   seeds/$(basename "$seed")"
    done < <(find "$SEEDS_DIR" -maxdepth 1 -name '*.sql' | sort)
  fi
} > "$OUT"

echo "Wrote $OUT ($(wc -l < "$OUT") lines, ${#MIGRATIONS[@]} migrations)"
if [[ ${#MIGRATIONS[@]} -gt 0 ]]; then
  echo "Latest migration: ${MIGRATIONS[${#MIGRATIONS[@]}-1]}"
fi

if [[ "$EXECUTE" == "true" ]]; then
  if ! command -v supabase >/dev/null 2>&1; then
    echo "Supabase CLI not found. Install: npm i -g supabase" >&2
    exit 1
  fi
  supabase db execute --file "$OUT" --linked
  echo "Applied via Supabase CLI (linked project)."
fi
