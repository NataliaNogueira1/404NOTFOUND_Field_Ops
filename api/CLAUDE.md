# FieldOps API

Backend of the FieldOps platform.

- Java 21 · Spring Boot 3.x · Spring Data JPA · PostgreSQL
- Spring Security · JWT · BCrypt (`PasswordEncoder`)
- Bean Validation (jakarta.validation) · MapStruct
- Flyway · springdoc-openapi (OpenAPI 3)
- JUnit 5 · Mockito · AssertJ · Testcontainers

## Spring Boot

* One package per domain, under `br.com.fieldops.api.<domain>`.
* Layer strictly: **controller → service → repository**. Never skip a layer.
* Controllers receive the request, delegate to a service, and return a response. No business logic, no DB calls.
* Services own domain logic, rules, and transactions (`@Transactional`). They never touch the HTTP request object.
* Validate input *before* the service runs (`@Valid` on the request body).
* Persistence is isolated from the HTTP edge — controllers never inject a `Repository`.
* Return consistent, predictable shapes (DTOs) from every endpoint.

## Layering & SOLID

* **SRP** — one responsibility per class. A service that authenticates *and* sends mail *and* persists is wrong; split it.
* **OCP** — add behavior with new classes/components; don't fork an existing service to branch behavior.
* **LSP** — any consumer of a port (storage, token store) can swap the implementation without changing the call site.
* **ISP** — define narrow ports (`FileStorage`, `TokenStore`). Never force a component to depend on a fat interface it doesn't use.
* **DIP** — depend on abstractions. Inject `FileStorage`, not `LocalDiskStorage`. Wrap third-party libs behind project-owned interfaces (storage SDKs, HTTP clients, mappers are details).
* Dependency direction points inward: domain logic is pure; HTTP, DB, storage, and Spring are details at the edge.

## Code style

* Methods: 4–20 lines. Controllers usually < 15. Split if longer.
* Files: under ~300 lines. Split by responsibility.
* One thing per method, one responsibility per class/package.
* Specific names. Avoid `data`, `handler`, `manager`, `util`, `helper`, and a bare `service`.
* Suffix by role: `*Controller`, `*Service`, `*Repository`, `*Entity` (or the domain noun), `*Dto`, `*Mapper`, `*Config`, `*Exception`, `*Handler`, `*Interceptor`. Classes are `PascalCase`; methods and fields are `camelCase`; packages are lowercase.
* Explicit types everywhere. No raw collections; no unchecked casts. Generics on every `List`, `Map`, `Optional`, `ResponseEntity`.
* Extract shared logic; don't duplicate.
* Prefer early returns / guard clauses. Max 2 levels of nesting.
* Error messages include the offending value and the expected shape.
* Enum names and members are always in English (`APPROVED`, not `APROVADO`), both the key and the string returned by `name()` — regardless of the domain being Portuguese-speaking (FieldOps). User-facing strings/messages stay in Portuguese; enums are code, not copy.

  > Exception: business entity **class names** keep Portuguese to mirror the domain (`Inspecao`, `Equipamento`, `NaoConformidade`). Enum members still follow the English rule above.

## Comments

* Keep existing comments during refactors.
* Explain *why*, not *what*.
* Add Javadoc to public service methods: intent + one usage note.
* Reference an issue number or commit SHA when code exists because of a specific bug or upstream constraint.

## Tests (TDD)

* **Red → Green → Refactor.** Write the failing test first, make it pass, then refactor. No production code without a failing test driving it.
* Every new method and route gets a test. Every bug fix gets a regression test.
* Unit tests live next to the source under `src/test/java` in the **same package** (`*Test.java`); integration tests are suffixed `*IT.java` (run by Failsafe during `./mvnw verify`).
* Run with a single command: `./mvnw test` (unit), `./mvnw verify` (integration).
* Tests are **F.I.R.S.T.** — Fast, Independent, Repeatable, Self-validating, Timely.
* Mock external I/O (DB, storage, JWT, HTTP) with Mockito. Never hit real services in unit tests; use a throwaway Testcontainers PostgreSQL for integration.
* Test behavior, not implementation. Don't assert on private internals.
* Name a test by behavior + expected outcome: `returns 401 when the access token is expired`.
* Focus meaningful coverage on services, security, and mappers. Cover controllers via `@WebMvcTest` or integration tests.

## Validation

* Bean Validation (jakarta.validation) is the default, enforced by `@Valid` on request bodies and `@Validated` on controllers.
* Validation rules are annotations on DTO classes, in `dto/` (and `domain/` when a domain shares them). Never build validation inline in a controller.
* Constraint violations are caught by the global exception handler (`@RestControllerAdvice`) and returned as `{ message: 'Validation failed', issues: [{ field, message }] }`.
* DTOs double as the OpenAPI contract — keep the annotated shape and the documented shape in sync.
* Config/env is validated the same way, via `@ConfigurationProperties` + `@Validated`; fail fast on missing required values.

## Database

* Connection config is centralized in `application.yml` (per profile) and read from env.
* No direct DB access in controllers — always go through a repository/service.
* One entity per domain, in the domain package (`<domain>/domain/`); shared/base entities in `common/domain/`.
* Schema changes go in Flyway migrations (`src/main/resources/db/migration/`); seeds in `db/seed/`. Never reshape prod via entity-only edits; keep `ddl-auto=validate` in prod (never `create`/`update`).
* Transactions live in the service (`@Transactional`), never the controller.
* Keep table and column names consistent (snake_case columns via Hibernate's naming strategy).

## Evidences (file storage) & offline sync

*The FieldOps equivalent of an isolated external concern (port + async edge).*

* Storage lives behind a `FileStorage` port (interface in `common/storage/`). The HTTP path calls the port — it never touches the disk, an S3 SDK, or any client directly.
* An evidence record is persisted (reference + checksum) *before* the binary is considered durable; the record is the source of truth, the file is an attachment.
* Offline-sync operations (mobile → API) must be **idempotent**: the client sends a stable idempotency key / client-side UUID; reprocessing the same payload never duplicates a record.
* Async side-effects (when needed) are best-effort at the call site via `@Async` / `ApplicationEventPublisher`: if the async step fails, the already-persisted record still wins — never 5xx over a side-effect. Log and move on.
* Async policy is one global default (`ThreadPoolTaskExecutor` in `config/`) so every `@Async` path inherits bounded pool size and rejection policy. A path that needs different values declares its own executor qualifier.

## Auth

* Spring Security + JWT. One issuer maps to **profiles**: `TECNICO`, `SUPERVISOR`, `ADMINISTRADOR`. Authorize by profile, not by hard-coded role checks.
* Secrets come from env (`JWT_SECRET`, `JWT_EXPIRATION`). Never hardcode.
* Hash passwords with `BCryptPasswordEncoder`. Never store or log plaintext passwords or tokens.
* Protected routes require a security filter that documents `Bearer JWT` in Swagger (`@SecurityRequirement`).

## Bootstrap & OpenAPI

* The main class (`@SpringBootApplication`) boots the context; controllers expose routes under a global `/api/v1` base path. `application.yml` sets CORS, the global exception handler, and the port from env.
* Swagger UI is served at `/swagger-ui.html`; the OpenAPI JSON at `/v3/api-docs`.
* Every route is documented before it's considered done. Critical endpoints (auth, inspections, evidence) ship with payload examples; protected routes declare `Bearer JWT`.
* Open locally: `./mvnw spring-boot:run` → `http://localhost:8080/swagger-ui.html`.

## Config & env

* All tunables via environment variables — no hardcoded secrets or credentials:
  `SERVER_PORT`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`,
  `JWT_SECRET`, `JWT_EXPIRATION`,
  `EVIDENCE_STORAGE_DIR`, `CORS_ALLOWED_ORIGINS`.
* Validate env via `@ConfigurationProperties` + `@Validated`; fail fast on missing required values.

## Logging

* Structured logging via SLF4J/Logback (JSON in prod). Never use `System.out`.
* Never log secrets, tokens, passwords, or PII.

## Formatting

* Formatting is owned by the formatter plugin (Spotless or spring-javaformat). Don't hand-enforce style. Run `./mvnw spotless:apply`.

## Dependencies

* **Maven is the build tool.** Declare dependencies in `pom.xml`. Versions are pinned through the Spring Boot BOM (`spring-boot-starter-parent`) and `<properties>`; there is no lockfile to drift.
* Constructor injection everywhere. Prefer implicit constructor injection; mark a collaborator with `@Autowired` only when a class has multiple constructors.
* Wrap third-party libraries behind project-owned interfaces.
* Java 21 is the baseline (`<maven.compiler.release>21</maven.compiler.release>`).

## Commits

* Conventional Commits prefixes (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`).
* Subject and body in English, imperative mood ("add", not "added").
* Subject under 72 characters, no trailing period. Body wrapped at ~72 columns, explaining what *and* why.
* One logical change per commit.
* Before committing, run `./mvnw verify` (compile + tests + format check) and ensure all pass — never commit code that leaves the build red.
* Never commit generated artifacts (`target/`, `.env`, IDE files).
* Do not add a `Co-Authored-By` trailer or any AI attribution.
* Never run `git push` automatically; only push on an explicit request.

## Commands

```sh
./mvnw clean verify        # build + unit + integration tests
./mvnw spring-boot:run     # dev server (live reload via spring-boot-devtools)
./mvnw test                # unit tests
./mvnw verify              # unit + integration (*IT via Failsafe)
./mvnw spotless:apply      # format
./mvnw spotless:check      # verify formatting (CI gate)
./mvnw dependency:tree     # inspect dependency graph
```

## Where things go

* HTTP edge → `controller/` (`*Controller`)
* Domain logic → `service/` (`*Service`)
* Input validation → annotated DTOs in `dto/`, enforced by `@Valid`
* Persistence → `domain/` (`*Entity`) and `repository/` (`*Repository`)
* Object mapping → `mapper/` (`*Mapper`, MapStruct)
* Cross-cutting HTTP pieces → `common/` (`@RestControllerAdvice`, filters, interceptors)
* Security → `security/` (filter, `UserDetailsService`, profile-based authz)
* Global config → `config/` (beans, OpenAPI, async, storage)
* Migrations → `src/main/resources/db/migration/` (Flyway)
* Shared helpers → `common/`

### Recommended structure

```text
src/main/java/br/com/fieldops/api/
  FieldOpsApiApplication.java
  config/
  common/ { dto, exception, interceptor, storage, types }
  security/ { filter, service, config }
  <domain>/
    controller/
    service/
    repository/
    dto/
    domain/
    mapper/
src/main/resources/
  application.yml
  application-dev.yml
  db/migration/
src/test/java/...
```

* A rule that belongs to one domain is born in `<domain>/`.
* A rule shared across domains lives in `common/` or `config/`.
* Nothing business-related goes loose in the root package.
