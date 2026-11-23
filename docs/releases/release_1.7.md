# What's changed [Nov 20, 2026]

InkVisitor now runs on PostgreSQL, which makes loading data faster: Explorer searches, columns and stats return quicker, and Explorer stats count every matching Entity instead of the first 500.

## Explorer

- Several start nodes in one query: each start node has its own conditions and the result is their union (#3270)
- New edge **anchored under T** (`EAT:`): every Entity anchored inside the span of a T's anchor, at any depth, including Entities used in no Statement (#3265)
- Property edges match the type and the value of the same prop; has property and has S prop take a type node and an optional value node, with NOT on the value node (#3383)
- The label filter, UUIDs and Filters moved into a Narrow results row at the bottom of the Query Builder, above an Expand results row with the EQ / SUB toggles and the search button (#3360)
- Node filters: label, language and status (#3360), date created / updated, created / updated / edited by and co-occurrence (#3374)
- Status and language take several values, and logical type and part of speech filters are added, both on nodes and in the Filters panel (#3430)
- Conditions nested under a node narrow that node's own Entities, and a condition nested under a selected Entity without EQ or SUB shows a warning (#3374)
- New nodes start with EQ and SUB on (#3429)
- Invert selection button next to the select-all checkbox (#3444)
- Suggest a name when saving a query (#3384); the Queries button sits in the Query Builder header
- Query results are no longer cached for 5 minutes, so edits show in the next search (#3374)
- Fixed nested relation pickers taking their allowed classes from the root instead of their own source node (#3270)
- Fixed query export shifting cells left when a Created by or Parent Territory value was missing (#3450)
- The Entity open in Detail refreshes after an Explorer batch action

## Annotator

- Suggester lists up to 10 Entities used in the Statements anchored around the selection first, then those of the subT and parent Ts (#3413)
- An anchor of an Entity in another language than the user's default source language is created as inferential, with a toast, and sequential anchoring asks first (#3255)
- Text and XML can be edited in the Documents page annotator by users who may manage the document; Esc closes one layer at a time instead of the whole document (#3321, #3322)
- The Annotator mode is kept when the Territory changes within the same document (#3326)
- Hovering the closing tag of an asymmetrical anchor shows the Entity tag (#3435), and the full Entity tag shows on hover in XML mode
- Highlighting and select-all are fast on large documents (select-all on a 6,400-paragraph document went from ~8.6 s to ~21 ms per frame)
- Search terms are capped at 200 characters, so searching a whole selected document no longer crashes the page
- Ctrl+Cmd shortcuts are left to macOS (e.g. Ctrl+Cmd+F full screen)
- Document titles keep their end visible on the Documents page and in the document modal

## Statement Editor

- New Detail section with the detail field, status, label language, Relations and metaprops of the Statement (#3315)
- Suggesters list the Entities anchored around the Statement first, up to 10 per class (#2033)
- Statement Anchors are paged, 5 per page
- Fixed the language check reading an empty field, so every linked Entity got the language toast and the inferential elvl (#2033)
- Re-linking an Entity in an existing actant row keeps its position (#3380)
- Copying a section from another Statement confirms what was copied
- New mood: accusation (#3388)
- The reference and delete batch actions in the Statement list confirm with a toast, and rows no longer flicker at the scroller edge

## Other improvements and fixes

- Label search treats quote marks and apostrophes as interchangeable, finds Czech accented letters from plain ones (`temer` finds `Teměř`) and reads typed regex characters literally (#3302)
- The Templates filter matches like the Entity suggester (#3328)
- Validation rules can apply only to Entities whose label or alternative label contains a given text (#3290)
- Right click in an empty Entity suggester shows bookmarks and a paste row (#3386)
- New dropdown component replacing react-select (#3183), and native thin scrollbars (#3372)
- Copy all UUIDs of a multi-value Relation and of basic search results (#3331); Audits renamed to Entity audits (#3329)
- Full Entity labels in Detail's inverse relations, protocol, relation audits and used-in Statements (#3440)
- Entity tooltip lists each anchored text once with its count, at most 5 texts
- Relation graph: every direct identification in a cycle is listed, Entities sit at their shortest distance, dark mode, wheel scrolls and Ctrl+wheel zooms, resizable (#3377)
- Error toasts say what failed (no response, timeout, server unavailable, or the server's error) and offer Copy details with a request id (#3381)
- Stats: document audits filter by user, date range and type
- A change of role, password or active state logs the user out, and a forced logout can no longer be undone by a request in flight (#3316)
- Only owners and admins change user rights
- Fixed removing one of several anchors of an Entity in Detail duplicating document text (#3443)
- Fixed removing an anchor in Detail leaving the stored anchor tree stale (#3451) and the Editor, Statement list and Detail tab showing the removed anchor (#3454)
- Fixed a closing tag ending whatever anchor was open last, which cut anchors around markup such as `<hi>` short (#2033)
- Fixed Statements anchored many times failing to load (500)
- Fixed server start re-saving documents without anchors (#3431)

## Development (Technical)

- Storage boundary with RethinkDB and PostgreSQL adapters, an API replay harness and a Playwright smoke suite, run on both adapters (#3256)
- oxlint replaces ESLint and TSLint (#3300); pull requests are linted, typechecked and tested in CI (#3350)
- Explorer columns are read once per page instead of once per row (100 rows, 6 columns: 362 database statements to 6) (#3412)
- Tooltip anchors are grouped on the server (a Territory tooltip went from 379 KB to 10 KB); created / updated at filters, Territory validation ties and tooltip relations load in fewer queries (#3361, #3354, #3348)
- New `GET /entities/:entityId/used-relations`, open to every logged-in user
- CONTEXT.md glossary of the research team's vocabulary (#3287)

## PostgreSQL (Technical)

- InkVisitor runs on PostgreSQL as well as RethinkDB, chosen with `DB_ADAPTER`; RethinkDB stays the default (#3256)
- `pnpm migrate` moves a RethinkDB database into PostgreSQL in one command: it checks the export against the PostgreSQL constraints before touching PostgreSQL, compares row counts and diffs both databases, and replaces nothing until the run is verified (#3358, #3402)
- `fixDuplicateRowsJob` removes duplicate relations and acl_permissions rows and blanks dangling document and template references, so the migration adds the constraints on the first try; `migrate --skip-duplicates` migrates a dump that still has them (#3357, #3396)
- Foreign keys on the territory, parent and user references, and unique constraints on relations, users and acl_permissions (#3345, #3356)
- The schema is brought up to date at every server start (#3334)
- Nightly backup script `backup-pg.sh`, writing into the same archives with the same retention as the RethinkDB backup (#3397)
- The Explorer stats limit of 500 Entities applies on RethinkDB only (#3428)
- Faster Explorer queries: selected targets read through the indexes (#3282), and SYN and the other unordered relation edges run 8-30x faster (#3343)
- A write blocked by a held row lock gives up after 10 s instead of waiting forever and starving the connection pool (#3405)

## Deployment

- Node 22.23.4 or newer is required (CVE-2026-111497); the Docker image builds on the official `node:22-alpine` (#3332)
- docker-compose: the `database` service is renamed `rethinkdb` (container `inkvisitor-rethinkdb`), and a `postgres` service is added
- After the deploy, run `cancelPasswordResetLinksJob` once on every environment (`J` in the database app), with `--target=both` on an instance already on PostgreSQL so the RethinkDB copy kept for a rollback is covered too
- After the deploy, on every environment, rebuild the stored anchor trees: `ENV_FILE=<env> pnpm -C packages/server rebuild-anchors --dry-run`, then the same without `--dry-run` (#2033, #3451)
- Once an instance runs a server with #3399, run `removeDeadUserOptionsJob` on it (`J` in the database app), with `--target=both` on an instance already on PostgreSQL so the RethinkDB copy kept for a rollback is cleaned too. An older server writes `hideStatementElementsOrderTable` again on every user it creates (#3399)
- Switching an instance to PostgreSQL: run `fixDuplicateRowsJob` ahead of time, stop the API, run `pnpm -C packages/database migrate --db=<name> <env>` and check for `databases match`, then set `DB_ADAPTER=postgres` and the `PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASS` block in the server env and start the API. RethinkDB is left untouched for a rollback.
- `migrate --drop` is renamed `--replace`; the replaced database is kept as `<pg>_replaced_<timestamp>` until dropped by hand (#3402)
- PostgreSQL backups run only once the `backup-pg.sh` cron line from the database README is added on each host (#3397)
- A server start whose schema sync waits more than 10 s for a lock (e.g. behind a running `pg_dump`) fails with the lock error; a restart retries it (#3405)
- A blank `APIURL` at client build falls back to the app origin; behind a proxy serving the container under a sub-path, set `APIURL` with the sub-path
