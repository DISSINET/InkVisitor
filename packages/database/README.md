# Database

<<<<<<< HEAD
App uses [rethinkdb](https://rethinkdb.com/) database to store data. Given the nature of models in the project (mostly json-based, schemaless structure with set of in-app conditions), a nosql database provides more pros thans cons. Currently the app uses following tables:
=======
InkVisitor uses [rethinkdb](https://rethinkdb.com/) for storing data. This no-SQL open-source database was considered mainly based on the nature of data models in the project (mostly JSON, schemaless structures with sets of in-app customized conditions).
Currently, the database stores the following collections (tables):
>>>>>>> dev

- **users**
  - user data: login, password, starred territories
- **acl_permissions**
  - consists of rules for accessing resources (endpoints) by different requestors (groups)
  - more fine-grained permissions (ownerships) over entities are defined in respective user entries
- **entities**
  - holds data mentioned in [section](### Entity types).
<<<<<<< HEAD
- relations
  - various implementations of logic between multiple (2-n) entities, ie. synonyms
- audits
  - log entries for changes made to entities table
  - each entity entry has 0-n audit entries
- documents
  - large blobs of text data with encoded tags for referencing entities

Project uses several environments and each of them has dedicated database namespace (`inkvisitor`, `inkvisitor_staging` etc).
=======
- **relations**
  - various implementations of logic between multiple (2-n) entities, ie. synonyms
- **audits**
  - log entries for changes made to the entities table
  - each entity entry has 0-n audit entries
- **documents**
  - large blobs of text data with encoded tags for referencing entities

The project uses several environments (`./env/X.env`) and each of them has a dedicated database namespace (`inkvisitor`, `inkvisitor_staging` etc). The database can be run in two possible ways - 1) inside the docker or 2) as a separate process / service.
>>>>>>> dev

### 1) Run inside docker (recommended)

Rethinkdb can be run as a containerized instance. Installed [docker](https://docs.docker.com/get-docker/) + [docker [compose](https://docs.docker.com/compose/install/) are requirements.
Run `docker-compose up -d database` from the root directory.

### 2) Install & run as a separate service

Follow tutorials on [the official page](https://rethinkdb.com/docs/install/).

## Initialization

<<<<<<< HEAD
Database main script is built as `CLI` application which will guide you through the import process.
Run `pnpm start` to run the app and by entering respective `key` from the menu choose the desired action.

Before you start, copy [.env.example](packages/database/env/.env.example) into your local [.env](packages/database/env/.env) file and fill variables inside (`SSH*` optional).

Import example (this will remove and import the database anew):
- If prompted whether to use `SSH connection`, use `n` + `<enter>` to stay in local environment
- choose dataset by entering `D` + `<enter>`, then choose one of the datasets by entering respective number or name (ie. `1`), confirm with `<enter>`
=======
The database main script is built as `CLI` application which will guide you through the import process.
If you are running the import for the first time, make sure all the packages are installed by typing `pnpm i`. Then, run `pnpm start` in this folder to run the app and by entering the respective `key` from the menu choose the desired action.

Before you start, copy the [`.env.example`](packages/database/env/.env.example) into your local [.env](packages/database/env/.env) file and fill variables inside (`SSH*` variables are optional).

Import example (this will remove and import the database anew):

- if prompted whether to use the **SSH connection**, use `n` + `<enter>` to stay in the local environment
- choose dataset by entering `D` + `<enter>`, then choose one of the datasets by entering the respective number or name (ie. `1`), confirm with `<enter>`
>>>>>>> dev
- use `X` + `<enter>` to run the import

### Importing locally / remotely

To switch between local -> remote hosts, just provide `SSH*` variables. If provided successfully, you will be prompted to confirm that you are connecting via an SSH tunnel.

### Jobs

<<<<<<< HEAD
You can run specialized jobs by typing `J`. These jobs are single purpose actions, ie. fixing bad import dates.

=======
You can run specialized jobs by typing `J`. These jobs are single purposes actions, ie. fixing bad import dates.
>>>>>>> dev

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
