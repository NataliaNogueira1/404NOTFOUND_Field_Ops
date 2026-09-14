---
inclusion: manual
---

# FieldOps — Contrato da API REST

## Convenções Gerais

- Prefixo: `/api/v1`
- Formato: JSON
- Upload: `multipart/form-data`
- IDs: UUID
- Datas: ISO 8601 (UTC)
- Auth: Bearer token
- Paginação: `page`, `size`, `sort`
- Documentação: OpenAPI + Swagger UI

## Estrutura de Erro Padronizada

```json
{
  "timestamp": "2026-08-01T14:30:00Z",
  "status": 422,
  "code": "INSPECTION_REQUIRED_ITEMS_MISSING",
  "message": "A inspeção possui itens obrigatórios sem resposta.",
  "path": "/api/v1/inspections/{id}/submit",
  "requestId": "req-123",
  "fieldErrors": [
    { "field": "responses", "message": "Existem 2 itens obrigatórios pendentes." }
  ]
}
```

## Códigos HTTP

| Código | Uso |
|---|---|
| 200 | Consulta ou alteração concluída |
| 201 | Recurso criado |
| 204 | Operação sem corpo |
| 400 | Requisição malformada |
| 401 | Sessão ausente ou inválida |
| 403 | Sem permissão |
| 404 | Não encontrado |
| 409 | Conflito (estado, versão, unicidade) |
| 413 | Arquivo acima do limite |
| 415 | Formato não suportado |
| 422 | Regra de negócio não atendida |
| 500 | Falha interna |

## Autenticação

```
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

### Login Request
```json
{ "email": "tecnico@fieldops.local", "password": "..." }
```

### Login Response
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "expiresIn": 900,
  "user": { "id": "uuid", "name": "Carlos", "email": "...", "role": "TECHNICIAN" }
}
```

## Usuários

```
GET    /api/v1/users
GET    /api/v1/users/{id}
POST   /api/v1/users
PUT    /api/v1/users/{id}
PATCH  /api/v1/users/{id}/status
POST   /api/v1/users/{id}/reset-password
```

## Clientes

```
GET    /api/v1/clients
GET    /api/v1/clients/{id}
POST   /api/v1/clients
PUT    /api/v1/clients/{id}
PATCH  /api/v1/clients/{id}/status
```

## Locais

```
GET    /api/v1/sites
GET    /api/v1/sites/{id}
GET    /api/v1/clients/{clientId}/sites
POST   /api/v1/sites
PUT    /api/v1/sites/{id}
PATCH  /api/v1/sites/{id}/status
```

## Equipamentos

```
GET    /api/v1/equipment
GET    /api/v1/equipment/{id}
GET    /api/v1/equipment/by-qr/{qrCode}
GET    /api/v1/sites/{siteId}/equipment
POST   /api/v1/equipment
PUT    /api/v1/equipment/{id}
PATCH  /api/v1/equipment/{id}/status
```

## Modelos de Inspeção

```
GET    /api/v1/inspection-templates
GET    /api/v1/inspection-templates/{id}
POST   /api/v1/inspection-templates
PUT    /api/v1/inspection-templates/{id}
POST   /api/v1/inspection-templates/{id}/sections
PUT    /api/v1/inspection-templates/{id}/sections/{sectionId}
POST   /api/v1/inspection-templates/{id}/sections/{sectionId}/items
PUT    /api/v1/inspection-templates/{id}/items/{itemId}
POST   /api/v1/inspection-templates/{id}/publish
GET    /api/v1/inspection-templates/{id}/versions
GET    /api/v1/inspection-template-versions/{versionId}
```

## Inspeções

```
GET    /api/v1/inspections
GET    /api/v1/inspections/{id}
POST   /api/v1/inspections
PUT    /api/v1/inspections/{id}
POST   /api/v1/inspections/{id}/assign
POST   /api/v1/inspections/{id}/cancel
POST   /api/v1/inspections/{id}/start
POST   /api/v1/inspections/{id}/submit
POST   /api/v1/inspections/{id}/begin-review
POST   /api/v1/inspections/{id}/approve
POST   /api/v1/inspections/{id}/reject
GET    /api/v1/inspections/{id}/history
```

### Endpoints Mobile

```
GET /api/v1/mobile/inspections
GET /api/v1/mobile/inspections/{id}
```

## Respostas

```
GET  /api/v1/inspections/{inspectionId}/responses
PUT  /api/v1/inspections/{inspectionId}/responses/{responseId}
POST /api/v1/inspections/{inspectionId}/responses:batch
```

## Evidências

```
POST   /api/v1/inspections/{inspectionId}/evidence
GET    /api/v1/inspections/{inspectionId}/evidence
GET    /api/v1/evidence/{id}
DELETE /api/v1/evidence/{id}
```

## Não Conformidades

```
GET    /api/v1/non-conformities
GET    /api/v1/non-conformities/{id}
POST   /api/v1/inspections/{inspectionId}/non-conformities
PUT    /api/v1/non-conformities/{id}
PATCH  /api/v1/non-conformities/{id}/status
```

## Revisões

```
GET  /api/v1/inspections/{inspectionId}/reviews
POST /api/v1/inspections/{inspectionId}/begin-review
POST /api/v1/inspections/{inspectionId}/approve
POST /api/v1/inspections/{inspectionId}/reject
```

### Reprovação Request
```json
{
  "reason": "A fotografia do item 4 não permite identificar o número de série.",
  "itemsToCorrect": ["uuid-do-item"]
}
```

## Sincronização

```
POST /api/v1/mobile/sync/push
GET  /api/v1/mobile/sync/pull?cursor={cursor}
POST /api/v1/mobile/sync
```

### Push Request
```json
{
  "deviceId": "uuid",
  "lastPullCursor": "cursor-anterior",
  "operations": [
    {
      "operationId": "uuid-idempotente",
      "entityType": "INSPECTION_RESPONSE",
      "entityId": "uuid",
      "operationType": "UPSERT",
      "baseVersion": 0,
      "payload": { ... }
    }
  ]
}
```

### Push Response
```json
{
  "results": [
    { "operationId": "uuid", "status": "APPLIED", "entityVersion": 1 }
  ],
  "changes": [],
  "nextCursor": "novo-cursor",
  "serverTime": "2026-08-01T14:15:00Z"
}
```

### Status por operação
- APPLIED
- ALREADY_APPLIED
- REJECTED
- CONFLICT
- DEPENDENCY_FAILED

## Dashboard

```
GET /api/v1/dashboard/summary
GET /api/v1/dashboard/inspections-by-status
GET /api/v1/dashboard/non-conformities-by-severity
```
