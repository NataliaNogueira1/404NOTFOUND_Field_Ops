# Relatório de Teste Funcional — Envio de Evidências Fotográficas

## 1. Identificação

| Campo | Valor |
|---|---|
| Funcionalidade | Envio de evidências fotográficas do app mobile para o servidor |
| Módulos | App Mobile (sincronização) e API REST (evidências e status da inspeção) |
| Perfil de usuário | TECHNICIAN |
| Versão testada | Branch `feat/mobile-evidence-upload-sync`, commit `864635b` |
| Data da execução | 14/11/2026 |
| Tipo de teste | Funcional manual em aparelho + testes automatizados de apoio |
| Resultado geral | ✅ Aprovado (9/9 casos de teste) |

## 2. Objetivo

Verificar que as fotos capturadas pelo técnico durante a inspeção são enviadas ao servidor na sincronização, ficam vinculadas à inspeção e ao item corretos, são armazenadas com integridade e não são duplicadas quando o envio se repete.

## 3. Regras de negócio verificadas

| Regra | Descrição |
|---|---|
| RN-047 | Evidência não sincronizada não pode ser apagada por limpeza de cache |
| RN-068 | Reenvio não cria duplicidade |
| RN-069 | Operações processadas respeitando dependências (a foto é enviada depois da resposta do item) |
| RN-074 | App preserva data de execução do dispositivo + data do servidor |
| RN-078 | Arquivos sincronizados separadamente dos dados estruturados |

## 4. Ambiente e pré-condições

| Item | Configuração |
|---|---|
| Aparelho | Smartphone Android com o app FieldOps (Expo SDK 57) |
| API | Container `fieldops-api`, porta 8085 |
| Banco de dados | Container `fieldops-db` (PostgreSQL 16) |
| Armazenamento de arquivos | `/app/evidences` no container `fieldops-api` |
| Usuário | Técnico autenticado (id 3) |
| Massa de dados | Inspeção 7 atribuída ao técnico, com checklist de 2 itens |

## 5. Resumo dos casos de teste

| ID | Caso de teste | Execução | Resultado |
|---|---|---|---|
| CT-01 | Enviar fotos do checklist na sincronização | Manual | ✅ Aprovado |
| CT-02 | Vincular a foto à inspeção e ao item corretos | Manual | ✅ Aprovado |
| CT-03 | Registrar a data/hora de captura do aparelho | Manual | ✅ Aprovado |
| CT-04 | Armazenar o arquivo com checksum de integridade | Manual | ✅ Aprovado |
| CT-05 | Não duplicar a foto em reenvios | Manual + automatizado | ✅ Aprovado |
| CT-06 | Manter a foto na fila sem conexão e permitir "Tentar novamente" | Automatizado | ✅ Aprovado |
| CT-07 | Concluir a inspeção e sincronizar o status | Manual | ✅ Aprovado |
| CT-08 | Aceitar o reenvio de uma mudança de status já aplicada | Automatizado | ✅ Aprovado |
| CT-09 | Validar os dados antes de enviar a foto | Automatizado | ✅ Aprovado |

## 6. Casos de teste detalhados

### CT-01 — Enviar fotos do checklist na sincronização

- **Pré-condição:** inspeção 7 atribuída ao técnico e baixada no aparelho.
- **Passos:**
  1. Iniciar a inspeção 7.
  2. Responder os itens 1 e 2 do checklist.
  3. Tirar uma foto em cada item.
  4. Abrir a aba Sync e tocar em "Sincronizar agora".
- **Resultado esperado:** as fotos saem da fila de pendências e são gravadas no servidor.
- **Resultado obtido:** a fila esvaziou e as evidências 9 e 10 foram gravadas em `inspection_evidences`.
- **Status:** ✅ Aprovado.

### CT-02 — Vincular a foto à inspeção e ao item corretos

- **Pré-condição:** CT-01 executado.
- **Passos:** consultar `inspection_evidences` pelas evidências da inspeção 7.
- **Resultado esperado:** cada foto vinculada à inspeção 7 e ao item em que foi tirada.
- **Resultado obtido:** evidência 9 no item snapshot 19 (item 1) e evidência 10 no item snapshot 20 (item 2), ambas com `inspection_id = 7` e `uploaded_by = 3`.
- **Status:** ✅ Aprovado.

### CT-03 — Registrar a data/hora de captura do aparelho

- **Pré-condição:** CT-01 executado.
- **Passos:** comparar `captured_at` com `created_at` das evidências.
- **Resultado esperado:** `captured_at` corresponde ao momento da foto no aparelho, e não ao momento do envio.
- **Resultado obtido:** fotos capturadas às 18:17:26 e 18:17:40 (UTC) e recebidas às 18:29:50 e 18:29:51 (UTC).
- **Status:** ✅ Aprovado.

### CT-04 — Armazenar o arquivo com checksum de integridade

- **Pré-condição:** CT-01 executado.
- **Passos:**
  1. Conferir o campo `checksum` das evidências.
  2. Listar os arquivos referenciados em `/app/evidences`.
- **Resultado esperado:** checksum SHA-256 preenchido e arquivo presente no armazenamento.
- **Resultado obtido:** checksums preenchidos; arquivos `07ba1d12-3559-4326-8b9f-4175ef2bb4d5.jpeg` (1.704.099 bytes) e `3908630f-360f-43e9-847d-3bbe3709a773.jpeg` (1.545.828 bytes) presentes.
- **Status:** ✅ Aprovado.

### CT-05 — Não duplicar a foto em reenvios

- **Pré-condição:** CT-01 executado após mais de uma sincronização.
- **Passos:**
  1. Contar as evidências gravadas para cada foto.
  2. Conferir as operações registradas em `processed_operations`.
  3. Executar o teste automatizado de reenvio.
- **Resultado esperado:** uma única evidência por foto; todo reenvio usa a mesma chave de idempotência.
- **Resultado obtido:** uma linha por foto; 10 operações `EVIDENCE_UPLOAD` para 10 evidências gravadas; o teste `sends the same UUID operationId on every attempt of the same photo` passou.
- **Status:** ✅ Aprovado.

### CT-06 — Manter a foto na fila sem conexão e permitir "Tentar novamente"

- **Pré-condição:** foto capturada e operação de envio na fila.
- **Passos:** simular falha de envio (sem resposta e resposta de erro do servidor) e acionar "Tentar novamente".
- **Resultado esperado:** a foto continua no aparelho e na fila; a nova tentativa reaproveita o mesmo arquivo sem criar outra evidência.
- **Resultado obtido:** testes `throws when the upload task yields no response`, `throws on a non-2xx response` e os testes do PBI-044 (arquivo preservado, "Tentar novamente" sem duplicar, estado mantido após reiniciar o app) passaram.
- **Status:** ✅ Aprovado.

### CT-07 — Concluir a inspeção e sincronizar o status

- **Pré-condição:** CT-01 executado.
- **Passos:**
  1. Concluir a inspeção 7 no app.
  2. Sincronizar.
  3. Consultar o status da inspeção 7 no banco.
- **Resultado esperado:** inspeção com status `SUBMITTED` no servidor.
- **Resultado obtido:** inspeção 7 com status `SUBMITTED` (versão 4).
- **Status:** ✅ Aprovado.

### CT-08 — Aceitar o reenvio de uma mudança de status já aplicada

- **Pré-condição:** inspeção já `IN_PROGRESS` no servidor.
- **Passos:** enviar `IN_PROGRESS` novamente com uma nova chave de operação.
- **Resultado esperado:** resposta 200 `ALREADY_APPLIED`, sem alterar a inspeção.
- **Resultado obtido:** teste `treatsTransitionToCurrentStatusAsAlreadyApplied` passou.
- **Status:** ✅ Aprovado.

### CT-09 — Validar os dados antes de enviar a foto

- **Pré-condição:** nenhuma.
- **Passos:** tentar enviar uma foto com chave de operação fora do formato UUID e com id de inspeção não numérico.
- **Resultado esperado:** o envio é bloqueado no app, sem chamada ao servidor.
- **Resultado obtido:** testes `rejects an operationId that is not a UUID` e `rejects a non-numeric inspection id` passaram.
- **Status:** ✅ Aprovado.

## 7. Testes automatizados de apoio

| Conjunto | Comando | Resultado |
|---|---|---|
| Mobile (Jest) | `cd mobile` e `npx jest` | 89/89 testes, 8/8 suítes |
| Mobile (lint) | `npx eslint src/infrastructure/sync src/test-stubs jest.config.js --max-warnings 0` | Sem avisos |
| Backend (Maven) | `cd api` e `.\mvnw.cmd test -Dtest=MobileStatusUpdateTest` | 4/4 testes, `BUILD SUCCESS` |

Principais testes do envio de evidências (`mobile/src/infrastructure/sync/__tests__/evidenceUploadClient.test.ts`):

| Teste | Verifica |
|---|---|
| posts multipart to /api/v1/inspections/{id}/evidence with the backend field names | Endereço, arquivo, autenticação e campos `itemId`, `mimeType`, `description`, `latitude`, `longitude`, `capturedAtDevice`, `operationId` |
| omits latitude/longitude unless both are present | Localização enviada somente com as duas coordenadas |
| derives the mime type from the file extension | Tipo do arquivo identificado pela extensão |
| returns the server evidence id and checksum on 201 | Leitura da confirmação do servidor |
| deterministicUuid is stable per seed | Chave de idempotência estável e única por foto |

## 8. Evidências da execução

Consulta em `inspection_evidences`:

| id | inspection_id | item snapshot | reference | captured_at (UTC) | created_at (UTC) |
|---|---|---|---|---|---|
| 9 | 7 | 19 | `07ba1d12-3559-4326-8b9f-4175ef2bb4d5.jpeg` | 2026-11-14 18:17:26 | 2026-11-14 18:29:50 |
| 10 | 7 | 20 | `3908630f-360f-43e9-847d-3bbe3709a773.jpeg` | 2026-11-14 18:17:40 | 2026-11-14 18:29:51 |

Arquivos em `/app/evidences`:

| Arquivo | Tamanho |
|---|---|
| `07ba1d12-3559-4326-8b9f-4175ef2bb4d5.jpeg` | 1.704.099 bytes |
| `3908630f-360f-43e9-847d-3bbe3709a773.jpeg` | 1.545.828 bytes |

## 9. Conclusão

A funcionalidade de envio de evidências fotográficas foi aprovada nos 9 casos de teste. As fotos capturadas no app chegam ao servidor na sincronização, vinculadas à inspeção e ao item corretos, com data de captura do aparelho, arquivo armazenado com checksum e sem duplicidade em reenvios. A inspeção concluída no app também chega ao servidor com status `SUBMITTED`.

## 10. Rastreabilidade

| Referência | Valor |
|---|---|
| Issue | [#229](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/229) |
| Endpoint | `POST /api/v1/inspections/{id}/evidence` ([#221](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/221)) |
| PBIs relacionados | PBI-042, PBI-043, PBI-044 (`docs/cronograma.md`) |
| Commits | `8265460`, `491696c`, `cf8bc06`, `864635b` |
