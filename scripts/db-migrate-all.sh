#!/usr/bin/env bash
# Combine HighBallers SQL into one file (correct order) for Supabase SQL Editor or psql.
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
EXECUTE=false

for arg in "$@"; do
  case "$arg" in
    --execute) EXECUTE=true ;;
    -h|--help)
      sed -n '2,12p' "$0"
      exit 0
      ;;
  esac
done

MIGRATIONS=(
  migration-club-visibility.sql
  migration-event-coordinates.sql
  migration-event-max-players.sql
  migration-event-players-per-game.sql
  migration-court-games.sql
  migration-event-stats.sql
  migration-event-stats-rls.sql
  migration-subscription-tier.sql
  migration-basic-create-game.sql
  migration-club-chats.sql
  migration-basic-chat.sql
  migration-iap-subscriptions.sql
  migration-push-notifications.sql
)

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
    path="$ROOT/supabase/$file"
    if [[ ! -f "$path" ]]; then
      echo "Missing: $path" >&2
      exit 1
    fi
    echo "-- ========== $file =========="
    cat "$path"
    echo ""
  done

  echo "-- Done. Optional seeds (manual): seed-*.sql in supabase/"
} > "$OUT"

echo "Wrote $OUT ($(wc -l < "$OUT") lines)"

if [[ "$EXECUTE" == "true" ]]; then
  if ! command -v supabase >/dev/null 2>&1; then
    echo "Supabase CLI not found. Install: npm i -g supabase" >&2
    exit 1
  fi
  supabase db execute --file "$OUT" --linked
  echo "Applied via Supabase CLI (linked project)."
fi
