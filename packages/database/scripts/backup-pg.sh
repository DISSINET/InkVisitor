#!/bin/bash

# Nightly pg_dump of every database on one PostgreSQL server into ./archives,
# the directory backup.sh fills with RethinkDB dumps and sync.sh ships to the
# cloud. Archives are gzipped pg_dump tar format (-Ft), so the .tar.gz suffix
# matches what the server's Backups page lists.
#
# Connection: the standard PGHOST / PGPORT / PGUSER / PGPASSWORD env vars.
# PG_EXEC runs the clients inside a container when the host has none, e.g.
#   PG_EXEC="podman exec inkvisitor-postgres" ./backup-pg.sh
# (clients then always match the server version; the dump streams out, so the
# archive still lands on the host).
#
# Restore: gunzip -c backup_YYYY_MM_DD_<db>_pg.tar.gz | pg_restore -d <db>
set -euo pipefail

cd "$(dirname "$0")"
mkdir -p archives && cd archives

: "${PGUSER:=inkvisitor}"
: "${PG_EXEC:=}"

# delete backup* files older than 3+ days which does not include xxxx_xx_01 pattern (not the first day of month)
find . -type f -mtime +3 -name 'backup*' -not -name 'backup_[0-9][0-9][0-9][0-9]_[0-9][0-9]_01*' -delete

# every real database on the server, so a new instance is covered without editing this file
dbs=$($PG_EXEC psql -U "$PGUSER" -d postgres -Atc \
  "select datname from pg_database where not datistemplate and datname <> 'postgres'")

for db in $dbs; do
  out=backup_$(date +'%Y_%m_%d')_${db}_pg.tar.gz
  # .part until complete, so a dump cut short is never mistaken for a backup
  $PG_EXEC pg_dump -U "$PGUSER" -Ft "$db" | gzip > "$out.part"
  mv "$out.part" "$out"
  echo "$(date +'%F %T') $out $(du -h "$out" | cut -f1)"
done
