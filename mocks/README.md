# FieldOps — API Mocks

Static JSON fixtures mirroring the backend's OpenAPI contract, so the **mobile** and **web**
frontends can code their services and screens before the real endpoints are implemented.

These match the `@ExampleObject` payloads served by the API's Swagger UI
(`/swagger-ui.html`).

| File | Endpoint | Use |
|------|----------|-----|
| `auth-login-request.json` | `POST /api/v1/auth/login` | login request body |
| `auth-login-200.json` | `POST /api/v1/auth/login` | success response (access + refresh token, user) |
| `auth-login-401.json` | `POST /api/v1/auth/login` | invalid credentials error |
| `mobile-inspections-200.json` | `GET /api/v1/mobile/inspections` | technician's inspections list |
| `clients-200.json` | `GET /api/v1/clients` | paginated clients |

## Standard error shape

Every error response follows:

```json
{
  "timestamp": "ISO-8601",
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "Human-readable detail",
  "path": "/api/v1/...",
  "fieldErrors": [ { "field": "email", "message": "..." } ]
}
```

Common `code` values: `VALIDATION_ERROR`, `INVALID_CREDENTIALS`, `UNAUTHORIZED`,
`NOT_FOUND`, `BUSINESS_RULE`, `INTERNAL_ERROR`.

## How to use

- **MSW (mobile) / Angular interceptor**: return these payloads for the matching routes.
- **Quick check**: compare against Swagger UI at `http://localhost:8080/swagger-ui.html`.
- The backend also serves live **stub** responses for `/api/v1/mobile/inspections` and
  `/api/v1/clients` (sample data), so frontends can hit them with a real login token too.
