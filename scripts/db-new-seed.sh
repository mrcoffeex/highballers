#!/usr/bin/env bash
# Create a new timestamped seed file (run manually in Supabase SQL Editor).
#
# Usage:
#   ./scripts/db-new-seed.sh demo-club-data

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIR="$ROOT/supabase/seeds"

slug="${1:-}"
if [[ -z "$slug" ]]; then
  echo "Usage: $0 <short-description>" >&2
  echo "Example: $0 staging-test-users" >&2
  exit 1
fi

slug="${slug// /-}"
slug="$(echo "$slug" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9_-]/-/g' | sed 's/-\+/-/g' | sed 's/^-//;s/-$//')"

ts="$(date -u +%Y%m%d%H%M%S)"
file="$DIR/${ts}_${slug}.sql"

mkdir -p "$DIR"
cat > "$file" <<EOF
-- Seed: ${slug}
-- Created (UTC): $(date -u +"%Y-%m-%dT%H:%M:%SZ")
-- Run in Supabase SQL Editor after migrations (and any prior seeds).

EOF

echo "Created $file"
