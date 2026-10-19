# Database

InkVisitor uses [rethinkdb](https://rethinkdb.com/) for storing data. This no-SQL open-source database was considered mainly based on the nature of data models in the project (mostly JSON, schemaless structures with sets of in-app customized conditions). Since #3256 the same datasets can be seeded into PostgreSQL (`--target=postgres`, see Targets below), which the server uses with `DB_ADAPTER=postgres`; RethinkDB remains the default.
Currently, the database stores the following collections (tables):

- **users**
  - user data: login, password, starred territories
- **acl_permissions**
  - consists of rules for accessing resources (endpoints) by different requestors (groups)
  - more fine-grained permissions (ownerships) over entities are defined in respective user entries
- **entities**
  - holds data mentioned in [section](### Entity types).
- **relations**
  - various implementations of logic between multiple (2-n) entities, ie. synonyms
- **audits**
  - log entries for changes made to the entities table
  - each entity entry has 0-n audit entries
- **documents**
  - large blobs of text data with encoded tags for referencing entities

The project uses several environments (`./env/X.env`) and each of them has a dedicated database namespace (`inkvisitor`, `inkvisitor_staging` etc). The database can be run in two possible ways - 1) inside the docker or 2) as a separate process / service.

### 1) Run inside docker (recommended)

Rethinkdb can be run as a containerized instance. Installed [docker](https://docs.docker.com/get-docker/) + [docker [compose](https://docs.docker.com/compose/install/) are requirements.
Run `docker-compose up -d database` from the root directory.

### 2) Install & run as a separate service

Follow tutorials on [the official page](https://rethinkdb.com/docs/install/).

## Initialization

The database main script is built as `CLI` application which will guide you through the import process.
If you are running the import for the first time, make sure all the packages are installed by typing `pnpm i`. Then, run `pnpm start` in this folder to run the app and by entering the respective `key` from the menu choose the desired action.

Before you start, copy the [`.env.example`](packages/database/env/.env.example) into your local [.env](packages/database/env/.env) file and fill variables inside (`SSH*` variables are optional).

### Targets

The seeder writes to RethinkDB by default. `--target=postgres` writes the same dataset into the PostgreSQL instance from the `PG_*` variables instead, `--target=both` writes it into both (same rows, same ids), e.g. `pnpm start --target=both`. `DB_TARGET` in the env file sets the default; the command line flag wins. PostgreSQL gets one jsonb table per RethinkDB table with matching indexes; the schema lives in `packages/server/src/service/storage/postgres/provision.ts` next to the RethinkDB index list. The server selects its backend with `DB_ADAPTER` (see `packages/server/env/example.env`); a database seeded with `--target=postgres` under the same name is what `DB_ADAPTER=postgres` expects.

### Non-interactive seeding, storage diff and the seed check

- `pnpm seed --db=<name> --dataset=<name> [--target=rethinkdb|postgres|both] [env]` drops, recreates and imports without prompts.
- `pnpm storage:diff --db=<name> [--pg=<name>] [--no-indexes] [env]` compares a RethinkDB database with a PostgreSQL database: row counts, missing and extra ids, a document diff naming the first differing path, and the keys every index would hold. Exits 1 on any difference.
- `pnpm seed:check [--datasets=a,b] [--all] [--no-indexes] [env]` seeds every dataset into `inkvisitor_seedcheck` on both backends and diffs them. Datasets with a file above 100 MB run only with `--all`.
- `pnpm test` runs the unit checks of the pure helpers (`node:test`, no database).

The optional `[env]` picks `env/.env.<env>`; with nothing given `env/.env` is used.

Import example (this will remove and import the database anew):

- if prompted whether to use the **SSH connection**, use `n` + `<enter>` to stay in the local environment
- choose dataset by entering `D` + `<enter>`, then choose one of the datasets by entering the respective number or name (ie. `1`), confirm with `<enter>`
- use `X` + `<enter>` to run the import

### Migrating a RethinkDB database to PostgreSQL

`pnpm migrate --db=<name> [--pg=<name>] [--out=<dir>] [--drop] [--no-diff] [env]` moves one RethinkDB database into PostgreSQL. The `DB_*` variables of the env file name the source instance, the `PG_*` variables the target instance (`PG_NAME` is replaced by `--pg`, which defaults to the RethinkDB name, the name `DB_ADAPTER=postgres` then expects). Four steps:

1. every catalogue table is exported into `datasets/<out>/<table>.json` (`--out` must be a plain name starting with `export-`, default `export-<db>-<date>`; such directories are git-ignored) in the format `rethinkdb export` writes, so it is a raw dataset for `pnpm seed`, for the interactive app and for a restore into RethinkDB with `--target=rethinkdb`;
2. the PostgreSQL database is created with the schema; an existing one is refused unless `--drop`;
3. the export is imported through the seeder;
4. both databases are compared like `storage:diff` does, with index key parity; `--no-diff` skips it.

RethinkDB is only read. Sessions are not copied: the server creates its table at boot and users sign in again. RethinkDB tables outside the catalogue are listed and left behind; a catalogue table missing in RethinkDB comes up empty. The command exits 1 when a row was refused or the diff found a difference. The diff evaluates every RethinkDB index function row by row where a page of rows raises, so a malformed document (a string where the function expects an array) is compared as the row the index leaves out, not as a crash. A re-import of an existing export is `pnpm seed --db=<name> --dataset=<out> --target=postgres [env]`.

Measured on the 2025-11-22 production dump (45979 entities, 153425 audits, 228546 rows in all, a 379 MB export) on a laptop: export 9 s, import 32 s, diff 32 s, 73 s in all, with the process peaking at about 0.5 GB of memory.

Cutover: stop the API so nothing writes, run the migration with the deployment env file, check for `databases match`, set `DB_ADAPTER=postgres` and the `PG_*` block in the server env, start the API. RethinkDB stays untouched for a rollback; the export directory is the snapshot of that moment.

### Importing locally / remotely

To switch between local -> remote hosts, just provide `SSH*` variables. If provided successfully, you will be prompted to confirm that you are connecting via an SSH tunnel.

### Jobs

You can run specialized jobs by typing `J`. These jobs are single purposes actions, ie. fixing bad import dates.

### Direct import scripts (DEPRECATED)

- `pnpm import:remote`
- `pnpm import:remote-data-import`
- etc

## Backup

### Datasets

In the [datasets](./datasets) directory, you can find different groups of import data. Respective files are referenced in scripts.
For common data (acl entries/users), you can use files stored in [default](./datasets/default) directory.

# Backup

`Rethinkdb` comes with the `rethinkdb-dump` tool, which creates a snapshot according to the provided arguments. Normally you would need to call this tool periodically in `crontab`. You can use script [`backup.sh`](./scripts/backup.sh), which does the following:

- deletes outdated backup files older than 3 days but keeps files for the first day of each month
- runs in cycle for each database (names are provided in the named array) and creates a snapshot with name `backup_YYYY_MM_DD_DBNAME.tar.gz`

Cron can be set like this:

- `crontab -e`
- add line `0 0 * * * <path to sh script> >> <path to logfile> 2>&1`

## Google Cloud

To be sure our backup files are stored securely, we can use some cloud storage.
To keep it simple, we are using `gcloud` in combination with a free tool - [rclone](https://rclone.org/).
Sync it like `rclone sync archives remote:inkvisitor-backup` - see [sync.sh](./sync.sh) script, which could be also called with cron.

## Generating import data

TODO

# Neo4j

Deployment files are stored in `$APPS_DIR/neo4j`:

- `docker-compose.yml` for easier containerized deployment using `podman-compose` utility
- `plugins` dir for optional plugins, namely [APOC](https://neo4j.com/developer/neo4j-apoc/)

Container uses 2 volumes by default:

- neo4jdata (`/data-disks/dbds/neo4j`) for core db data, mounted in `/data` directory inside the container
- neo4jplugins (`$APPS_DIR/neo4j/plugins`) for plugins, mounted in `/plugins` directory inside the container

These volumes should not be removed, but if required, use `podman volume rm <name>`, where name is hashed string (podman does not work with named volumes as required). To retrieve info about volume, use `podman volume list` and `podman volume inspect <name>` to retrieve details.

## Run & Stop

`podman-compose up -d neo4j`
`podman-compose stop neo4j` + `podman container prune` (optional)

Don't remove

## Web app

Use `http://<machine ip>:7474/browser/`. Default user is `neo4j`.

# Load production data

- dump production JSONs following the guide in the private repo
- load the JSONs into pre-prepared local database using cli `rethinkdb import -c localhost:32769 -f relations.json  --table test.relations --format json --force`
-
