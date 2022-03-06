# Database
Inkvisitor project uses several environments and each of them has dedicated database namespace.

For this we are using nosql db - [rethinkdb](https://rethinkdb.com/) instance.

## Initialization
For creating base schema, please use [import.ts](./scripts/import.ts) script. Usage:
- `npm run import-local` etc

Warning: this script will remove all tables and recreates them with basic mock data.

# Backup
`rethinkdb` comes with `rethinkdb-dump` tool, which creates snapshot according to provided arguments. Normally you would need to call this tool periodically in `crontab`. You can use script [backup.sh](./scripts/backup.sh) for this, which do the following:
- delete outdated backup files older than 3 days but keep files for first day of each month
- run in cycle for each database (names are provided in named array) and create snapshot with name `backup_YYYY_MM_DD_DBNAME.tar.gz

Cron can be setup like:
- `crontab -e`
- add line `0 0 * * * <path to sh script> >> <path to logfile> 2>&1` 