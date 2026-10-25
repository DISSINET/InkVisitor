# PostgreSQL: keep one `doc jsonb` column, or add real columns?

Status: proposal, measured 2026-10-25 on a local clone of the production export. Nothing in the schema has changed yet.

## Answer

- **Audits: yes, add STORED generated columns** (`date`, `type`, `"user"`, `audit_scope`, `model_id`) with three btree indexes on them. This is the only table where jsonb itself costs us: the stats aggregation (`countByBucket`) has to detoast 1.2 KB documents to read three short fields, and an expression index can never be scanned index-only. Measured 1.3 s to 53 ms and 4.7 s to 0.2 s at 1M audits.
- **Everything else: the expression indexes are good enough.** Every entity, relation, document and stats query answers in under 10 ms on production-size data, except the regex label search (50 ms), which no column fixes. Explore edges that scan nested arrays take 10 to 60 ms; child tables cut that 10 to 30x, but the absolute gain is tens of milliseconds per edge for 5 new tables, triggers and 40 to 50 % slower statement writes. Not now.
- **Two code fixes are worth doing regardless of schema**, and on the jsonb schema they already remove the worst numbers: an index on (`auditScope`, `modelId`, `date`) turns `lastNFor` from 2.5 s into 0.8 ms, and writing `page` / `onDate` as a date range instead of the unindexable `left(doc->>'date', 10) || ...` expression turns 1.6 s into 4 ms.
- **Not the slim-doc split (b)** and **not Timescale columnstore (d)**, reasons below.

## How it was measured

- Data: `export-inkvisitor-20261020` seeded with `pnpm -C packages/database seed --target=postgres` into a scratch database: 45 979 entities (4 406 statements, 22 783 values, 6 129 concepts), 21 719 relations, 8 documents, 153 425 audits. The 20251122 dump has the same row counts, so neither reaches the ~1M audits production holds; audits were scaled to 1 073 975 rows by cloning every row six times with fresh ids (same dates, same modelIds). Entity-side numbers are real production shape.
- Queries: the SQL the adapter emits, verbatim (`postgres/tables.ts`, `entities.ts`, `search.ts`, `query/edges.ts`), with the heaviest real ids as parameters (the territory with most statements, the entity in most statements, the entity with most audits). `EXPLAIN (ANALYZE, BUFFERS)`, warm second run, baseline and prototype run back to back on an idle server. Numbers under 10 ms jitter by 30 to 50 %.
- Result sets of every rewritten query were md5-compared to the baseline: identical.
- Prototype DDL: `docs/postgres-columns-prototype.sql` (applied to a clone, options a and c together). Timescale trial on a second clone.

## 1. Where jsonb costs us

Baseline, ms, 1M audits:

| group | query | ms | why |
|---|---|---|---|
| audits | `lastNFor` / `firstFor` by (scope, modelId) | 2471 / 5.5 | planner walks `audits_date` backward and filters 840k rows: a missing index, not jsonb |
| audits | `countByBucket` week by type, one year | 1341 | bitmap scan then heap read of 234k docs to extract three fields, external sort |
| audits | `countByBucket` month by type and user, all rows | 4654 | same, over every row |
| audits | `countByBucket` for 200 entity ids (explore stats) | 147 | bitmap on (scope, modelId) then heap |
| audits | `page` from date / `onDate` | 1647 / 361 | `left(doc->>'date',10) \|\| 'T00:00:00.000Z'` matches no index, full scan |
| audits | `byTypeAndUser` | 254 | returns 174k documents and sorts them; dominated by the payload |
| audits | `entityScopedInRange` one month | 41 | fine |
| entities | statements by territory, by entity, by prop, by reference (gin), territories, children | 0.6 to 5.6 | fine |
| entities | label regex search, all classes | 53 | regex over every label; needs a trigram index, not columns |
| relations | `forEntities`, `byType` | 0.8 to 2.4 | fine |
| documents | `listMeta`, `byEntityIds` (`doc - 'content'`) | 8 to 9 | detoasts the 2 MB content to drop it; 8 rows |
| explore | `SUT:`, `I_IS:`, base node | 0.6 to 5.6 | indexed |
| explore | `I_IS:S` pinned subject, `IS:S`, `I_IS:A1` by class | 24 / 12 / 18 | `jsonb_array_elements` over every statement's actants |
| explore | `R:CLA` pinned, by class; `R:SYN` partners | 10 / 13 / 59 | relation gin plus `entityIds` array reads |
| explore | `EP:T` metaprop, `SP:T` in-statement prop | 8 / 33 | props scan; the `SP:` collect uses jsonpath over all statements and bypasses the gin |

So jsonb is a real cost only where a query touches many rows to read a few small fields: the audit aggregations. Point lookups are index-bound on either representation.

## 2. Options, per table

### (a) STORED generated columns from `doc`

`doc` stays the source of truth; `jsonb_deep_merge`, inserts, replay and the contract suite are untouched. Only index definitions and the read SQL that must match them change. Measured on the prototype (`indexfix` = expression indexes only, no columns):

| query | jsonb | jsonb + better index / range rewrite | generated columns |
|---|---|---|---|
| `lastNFor` | 2471 | 0.8 | 0.3 |
| `countByBucket` week by type, one year | 1341 | 1868 (no index-only scan possible) | 53 (index-only scan, 0 heap fetches) |
| `countByBucket` month by type and user, all | 4654 | 4559 | 211 (index-only over 1.07M tuples) |
| `countByBucket` 200 entity ids | 147 | 148 | 62 |
| `page` from date | 1647 | 4.2 | 0.1 |
| `onDate` | 361 | 31 | 0.8 |
| `byTypeAndUser` (174k docs) | 254 | 590 | 349 (payload-bound, noise) |
| `entityScopedInRange` | 41 | 217 | 26 |

The index-only scan is the point: PostgreSQL 17 never treats an expression index as covering because the query still references `doc`, checked with `VACUUM` and a full visibility map. Only real columns get there.

On entities the same mechanism (`class`, `status`, `territory_id`, `parent_id`) gives 0.6 to 2 ms wins (`X12` 5.6 to 2.4, `X01` 0.6 to 0.2). Correct but not worth a table rewrite on its own.

### (b) Real columns plus a slimmer `doc`

Rejected. The scalar part is about 200 B of a 1.2 KB audit (`changes` is the rest) and about 350 B of a 750 B entity (`data`, `props`, `references` are the rest), so splitting it out slims almost nothing. The write path would have to split every patch into columns and jsonb and reassemble rows on every read, `jsonb_deep_merge` would need a column-aware twin, and the contract suite would be testing two representations. Option (a) gives the same read plans with none of that. The one place (b) has a case is `documents.content` (99 % of the document), and only if the table grows past a few hundred rows.

### (c) Child tables for nested arrays

Prototyped as five tables filled by `AFTER INSERT OR UPDATE OF doc` triggers (statement actants, statement actions, in-statement props flattened three levels, entity metaprops four levels, relation entityIds), see the prototype file. Explore edges rewritten to them:

| edge | jsonb | child tables |
|---|---|---|
| `I_IS:S` pinned subject | 24 | 0.8 |
| `I_IS:A1` any Person | 18 | 5.4 |
| `IS:S` subjects of any statement | 12 | 2.0 |
| `R:CLA` pinned concept | 10 | 5.0 |
| `R:CLA` any Concept | 13 | 24 (regression: the child row has no relation `type`) |
| `R:SYN` partners | 59 | 35 |
| `EP:T` metaprop type | 8 | 4.5 |
| `SP:T` in-statement prop type | 33 | 1.4 |
| `byIndex` StatementDataProps / PropsRecursive | 1.5 / 5.6 | 2.4 / 8.9 (no better than the gin) |

Costs: 27 MB of tables and indexes, 12 to 25 touched edge predicates (about 150 to 250 lines in `query/edges.ts`), a plpgsql sync per table, and every statement save deletes and reinserts its child rows: 1000 single-row statement updates went from 339 ms to 470 ms (`updatedAt` only) and 357 to 537 ms (territory order), plus 40 to 50 %. The edges it speeds up cost 10 to 60 ms today on 4 406 statements. The cost is linear in statements, so this becomes worth revisiting when a project holds an order of magnitude more statements (at 50k statements the actant scan would be around 250 ms per edge). Not now.

### (d) Timescale hypercore / columnstore on audits

Trialled on a clone: hypertable by `ts`, 3-month chunks, every chunk converted to columnstore.

| | size | `lastNFor` | week by type | month by type+user | get by id |
|---|---|---|---|---|---|
| jsonb baseline | 1.36 GB | 2471 | 1341 | 4654 | ~1 |
| hypertable, rowstore, columns + btree | 1.62 GB | 5.5 | 30 | 164 | 1.3 |
| columnstore, segmentby `type, "user"` | 0.20 GB | 23 | 26 | 148 | 8.6 |
| columnstore, segmentby `audit_scope, model_id` | 0.26 GB | 14 | 38 | 254 | 41 |

It fits mechanically: append-only, time-ordered, 6 to 8x compression, inserts into a compressed chunk work, a delete decompresses one batch (50 ms). But the price is paid in the adapter contract: a generated column cannot be the partition key, so the adapter must supply `ts` on every insert; the primary key becomes (`id`, `ts`), so `id` stops being unique and `ON CONFLICT (id)` fails; indexes vanish on compressed chunks; compression needs background workers or manual calls. It buys about 1.2 GB of disk and nothing in speed over plain columns on a plain table. Say no unless disk or time-based retention becomes a requirement.

### Per-table recommendation

| table | recommendation |
|---|---|
| audits | (a): five generated columns, indexes (`audit_scope`, `model_id`, `date`), (`date`, `type`, `"user"`), (`type`, `"user"`); drop the three expression btrees; keep the relation-entityIds gin. Rewrite `AUDIT_DAY` users as ranges. |
| entities | keep jsonb and the expression and gin indexes. Optionally add `class`, `status`, `territory_id`, `parent_id` in the same release since the plumbing is shared; the gain is small. Child tables: revisit at 10x the statements. |
| relations | keep. |
| documents | keep; if the table grows, move `content` to its own column (the only (b) case). |
| stats_materialized_* | keep (0.3 ms). |
| users, acl, settings, saved_queries, sessions | keep. |

## 3. Costs of the recommended change (audits)

- **Row size and TOAST**: five text columns add about 80 B per row; the audits heap grew 978 to 1107 MB (+13 %) and TOAST 369 to 412 MB after the rewrite. Index size fell 131 to 106 MB (three column btrees replace three expression btrees). Database total +11 % with the entity columns and child tables included; audits alone about +9 %.
- **Write amplification**: 1000 single-row audit inserts in the adapter's form went 251 to 313 ms (+25 %, 0.3 ms per insert). No triggers involved.
- **DDL time**: `ALTER TABLE audits ADD COLUMN ... STORED` x5 in one statement rewrote 1.07M rows in 24 s under ACCESS EXCLUSIVE, needing twice the table's disk during the rewrite. Indexes 3.3 s.
- **Parity with RethinkDB**: unchanged. Reads still return `doc`; the generated columns never leak (`docs()` / `firstDoc()` return `row.doc`, no `SELECT *` exists in adapter, seeder, storage-diff or replay). The RethinkDB adapter, the contract suite and the replay keep working as they are; only `postgres/sql.test.ts` pins SQL text that changes.
- **Adapter code**: about 80 to 100 lines. `provision.ts`: a per-table generated-column list in `ddl()`, the three audit btrees spelled with column names (the `btree()` helper and `indexPredicate` / `indexHolds` already splice `columns` verbatim, so they need no change), a drop list for the old expression indexes. `tables.ts` audits store: `AUDIT_DAY`, `bucketSql`, `countByBucket` (the dynamic `doc->>field` groupBy needs a field-to-column map), `byTypeAndUser`, `entityScopedInRange`, `relationAuditsForEntity`, `earliestDate`, `page`, `onDate`. `catalogue.test.ts` only compares index names and kinds, so names stay; the `EXTRA_INDEXES` pin on the last DDL statements must keep holding, so any new statements go before them.
- **Gotchas found**: generation expressions must be IMMUTABLE (`->>` chains are, a `::timestamptz` cast is not, so `date` stays ISO text as in the document, which sorts and ranges correctly); `"user"` must be quoted everywhere; dropping an expression index silently regresses any query still written against `doc->>...` (an untouched explore edge went 5 to 23 ms when a statement-territory index was dropped in the prototype), so column rewrites and index drops ship in one change; `LIMIT` without `ORDER BY` can return different rows when an index changes.

## 4. Migration path

Production still runs RethinkDB, so the main cutover (`pnpm -C packages/database migrate`) builds a fresh PostgreSQL schema through the same `provision()` the seeder, the tests and the replay use. New DDL in `ddl()` is picked up automatically; the storage diff compares `doc` and index keys only.

For PostgreSQL databases that are already live (the sandbox), there is no in-place upgrade mechanism today: the only boot hook is `assertRequiredIndexes`, which checks `pg_indexes` and re-creates `jsonb_deep_merge`. Steps:

1. Add an idempotent `upgradeSchema()` next to `provision()` (`ADD COLUMN IF NOT EXISTS ... GENERATED ALWAYS AS ... STORED`, `CREATE INDEX IF NOT EXISTS`, `DROP INDEX IF EXISTS` for the old expression btrees), run from `assertRequiredIndexes` at boot or as a database job like `ensure-indexes.ts`; one `ALTER TABLE` with all columns so the table is rewritten once.
2. Ship the adapter rewrite and the index change together; run `pnpm -C packages/server test:pg`, `test:contract:pg`, `PG_PORT=5433 pnpm -C packages/server replay --adapter=postgres`, `pnpm test` on RethinkDB, and `seed:check` against a local env.
3. Operate: expect about 40 s of ACCESS EXCLUSIVE per million audits (measured end to end with the boot-time sync: one ALTER plus the index swaps) and 2x the audits table in free disk; do it with the API stopped, as the cutover runbook in the database README already requires. `CREATE INDEX CONCURRENTLY` is available if the lock window matters, outside a transaction.
4. Release notes, Deployment section: the job and the disk requirement.

## 5. Also found, independent of this decision

- `audits.page` and `audits.onDate` use `left(doc->>'date', 10) || 'T00:00:00.000Z'`, which no index can serve; the same predicates as a half-open range on `doc->>'date'` already use `audits_date` (1647 to 4 ms, 361 to 31 ms).
- `lastNFor` / `firstFor` / `lastFor` need an index led by (`auditScope`, `modelId`) and ending in `date`; the current two-column index leaves the planner walking `audits_date` backward.
- `SP:T` / `SP:V` / `I_SP:*` collect one prop side with jsonpath over every statement instead of the `StatementDataProps` gin (33 ms per edge on 4.4k statements).
- Label search is a regex over every label (50 ms at 46k entities); a `pg_trgm` GIN over the labels would serve `~` directly.

## Files

- Prototype DDL: `docs/postgres-columns-prototype.sql` (audits and entities generated columns, child tables, triggers).
- Scratch benchmark (not in the repo): `/private/tmp/claude-501/-Users-janci-work-InkVisitor/5d6c6cff-58ea-4b7a-9a82-e56d5d3709d0/scratchpad/bench/` with `bench-jsonb.sql`, `bench-cols.sql`, `params.sql`, `run.sh`, `writeamp.sql`, the Timescale `ts*.sql` files; local scratch databases `jsonb_study` (baseline), `jsonb_proto`, `jsonb_ts` on the compose Postgres at port 5433.
