# Server package

The application located in /packages/server is the api for inkVisitor project.
It uses express + express router as a base.

Server supports different enviroments - supported by `.env-<ENV_FILE>` files, which are governed by `ENV_FILE` environmental variable.

### Env variables

See [example.env](./env/example.env) file for description of variables.

## Development

You would normally use default `development` environment - run in nodemon context for livereload using default `start` command for consistency across packages.

1. `pnpm install`
2. `pnpm start`

## Test

Tests run against a **dedicated, disposable test database** — never your
development data. The suite refuses to run unless `DB_NAME` names a test
database (it must match `^iv_test_`, `_test$`, or `^test_`, e.g. `inkvisitor_test`).

1. Create an `env/.env.test` file with `NODE_ENV=test`, a test `DB_NAME`
   (e.g. `inkvisitor_test`), and `DB_HOST`/`DB_PORT` pointing at a reachable
   RethinkDB. See [example.env](./env/example.env).
2. The suite provisions a fresh ephemeral database (tables + indexes + a seeded
   admin) before each run, drops it afterwards, and resets state before each
   test file — so runs are isolated and repeatable.

Commands (via `jest`):

- `pnpm test` — the full suite (unit + integration), run serially. Needs RethinkDB.
- `pnpm test:pg` - the same suite on the PostgreSQL adapter (the ReQL suites under `src/service/storage/rethink/` are skipped there). Needs the `postgres` container; `env/.env.test` carries the `PG_*` block.
- `pnpm test:unit` — fast unit tests only; **no database required** (runs in parallel).
- `pnpm test:integration` — only the database-backed tests (serial).
- `pnpm test -t "<name>"` — only tests whose `describe`/`it` name matches the pattern.

PostgreSQL gates, each against a throwaway database only. The commands run from the repository root; `<host port>` is the PostgreSQL container's host port, 5432 by default in `docker-compose.yml` and 5433 when that port is overridden, for example on a machine where 5432 is taken:

- `pnpm -C packages/server test:pg` - full server suite on PostgreSQL; `pnpm -C packages/server test:contract:pg` - the storage contract suite, the search/explore behaviour suite and the harness smoke test only (fast loop).
- `pnpm -C packages/server replay` and `PG_PORT=<host port> pnpm -C packages/server replay --adapter=postgres` - the API replay (437 recorded steps) on either adapter; zero differences expected on both. Never `--record` on PostgreSQL.
- `pnpm -C packages/database seed:check` - seeds every dataset into both backends and diffs them (`--all` includes the heavy datasets).
- `pnpm -C packages/client test:e2e` and `PG_PORT=<host port> DB_ADAPTER=postgres pnpm -C packages/client test:e2e` - the Playwright frontend smoke suite (login, territory tree, statement editing, entity detail, search, explorer, users, global validations) against a server booted on `inkvisitor_smoke_test`, ports 3301 (API) and 8301 (vite). Once per machine: `pnpm -C packages/client exec playwright install chromium`.
- `pnpm -C packages/database migrate --db=<name> <env>` - moves an existing RethinkDB database into PostgreSQL (export, schema, import, diff); see the database README.

Known differences on malformed rows (the PostgreSQL adapter stays lenient where RethinkDB raises or silently drops a row; each is pinned by an `itPg` case in the contract suites):

- `labelOrId` finds an entity without `labels` by id prefix; RethinkDB skips it.
- A statement without `data.actions` or `data.tags` is in the PostgreSQL statement indexes; RethinkDB's index bodies leave it out (`I_IS:` with or without a class).
- `IS:A` without a target and `I_HR:R` without a pinned target answer on PostgreSQL; RethinkDB raises on a statement without actions or an entity without `references`.
- `haveReferenceTo` over a string `references` is no match on PostgreSQL and a 500 on RethinkDB.

The raw `20251122` dataset holds 5 audit rows nested deeper than RethinkDB's 20-level limit; RethinkDB rejects them ("Nesting depth limit exceeded") and PostgreSQL stores them, so `seed:check --all --datasets=20251122` reports 5 dropped rows on the RethinkDB side and skips the diff for that dataset.

Unpinned residuals, listed for completeness: an action without an `actionId` key (RethinkDB drops the statement, PostgreSQL matches through another action); `data.actions` stored as an object (a lax path wraps it); `IS:S/A1/A2/PS` and unconstrained `CT:`/`CT:D` raise on RethinkDB for statements without `data.actants` or territories without `data`; `labelsOf` returns `{id}` on PostgreSQL for `labels: null` where RethinkDB returns `{id, labels: null}`; duplicate seed ids give one row on PostgreSQL and two on RethinkDB; `getMany` drops a repeated id on PostgreSQL where RethinkDB returns it twice.

Known behavioural difference: `GET /documents` is ordered by `createdAt`. On PostgreSQL every date is stored as an ISO string, so the list is chronological. RethinkDB places a native Date before any string, so a document created through the API sorts before the seeded documents, whose dates are strings. That artifact goes away once the data migration (#3256) moves the data to PostgreSQL. The replay compares this list, the users label list and the settings group in id order on PostgreSQL (`pgSort` in `src/replay/requests.ts`).

If you use Visual Studio Code, the `Jest Runner` extension is handy for running
individual tests.

## Build & run

The `build` process transpiles typescript files to javascript.

1. `pnpm build`
2. `ENV_FILE=<env> pnpm start:dist` to run the built application with loaded `.env.<ENV_FILE>` file.

Make sure to have appropriate `.env.<ENV_FILE>` file accessible (e.g., running `ENV_FILE=production pnpm start:dist` will need `env.production`). You can use the `example.env` file as a template for creating your own `env` file, just check and modify the values here if needed:

- `NODE_ENV` = environment - production/development (security vs logging). Also controls the session cookie `Secure` flag (enabled when `NODE_ENV=production`, or when `HTTPS=1`).
- `ENV` = instance identifier (e.g. `sandbox`, `staging`, `production`). Must be unique per deployment on the same domain. Used for the session cookie name (`inkvisitor.sid.<ENV>` by default) and must match the client build mode on that instance.
- `DOMAIN` = hostname where the UI is accessible (used in emails and as the default allowed CORS origin)
- `STATIC_PATH` = http relative path to client files served by the server, use '/' for files hosted in root path
- `BACKUP_DIR` = directory containing the DB backup archives (mounted read-only from the `inkvisitor-backup` PVC in deployments); empty/unset disables the backups API
- `PORT` = port which should be used for this app
- `DB_ADAPTER` = storage backend, `rethinkdb` (default) or `postgres`. `DB_NAME` names the database on either backend. With `postgres` the server's role must own `jsonb_deep_merge` (simplest: seed and run the server as the same role, since replacing an existing function requires ownership) and must have `CREATE` on schema `public`, which the session store needs for its `CREATE TABLE IF NOT EXISTS` and which PostgreSQL 15+ no longer grants to every role. `PG_NAME` in `docker-compose.yml` and the seeder names the database created in the container; the server's `DB_NAME` must name the database the seeder wrote.
- `PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASS` = PostgreSQL connection, used when `DB_ADAPTER=postgres`.
- `SECRET` = signing secret for session cookies and short-lived download tokens
- `SESSION_MAX_AGE` = session cookie max age in milliseconds (default 30 days)
- `SESSION_COOKIE_NAME` = optional override for the session cookie name (default `inkvisitor.sid.<ENV>`; set a unique `ENV` per instance when multiple deployments share a domain)
- `SESSION_COOKIE_SAMESITE` = `lax` (default), `strict`, or `none`
- `CORS_ORIGINS` = comma-separated allowed browser origins (default: derived from `DOMAIN`). Used for CORS and CSRF origin checks.
- `SMTP_HOST` / `SMTP_PORT` = SMTP relay (e.g. Mailjet `in-v3.mailjet.com`, port `587`)
- `SMTP_USER` / `SMTP_SECRET` = SMTP credentials (Mailjet: API key and secret key from the dashboard)
- `MAILER_SENDER` = From address; must match a verified sender at your provider
- `PYTHON_API_HOST` = custom analytics api, optional

## API docs

### Postman

Please refer to exported [postman collection](./postman/inkvisitor_api.postman_collection.json) file to explore the api and available endpoints.

## Authorization

The API uses HttpOnly cookie sessions stored in the selected storage backend (a sessions table on either adapter). Sign in via `POST /users/signin` with `{ "login", "password" }`; the response includes the user profile and the server sets the session cookie. Sign out via `POST /users/signout`.

### Session cookies

- **Name** — `inkvisitor.sid.<ENV>` by default (`SESSION_COOKIE_NAME` to override). Set a unique `ENV` per instance when several deployments share a domain so cookies do not overwrite each other.
- **Flags** — `HttpOnly`, `SameSite` (default `lax`), `Secure` when `NODE_ENV=production` or `HTTPS=1`, path `/`.
- **Storage** — session store of the selected storage backend (a `sessions` table on either adapter); rolling expiry via `SESSION_MAX_AGE` (default 30 days).

### CSRF protection

State-changing API requests (`POST`, `PUT`, `PATCH`, `DELETE` under `/api`) require:

1. The `X-InkVisitor-Client: 1` header (set automatically by the web client).
2. An `Origin` or `Referer` header matching `DOMAIN` or `CORS_ORIGINS`.

Cross-site form posts cannot set the custom header, so they cannot reuse a victim's session cookie. `SameSite=Lax` provides an additional browser-level guard.

Short-lived signed `?token=` query parameters are still used for one-shot backup download URLs where a cookie cannot be sent.

Tests authenticate with `getAuthenticatedAgent()` from `src/modules/testAuth.ts` (cookie jar via supertest agent). CSRF checks are skipped when `NODE_ENV=test`.

## Errors

Server has one handler for unknown routes (wildcard - when the route does not exist) and one generic handler for other errors.
They share common `IResponseGeneric` (@inkvisitor/shared/types/response-generic.ts) interface which is populated by `CustomError` instance (@inkvisitor/shared/types/errors.ts).

Example of erroneous `IResponseGeneric` msg:

```
{
    result: false,
    error: "ActionDoesNotExits",
    message: "action with id 2 does not exist"
}
```

The output above is generated from thrown error like:

```
throw new ActionDoesNotExits(`action with id ${actionId} does not exist)
```

What happens in the error handler (middleware) is that the error is transformed to `IResponseGeneric` by taking values

```
error <= thrownError.constructor.name
message <= thrownError.message
```

`CustomError` respects the generic Error class logic for constructor parameter (message) and using the custom error's name as `name` property
and new static property `code`, which will be used as http status code in the api response.

```
const err = new ActionDoesNotExits(`action with id ${actionId} does not exist)
err.name === "ActionDoesNotExits"
err.statusCode() === 400 | 404 | 500 etc
```

### Handling unexpected errors

Its possible, that the server would encounter an unexpected error, ie. corrupt db handler.
The generic error handler then takes the error instance and will use prepared `InternalServerError` substitution.
While this error could be completely random, the api will return the same generic message. In the handler, however, the logger will print the original error.
