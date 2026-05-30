#!/usr/bin/env bash
# Create a new timestamped migration file (sorted last when applied).
#
# Usage:
#   ./scripts/db-new-migration.sh club-feature-name
#   ./scripts/db-new-migration.sh add_widget_table

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIR="$ROOT/supabase/migrations"

slug="${1:-}"
if [[ -z "$slug" ]]; then
  echo "Usage: $0 <short-description>" >&2
  echo "Example: $0 event-reminders" >&2
  exit 1
fi

slug="${slug// /-}"
slug="$(echo "$slug" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9_-]/-/g' | sed 's/-\+/-/g' | sed 's/^-//;s/-$//')"

ts="$(date -u +%Y%m%d%H%M%S)"
file="$DIR/${ts}_${slug}.sql"

mkdir -p "$DIR"
cat > "$file" <<EOF
-- Migration: ${slug}
-- Created (UTC): $(date -u +"%Y-%m-%dT%H:%M:%SZ")

EOF

echo "Created $file"
echo "Regenerate bundle: ./scripts/db-migrate-all.sh"
