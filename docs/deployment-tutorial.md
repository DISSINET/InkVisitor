# How to deploy your own instance of InkVisitor

This page describes how to deploy a self-hosted instance of InkVisitor. The recommended path is to use **Docker**, which packages the client, server and database into a single workflow. For setups that cannot run containers, the same components can be built and run as individual processes.

This page is the authoritative deployment reference for the project. The repository [README.md](https://github.com/DISSINET/InkVisitor/blob/dev/README.md) only carries a short quickstart and links here.

## Components

InkVisitor consists of three interconnected packages located in `packages/`:

- **client** — React/Vite frontend (static files: HTML/CSS/JS)
- **server** — Node.js + Express API
- **database** — [RethinkDB](https://rethinkdb.com/) plus a CLI tool used to create the database structure and import datasets

The Docker image bundles the client (served as static files by the server) and the server into a single container. The database always runs as a separate service (either containerized RethinkDB or installed natively).

## Prerequisites

Before you start, make sure you have:

- **Docker** + Docker Compose v2 — install instructions: [Docker](https://docs.docker.com/get-docker/), [Docker Compose](https://docs.docker.com/compose/install/). Note: Docker Compose v2 is invoked as `docker compose` (with a space). The older `docker-compose` (with a hyphen) still works but is deprecated.
- **Node.js** `^22.11.0` and **pnpm** `^10.1.0` — required if you are building locally without Docker, or if you want to run the database CLI to import data. Switch pnpm versions with `corepack prepare pnpm@<version> --activate`.
- Access to a server with the required ports open (see [Firewall](#firewall)).
- The InkVisitor source code — clone, fork or download from [github.com/DISSINET/InkVisitor](https://github.com/DISSINET/InkVisitor).

---

## A. Deploy with Docker (recommended)

The InkVisitor application runs as a single Docker container (client static files served by the server) alongside a RethinkDB container. Both are orchestrated by [docker-compose.yml](https://github.com/DISSINET/InkVisitor/blob/dev/docker-compose.yml).

You have two options:

- **[A.1 Use the published image](#a1-use-the-published-image-from-docker-hub)** — fastest path. Recommended unless you need to customise client-side configuration.
- **[A.2 Build the image locally](#a2-build-the-image-locally)** — required when you need custom client `.env` values (e.g. your own `APIURL`, `ROOT_URL`), because those are baked into the image at build time.

### A.1 Use the published image (from Docker Hub)

Ready-to-run images are published at [`dissinet/inkvisitor`](https://hub.docker.com/r/dissinet/inkvisitor) (tags: `latest`, `production`, `staging`, `sandbox`, …). `docker compose up` pulls the image automatically — there is no build step.

The shipped [`docker-compose.yml`](https://github.com/DISSINET/InkVisitor/blob/dev/docker-compose.yml) defines all server environment variables inline with sensible defaults, so a basic setup needs **no `.env` file**.

#### 1. Start the database

From the repository root:

```bash
docker compose up -d database
```

RethinkDB now runs in the `inkvisitor-database` container with its driver port on `28015` and its admin dashboard on `http://localhost:8080`.

#### 2. Import the database schema and initial data

The database CLI runs on the host (not inside a container) and creates the database, tables and indexes — and optionally seeds example data. The target database **does not need to exist beforehand**; the CLI drops and recreates whatever `DB_NAME` it is configured for. The shipped defaults point at a database called `inkvisitor`.

```bash
cp packages/database/env/example.env packages/database/env/.env
cd packages/database
pnpm install
pnpm start
```

In the interactive prompt:

1. Decline the SSH-tunnel prompt to stay on the local connection.
2. Press `D` to pick a dataset — for a first run, use **`empty`** (just the schema, no data).
3. Press `X` to execute the import.

To target a different database name, either edit `DB_NAME` in `packages/database/env/.env` or pass it as a CLI argument: `pnpm start <dbname>`.

Verify in the RethinkDB data explorer at `http://localhost:8080/#dataexplorer`:

```javascript
r.db('inkvisitor').table('entities')
```

#### 3. Run the application

```bash
docker compose up -d inkvisitor
```

Compose pulls the image from Docker Hub (if not already cached) and starts the container. The server serves both the API and the client static files on port `3000`. With a reverse proxy in front (see [SSL](#ssl)), the application is reachable at the domain you configured.

To update later:

```bash
docker compose pull inkvisitor
docker compose up -d inkvisitor
```

#### Customising defaults

The `environment:` block in `docker-compose.yml` uses `${VAR:-default}` substitution, so you can override any value via a top-level `.env` file (auto-loaded by `docker compose`) or shell environment, **without editing the compose file**.

Create a `.env` next to `docker-compose.yml`:

```bash
# Required before exposing publicly
SECRET=<long-random-string>

# Optional overrides
DOMAIN=inkvisitor.your-domain.tld
IMAGE_TAG=production           # use a different published tag
DB_AUTH=<rethinkdb-password>   # only if RethinkDB requires auth

# SMTP (optional, enables password reset and notifications)
SMTP_HOST=in-v3.mailjet.com
SMTP_PORT=587
SMTP_USER=<mailjet-api-key>
SMTP_SECRET=<mailjet-secret-key>
MAILER_SENDER=noreply@your-domain.tld
```

The variables you most commonly want to set:

- `SECRET` — JWT signing key. **The default is a placeholder; replace it before going public.**
- `DOMAIN` — used in outgoing email links.
- `IMAGE_TAG` — pick `latest` (default), `production`, `staging`, `sandbox`, etc.
- `DB_AUTH` — RethinkDB password (leave unset if RethinkDB has no auth). ⚠ Same secret as `DB_PASS` in the database CLI's env file — the two use different variable names.
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_SECRET` / `MAILER_SENDER` — SMTP relay for outgoing mail. Leave unset to disable mail features. Mailjet example shown above.

Less commonly overridden: `NODE_ENV` (default `production`), `ENV` (default `production` — server injects this as `window.appConfig.env` into the served `index.html`; required for the client to render), `STATIC_PATH` (default `/`), `PORT` (default `3000`), `DB_NAME` (default `inkvisitor`), `DB_PORT` (default `28015`), `DB_POOL_CONNECTIONS` (default `10`).

### A.2 Build the image locally

Build your own image when you need to customise the client `.env` — for example, to set a different `APIURL` or `ROOT_URL`. Client configuration is baked into the image at build time, so changes there require a rebuild.

The setup is identical to [A.1](#a1-use-the-published-image-from-docker-hub) with two additions: prepare a client `.env` file, then build the image before running it.

#### Prepare the client `.env` file

The client is built at **image build time**. Vite reads `packages/client/env/.env.<mode>` where `<mode>` is picked by the `ENV` build argument:

- `ENV=latest` (the default in `docker-compose.yml`) → `packages/client/env/.env`
- `ENV=production` → `packages/client/env/.env.production`
- `ENV=staging` → `packages/client/env/.env.staging`
- etc.

Copy [`packages/client/env/example.env`](https://github.com/DISSINET/InkVisitor/blob/dev/packages/client/env/example.env) to the matching path and fill in:

- `ENV` — short identifier surfaced in the UI as the current environment (e.g. `production`, `staging`). Ignored for `ENV=latest` builds, used everywhere else.
- `ROOT_URL` — base path the client is served from. Use empty (or `/`) for the root; use `/inkvisitor` if you serve it under a sub-path of your domain.
- `APIURL` — full URL of the server API. **Leave empty** to make the client call back to the same origin it was loaded from (this is what makes the published `latest` image work as-is when the server hosts both the static files and the API). Set explicitly to e.g. `https://api.your-domain.tld` only if the API lives on a different host than the client.

These three are the only variables defined in `example.env`. The client source code reads a few more (`GUEST_MODE`, `GUEST_MODE_USER`, `GUEST_MODE_PASS`, `LOGIN_TITLE`, `LOGIN_TEXT`, `LOGIN_CITATION`, `SHOW_LEGACY_ID`) which are optional UX customisations — add them to your env file if you need them. See the [client README](https://github.com/DISSINET/InkVisitor/blob/dev/packages/client/README.md) for details.

#### Build the image

The [Dockerfile](https://github.com/DISSINET/InkVisitor/blob/dev/Dockerfile) builds the `annotator`, `client` and `server` packages into a single image:

```bash
docker compose build inkvisitor
```

This uses `ENV=latest` per `docker-compose.yml`. To build a different environment variant, either change the `ENV:` value in the compose file or use one of the helper targets in [Makefile](https://github.com/DISSINET/InkVisitor/blob/dev/Makefile):

```bash
make build-inkvisitor            # ENV=production
make build-inkvisitor-staging    # ENV=staging
make build-inkvisitor-sandbox    # ENV=sandbox
make build-latest                # ENV=latest
```

After the build finishes, run `docker compose up -d inkvisitor` as in [A.1](#a1-use-the-published-image-from-docker-hub). Compose uses the freshly built local image (tagged `dissinet/inkvisitor:latest`) rather than pulling from Docker Hub. If you built a different tag, set `IMAGE_TAG=<tag>` in your top-level `.env` so compose picks it up.

---

## B. Deploy by packages (without Docker)

If containers are not an option, the three packages can be built and run individually. In every step, make sure the matching `.env.<env>` file is in the `env/` folder of the package — see each package's README for the variables it expects.

### 1. Database

Two options:

- **Containerized RethinkDB** — `docker compose up -d database` as above (still convenient even when client/server are not containerized).
- **Native install** — follow the [RethinkDB installation guide](https://rethinkdb.com/docs/install/).

Create the database (`r.dbCreate("inkvisitor")` in the data explorer) and then run the import CLI:

```bash
cd packages/database
pnpm install
pnpm start
```

Use the `empty` dataset for a bare-minimum setup.

### 2. Client

The client is a Vite build that emits static files.

```bash
cd packages/client
pnpm install
pnpm build:<env>     # e.g. pnpm build:production
```

Copy the contents of `packages/client/dist` to the directory served by your HTTP server.

### 3. Server

```bash
cd packages/server
pnpm install
pnpm build
ENV_FILE=<env> pnpm start:dist
```

`ENV_FILE=<env>` selects `packages/server/env/.env.<env>` (e.g. `ENV_FILE=production` reads `.env.production`). Make sure that file exists and is filled in.

For local development you can also skip the build and run `pnpm start`, which uses `nodemon` with `.env.development`.

---

## SSL

For production, terminate SSL in a reverse proxy in front of the server — typically [nginx](https://docs.nginx.com/nginx/admin-guide/security-controls/securing-http-traffic-upstream/) — and forward to the API port. This is the recommended setup.

When the proxy serves both the client static files and the API on the same domain over `https://`, you can leave `APIURL` empty in the client `.env` — the client will call back to its own origin (`window.location.origin`), so HTTPS just works. Set `APIURL` explicitly only if the API is hosted on a different domain than the client.

The server also has an internal `HTTPS=1` flag — set it via a top-level `.env` or shell env when running compose — that enables TLS using `cert.pem`/`key.pem` from the container's `secret/` directory. The Docker image generates a **self-signed** certificate at build time, so this is suitable for local testing only; use a reverse proxy with a real certificate for anything public.

## Firewall

The ports that need to be reachable are declared in [docker-compose.yml](https://github.com/DISSINET/InkVisitor/blob/dev/docker-compose.yml). For a public InkVisitor instance you typically need:

- **`3000`** — server API and (when using the Docker image) client static files. This is the only port that must be public.
- **`8080`** — RethinkDB admin dashboard. Open only if you need remote DB administration; otherwise keep it private.
- **`28015`** — RethinkDB driver port. Open only if you connect to the database from outside the host.

Example commands:

- [ufw](https://help.ubuntu.com/community/UFW): `ufw allow 3000`
- [firewalld](https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/7/html/security_guide/sec-using_firewalls): `firewall-cmd --zone=public --permanent --add-port=3000/tcp`

Setup of additional system-specific features (reverse proxies, fail2ban, etc.) is beyond the scope of this page.

## Kubernetes

For Kubernetes-based deployments, example manifests live in the [kube/](https://github.com/DISSINET/InkVisitor/tree/dev/kube) directory of the repository. The setup needs to be adapted to your cluster's capabilities (ingress, storage class, secrets management).