# FieldOps API

REST API for the **FieldOps** field-inspection platform — Java 21 + Spring Boot 3.5.

> See [`CLAUDE.md`](./CLAUDE.md) for the full conventions guide used across this codebase.

## Requirements

- **Java 21** (LTS)
- **Maven** — the wrapper (`./mvnw`) downloads its own Maven, so no global install is required
- **PostgreSQL 15+** for local/dev (unit & web tests use H2; integration tests use Testcontainers)

## Getting started

```bash
cd api
cp .env.example .env          # then edit DB + JWT values
./mvnw spring-boot:run
```

The app starts on `http://localhost:8080`; Swagger UI at `http://localhost:8080/swagger-ui`.

## Demonstration via Docker (PBI-070)

A single command builds the API image and starts PostgreSQL + API in containers, ready to demo:

```bash
cd api
docker compose up --build
```

On the first start the container (profile `demo`):

- runs the Flyway migrations automatically;
- seeds the demo users (see the credentials table below), a set of ASSIGNED inspections for
  the technician, and a coherent catalog dataset (client, site, equipment, published template
  and one assigned inspection — the compressor example).

Then open:

- Swagger UI: `http://localhost:8080/swagger-ui`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`
- Health: `http://localhost:8080/actuator/health`

Log in at `POST /api/v1/auth/login` with any account from the credentials table. The API port
is overridable with `API_EXTERNAL_PORT`; `JWT_SECRET` has a demo default and should be
overridden for any real deployment. Stop and reset with `docker compose down -v`.

## Database

Schema is managed by **Flyway** (`src/main/resources/db/migration`). Hibernate runs with
`ddl-auto=validate`, so entities must match the migrations — never reshape prod via entity edits.

Create the database before the first run:

```sql
CREATE DATABASE fieldops;
CREATE USER fieldops WITH ENCRYPTED PASSWORD 'fieldops';
GRANT ALL PRIVILEGES ON DATABASE fieldops TO fieldops;
```

## First admin (optional)

Set `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` in `.env` to idempotently create an
administrator on startup. Disabled when either value is blank.

## Local development users

The default `dev` profile creates three intentionally fictitious local accounts on startup:

| Role | Email | Password |
| --- | --- | --- |
| ADMINISTRATOR | `admin@fieldops.local` | `fieldops-admin-dev` |
| SUPERVISOR | `supervisor@fieldops.local` | `fieldops-supervisor-dev` |
| TECHNICIAN | `technician@fieldops.local` | `fieldops-technician-dev` |

These accounts are created only by the `dev` profile and are never created in production. Set
`FIELDOPS_DEV_USERS_ENABLED=false` to disable them, or override each `FIELDOPS_DEV_*` variable
when needed. Passwords in this table are for local demonstration only.

## Demonstration data (seed)

On top of the users above, the `dev` profile seeds a coherent demonstration dataset on startup
(PBI-066): one client (`Industria Modelo Ltda.`), one site (`Unidade Sorocaba - Galpao de
Producao 02`), one equipment (`Compressor de Ar XPTO 500`, QR `COMP-004`), one published
inspection template (`Inspecao Preventiva de Compressor`, 2 sections) and one inspection
**assigned to the technician above**. Log in as `technician@fieldops.local` and the inspection
appears at `GET /api/v1/mobile/inspections`.

The seed is idempotent (guarded by the client document) and safe to re-run. Disable it with
`FIELDOPS_DEMO_SEED_ENABLED=false`.

## Commands

```sh
./mvnw clean verify        # build + unit + integration tests
./mvnw spring-boot:run     # run locally (dev profile)
./mvnw test                # unit + web/integration tests (H2, no Docker)
./mvnw verify              # also runs *IT tests (Testcontainers, needs Docker)
```

## Health check

The app exposes Spring Boot Actuator: `GET http://localhost:8080/actuator/health` returns `200`
with `{"status":"UP"}` once the database is reachable.

## Push notifications

Authenticated devices register an Expo push token at `POST /api/v1/devices/register`. Push delivery
is disabled by default; enable it in an environment that can call Expo with `FIELDOPS_PUSH_ENABLED=true`.
When enabled, an inspection assignment notifies every active token of the assigned technician; Expo
responses that report `DeviceNotRegistered` remove the stale token.

## Docker

Run PostgreSQL and the API together (builds the app image from `Dockerfile`):

```bash
cd api
docker compose up --build
```

- API: `http://localhost:8080` (perfil `demo`; Flyway roda as migrations e o seed de demonstração é carregado)
- Swagger UI: `http://localhost:8080/swagger-ui`
- Health: `http://localhost:8080/actuator/health`
- DB: `localhost:5434` por padrão (configurável por `DB_EXTERNAL_PORT`), persistido no volume `db-data`

For a host-run backend with the Compose database, start only PostgreSQL with
`docker compose up -d db`, set `DB_PORT=5434` in `api/.env`, and run `./mvnw spring-boot:run`.
The frontend can then run with `VITE_API_URL=http://localhost:8080`.

Swagger UI is available at `http://localhost:8080/swagger-ui`.

## Layout

See the "Recommended structure" section of [`CLAUDE.md`](./CLAUDE.md).
