# Auditoria de Testes — Upload de Evidência Mobile (Issue #229)

Fonte da auditoria: código da branch `feat/mobile-evidence-upload-sync`, execução local dos testes automatizados e teste manual em aparelho Android contra a API e o banco locais (Docker), em 14/11/2026.

- Issue: [#229 — Mobile: enviar upload de evidencia (foto) para o backend](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/229) (EP-08, sprint-2, P0).
- Endpoint integrado: `POST /api/v1/inspections/{id}/evidence` ([#221](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/221), `api/.../evidence/controller/EvidenceUploadController.java`).
- PBIs relacionados no cronograma: PBI-042, PBI-043, PBI-044 (`docs/cronograma.md`). A issue #229 completa a integração do upload de evidências descrita em `docs/analise-sprint1-back-web.md` (revisão de 10/10/2026).

## A. Resumo executivo

- Critérios de aceite da issue: 3/3 atendidos.
- Testes automatizados mobile: 89/89 passando (8 suítes).
- Testes automatizados backend (`MobileStatusUpdateTest`): 4/4 passando.
- Teste manual ponta a ponta: aprovado. As 2 fotos da inspeção 7 foram gravadas no banco e no storage, sem duplicidade.

## B. Implementação

| # | Entrega | Resultado |
|---|---|---|
| 1 | Upload multipart para `POST /api/v1/inspections/{id}/evidence`, com os campos do `EvidenceUploadRequest` | A foto e seus metadados chegam ao servidor em uma única requisição |
| 2 | `operationId` em formato UUID, derivado do id da operação no outbox (`deterministicUuid`) | O mesmo valor é enviado em todo reenvio, garantindo idempotência |
| 3 | Stub de `expo-file-system` no projeto Jest `node` | Todas as suítes de sincronização rodam em Node |
| 4 | Transição para o status em que a inspeção já está responde `ALREADY_APPLIED` no backend | O reenvio de uma transição já aplicada é reconhecido como concluído |

## C. Commits auditados

| Commit | Mensagem |
|---|---|
| `8265460` | 🐛 fix: stub expo-file-system in jest node project |
| `491696c` | 🐛 fix: send stable UUID operationId on evidence upload |
| `cf8bc06` | 🐛 fix: upload evidence to real multipart endpoint |
| `864635b` | 🐛 fix: treat transition to current status as already applied |

## D. Testes automatizados

### D.1 Mobile (Jest)

Comando: `cd mobile` e `npx jest`.

Resultado: `Test Suites: 8 passed, 8 total` e `Tests: 89 passed, 89 total`.

Testes novos desta entrega:

| Arquivo | Teste | Verifica |
|---|---|---|
| `src/infrastructure/sync/__tests__/evidenceUploadClient.test.ts` | posts multipart to /api/v1/inspections/{id}/evidence with the backend field names | URL, `fieldName=file`, header `Authorization` e campos `itemId`, `mimeType`, `description`, `latitude`, `longitude`, `capturedAtDevice`, `operationId` |
| idem | omits latitude/longitude unless both are present | Regra "os dois ou nenhum" do backend |
| idem | derives the mime type from the file extension | `.png` → `image/png` |
| idem | returns the server evidence id and checksum on 201 | Leitura da resposta `{ id, checksum }` |
| idem | throws on a non-2xx response | A foto permanece na fila para nova tentativa |
| idem | throws when the upload task yields no response | Sem conexão, a foto permanece na fila |
| idem | rejects an operationId that is not a UUID | Validação da chave antes do envio |
| idem | rejects a non-numeric inspection id | Validação do id antes do envio |
| idem | extractTemplateItemId strips the scope prefix | `15::42` → `42` |
| idem | deterministicUuid is stable per seed | Formato UUID v4, estável e distinto por foto |
| `src/infrastructure/sync/__tests__/pbi044.test.ts` | sends the same UUID operationId on every attempt of the same photo | Toda nova tentativa usa a mesma chave de idempotência |

Os testes já existentes do PBI-044 continuam passando (foto pendente até o envio, arquivo preservado, "Tentar novamente" sem duplicar, persistência após reinício).

Lint: `npx eslint src/infrastructure/sync src/test-stubs jest.config.js --max-warnings 0` passou sem avisos.

### D.2 Backend (Maven)

Comando: `cd api` e `.\mvnw.cmd test -Dtest=MobileStatusUpdateTest`.

Resultado: `Tests run: 4, Failures: 0, Errors: 0, Skipped: 0` e `BUILD SUCCESS`.

| Teste | Verifica |
|---|---|
| `treatsTransitionToCurrentStatusAsAlreadyApplied` (novo) | `IN_PROGRESS` → `IN_PROGRESS` com `operationId` novo retorna 200 `ALREADY_APPLIED` e registra a operação |
| `appliesTransitionAndIsIdempotentOnResend` | Reenvio com o mesmo `operationId` não aplica duas vezes |
| `rejectsIllegalTransitionWith422` | Transições fora da máquina de estados retornam 422 |
| `rejectsTransitionForInspectionOfAnotherTechnicianWith422` | Somente o técnico dono altera o status |

## E. Teste manual ponta a ponta

Ambiente: app no aparelho Android, API no container `fieldops-api` (porta 8085), banco no container `fieldops-db` (PostgreSQL 16).

Roteiro executado:

1. O técnico iniciou a inspeção 7, respondeu os itens 1 e 2 e tirou uma foto de cada.
2. O técnico concluiu a inspeção e sincronizou.
3. A fila de sincronização esvaziou e o funcionamento foi confirmado no app.

Conferência no banco (`inspection_evidences`):

| id | inspection_id | item snapshot | reference | captured_at (UTC) | created_at (UTC) |
|---|---|---|---|---|---|
| 9 | 7 | 19 | `07ba1d12-3559-4326-8b9f-4175ef2bb4d5.jpeg` | 2026-11-14 18:17:26 | 2026-11-14 18:29:50 |
| 10 | 7 | 20 | `3908630f-360f-43e9-847d-3bbe3709a773.jpeg` | 2026-11-14 18:17:40 | 2026-11-14 18:29:51 |

- Uma linha por foto: o reenvio não duplicou.
- `checksum` SHA-256 preenchido; `captured_at` é o horário do aparelho.
- `processed_operations` com 10 registros `EVIDENCE_UPLOAD`, um por evidência gravada.
- Inspeção 7 com status `SUBMITTED` (versão 4): a conclusão também chegou ao servidor.

Conferência no storage (`/app/evidences` no container `fieldops-api`):

- `07ba1d12-3559-4326-8b9f-4175ef2bb4d5.jpeg`: 1.704.099 bytes.
- `3908630f-360f-43e9-847d-3bbe3709a773.jpeg`: 1.545.828 bytes.

## F. Critérios de aceite da issue #229

| Critério | Veredicto | Evidência |
|---|---|---|
| Foto capturada no mobile sai do estado PENDING após a sync | ✅ Atendido | `pbi044.test.ts` (marca SYNCED no 201) + seção E |
| Falha de rede mantém a foto na fila e permite "Tentar novamente" | ✅ Atendido | `evidenceUploadClient.test.ts` + testes do PBI-044 |
| Reenvio não duplica a evidência no servidor | ✅ Atendido | UUID estável (`pbi044.test.ts`) + idempotência do `EvidenceUploadService` + 1 linha por foto no banco |

Itens de escopo:

| Item | Resultado |
|---|---|
| Ajustar `EvidenceUploadClient`/`InspectionSyncService` ao contrato real | ✅ Atendido |
| Enviar arquivo + metadados e `operationId` | ✅ Envia `mimeType`, `description`, `itemId`, `capturedAtDevice` e `operationId`. O cliente já aceita `latitude`/`longitude`, que passam a ser enviadas quando a captura de localização por foto for adicionada (EP-08) |
| Marcar `synced` no sucesso e manter na fila com retry em falha | ✅ Atendido |
