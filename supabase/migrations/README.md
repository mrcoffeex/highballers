# Migrations

Files are named **`YYYYMMDDHHMMSS_description.sql`** (UTC timestamp + slug).

- **Apply order** = sort by filename (lexicographic = chronological).
- **Latest migration** = highest timestamp prefix.

## Apply all

```bash
./scripts/db-migrate-all.sh              # writes ../_apply-all.sql
SKIP_SCHEMA=1 ./scripts/db-migrate-all.sh   # existing DB, migrations only
```

## New migration

```bash
./scripts/db-new-migration.sh my-change-name
```
