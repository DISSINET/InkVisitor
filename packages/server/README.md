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
- `pnpm test:unit` — fast unit tests only; **no database required** (runs in parallel).
- `pnpm test:integration` — only the database-backed tests (serial).
- `pnpm test -t "<name>"` — only tests whose `describe`/`it` name matches the pattern.

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

The API uses HttpOnly cookie sessions stored in RethinkDB. Sign in via `POST /users/signin` with `{ "login", "password" }`; the response includes the user profile and the server sets the session cookie. Sign out via `POST /users/signout`.

### Session cookies

- **Name** — `inkvisitor.sid.<ENV>` by default (`SESSION_COOKIE_NAME` to override). Set a unique `ENV` per instance when several deployments share a domain so cookies do not overwrite each other.
- **Flags** — `HttpOnly`, `SameSite` (default `lax`), `Secure` when `NODE_ENV=production` or `HTTPS=1`, path `/`.
- **Storage** — RethinkDB session store; rolling expiry via `SESSION_MAX_AGE` (default 30 days).

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
