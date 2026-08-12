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

The app starts on `http://localhost:8080`; Swagger UI at `http://localhost:8080/swagger-ui.html`.

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

## Commands

```sh
./mvnw clean verify        # build + unit + integration tests
./mvnw spring-boot:run     # run locally (dev profile)
./mvnw test                # unit + web/integration tests (H2, no Docker)
./mvnw verify              # also runs *IT tests (Testcontainers, needs Docker)
```

## Layout

See the "Recommended structure" section of [`CLAUDE.md`](./CLAUDE.md).
