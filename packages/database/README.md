# Database

App uses [rethinkdb](https://rethinkdb.com/) database to store data. Given the nature of models in the project (mostly json-based, schemaless structure with set of conditions), a nosql database provides more pros thans cons. Currently the app uses following tables:

- users
  - user data: login, password, starred territories
- acl_permissions
  - consists of rules for accessing resources (endpoints) by different requestors (groups)
  - more fine grained permissions (ownerships) over entities are defined in respective user entries
- entities
  - holds data mentioned in [section](### Entity types).
- audits
  - log entries for changes made to entities table
  - each entity entry has 0-n audit entries

Project uses several environments and each of them has dedicated database namespace.

## Run in docker (recommended)

Rethinkdb can be run as containerized instance. Installed [docker](https://docs.docker.com/get-docker/) + [docker compose](https://docs.docker.com/compose/install/) are prerequirements.
Run in by `docker-compose up -d inkvisitor-database` from the root directory.

## Install & run on machine

Follow tutorials on [official page](https://rethinkdb.com/docs/install/)

## Initialization

Warning: the following script will remove all tables and recreates them with basic mock data!

For creating base schema with mock data, please use [import.ts](./scripts/import.ts) script. Usage: `pnpm import-<suffix>`. Each import run task calls `import.ts` script with
arguments `dataset name` and `env name`.

`dataset` identifies the configuration - which file to import, which indexes to prepare, how to transform data before importing.
`env` identifies set of environmental variables stored in [env](./env) directory in appropriate files. For creating your own environment or to supply predefined, just copy [.env.example](./env/.env.example) file to `.env.<env name>` and fill in variables.

### Importing locally / remotely

To switch between local -> remote host, just provide `SSH*` variables. If provided successfully, you will be prompted to confirm that you are in fact connecting via ssh tunnel.

### Example usage

- `pnpm import:remote`
- `pnpm import:remote-data-import`
- etc

Then, follow the instructions in the command line.

### Jobs

- You can run specialized jobs by typing "J":
  - **restore dates**
  - **print deleted entities**

## Backup

### Datasets

In [datasets](./datasets) directory you can find different groups of import data. Respective files are referenced in scripts.
For common data (acl entries/users), you can use files stored in [default](./datasets/default) directory.

# Backup

`rethinkdb` comes with `rethinkdb-dump` tool, which creates snapshot according to provided arguments. Normally you would need to call this tool periodically in `crontab`. You can use script [backup.sh](./scripts/backup.sh) for this, which do the following:

- delete outdated backup files older than 3 days but keep files for first day of each month
- run in cycle for each database (names are provided in named array) and create snapshot with name `backup_YYYY_MM_DD_DBNAME.tar.gz`

Cron can be setup like thisTo be sure:

- `crontab -e`
- add line `0 0 * * * <path to sh script> >> <path to logfile> 2>&1`

## Gcloud

To be sure our backup files are stored securely, we can use some cloud storage.
To keep it simple, we are using gcloud and a free tool - [rclone](https://rclone.org/).
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
