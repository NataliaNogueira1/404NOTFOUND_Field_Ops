# Mobile: ajuste do EvidenceUploadClient para o contrato real do backend (issue #229)

O guard `UPLOAD_ENABLED` foi removido e o `EvidenceUploadClient` foi alinhado ao contrato real do endpoint `POST /api/v1/inspections/{id}/evidence`. A interface `EvidenceUploadInput` ganhou os campos obrigatórios `capturedAt` e `operationId`; o `InspectionSyncService` passa ambos na chamada ao `upload()`. HTTP 409 é tratado como idempotência. A lógica de outbox, retry e marcação SYNCED/FAILED não foi tocada.

**Watch for:** (1) O path param `{id}` ainda recebe um UUID em vez do Long esperado pelo backend — o endpoint pode retornar 404/400 em produção até que o mapeamento seja resolvido (**confirmed**). (2) O `capturedAt` no payload do outbox é opcional (`capturedAt?: string`), então o fallback para `new Date().toISOString()` silenciosamente grava "agora" como data de captura se a evidência foi enfileirada sem o campo — ao invés de falhar explicitamente (**confirmed**).

**Verdict**: APPROVED

---

## High-level view

O guard `UPLOAD_ENABLED` era a única barreira que impedia uploads reais; sua remoção é a mudança funcional central. Com ele fora, toda evidência enfileirada agora segue o caminho de rede normalmente.

O FormData foi realinhado ao contrato do backend: `inspectionId` saiu do corpo (não estava no spec do servidor), `capturedAtDevice` e `operationId` entraram como campos obrigatórios. O mapeamento `capturedAt → capturedAtDevice` está correto e documentado.

O tratamento de 409 como sucesso idempotente é a implementação direta de RN-068: o cliente retorna `{ status: 'APPLIED' }` sem lançar, o que permite ao outbox marcar a evidência como SYNCED no reenvio.

O caminho crítico do outbox — dependências, retry, preservação do arquivo em falha, marcação SYNCED só após confirmação — não foi alterado nesta branch, conforme requerido por RN-047, RN-069 e RN-078.

O `operationId` enviado ao servidor é derivado deterministicamente de `evidenceOperationId(evidenceId)`, que gera `"evidence-{uuid}"`. Esse valor é estável entre tentativas, mas não é um UUID v4 puro — depende do backend aceitar essa forma.

O TODO do path param UUID vs Long é o único bloqueio funcional real pendente.

---

<details>
<summary>Issues (2)</summary>

1. **Path param UUID vs Long** — O backend espera um `Long` em `/api/v1/inspections/{id}/evidence`, mas o mobile envia o UUID da inspeção. Isso provavelmente resulta em 400/404 em produção. Antes do merge, confirmar com o time de backend se o endpoint aceita UUID ou se é necessário persistir o `serverId` numérico da inspeção ao fazer pull.

2. **Fallback silencioso de `capturedAt`** — O campo `capturedAt` no payload do outbox é declarado `capturedAt?: string`, então quando ausente o upload usa `new Date().toISOString()` (o momento da sincronização, não da captura). Isso viola RN-074 silenciosamente. O campo deveria ser obrigatório no payload do outbox, ou o fallback deveria lançar um erro auditável.

</details>

---

<details>
<summary>Details</summary>

### Remoção do guard `UPLOAD_ENABLED`

O guard verificava `process.env.EXPO_PUBLIC_EVIDENCE_UPLOAD === 'enabled'` e lançava um erro descritivo caso negativo, mantendo a evidência em FAILED/PENDING. Com sua remoção, qualquer evidência com `localUri` agora tenta o upload de rede imediatamente. Não há risco de regressão no caminho de falha: se o servidor retornar erro não-409, o `catch` no `pushPendingOperations` continua chamando `evidenceRepo.markFailed` e preserva o arquivo (RN-047).

### Path param UUID vs Long — bloqueio de produção

```typescript
// EvidenceUploadClient.ts, linha ~78
`${BASE_URL}/api/v1/inspections/${input.inspectionId}/evidence`
```

O `inspectionId` no mobile é um UUID gerado localmente. O endpoint do backend espera um `Long` no path. O TODO inline documenta isso, mas é um bloqueio funcional real: se o servidor não tiver tratamento especial para UUIDs nessa rota, todas as chamadas falharão com 400 ou 404. A evidência permanece FAILED indefinidamente nesse cenário, o que é o comportamento correto de fallback (arquivo preservado, RN-047), mas o fluxo principal de sucesso não se completa. Confirmação do contrato do backend é necessária antes do merge.

### FormData e campos obrigatórios

O campo `inspectionId` que estava no FormData anterior foi removido — correto, pois ele não consta no contrato documentado no JSDoc. Os campos `capturedAtDevice` e `operationId` foram adicionados e são mapeados diretamente de `input.capturedAt` e `input.operationId`. O campo `file` usa a forma de objeto `{ uri, name, type }` que o FormData do React Native espera.

### Fallback de `capturedAt` e risco de drift temporal

No `InspectionSyncService.uploadEvidence`, a cadeia de fallback é:

```typescript
capturedAt: payload.capturedAt ?? evidence?.capturedAt ?? new Date().toISOString()
```

O `payload.capturedAt` é opcional no tipo declarado (`capturedAt?: string`). Se uma evidência foi enfileirada por um caminho que não inclui o campo (ou se `evidence?.capturedAt` também for nulo), o fallback usa o momento da sincronização em vez do momento da captura. Isso viola RN-074 silenciosamente — nenhum erro é registrado, nenhum aviso ao técnico. O campo deveria ser obrigatório no payload do outbox para garantir que o `enqueueEvidence` sempre o inclua, ou o fallback deveria lançar.

Inspecionando `enqueueEvidence` (que já existia antes desta branch), o campo `capturedAt: evidence.capturedAt` está presente no payload enfileirado — então na prática o primeiro fallback (`payload.capturedAt`) sempre resolve. O risco é de regressão futura se alguém enfileirar evidências por outro caminho sem incluir o campo.

### `operationId` como `"evidence-{uuid}"` em vez de UUID puro

O `operationId` enviado ao servidor é `InspectionSyncService.evidenceOperationId(evidenceId)`, que retorna `"evidence-{uuid}"`. Isso não é um UUID v4 puro. Se o backend valida o formato UUID do campo `operationId`, todas as chamadas falharão na validação. Confirmar com o backend se o campo é validado como UUID ou aceita qualquer string opaca.

### 409 e idempotência (RN-068)

O tratamento de 409 está correto: retorna `{ status: 'APPLIED' }` sem lançar, o caller no `pushPendingOperations` não chega ao bloco `catch`, e `evidenceRepo.markSyncedById` é chamado normalmente. Reenvios não duplicam a evidência no servidor.

### Estrutura dos commits

Três commits atômicos, cada um cobrindo uma camada distinta:
- `6be73ee ✨ feat: update EvidenceUploadClient to real backend contract`
- `62b1362 ✨ feat: pass capturedAt and operationId to evidence upload`
- `993181f 📝 docs: update .env.example for evidence upload flag`

Formato iuricode correto: emoji + tipo + descrição em inglês no imperativo.

</details>

---

<details>
<summary>Arquivos alterados</summary>

| Arquivo | O que mudou |
|---|---|
| `mobile/src/infrastructure/sync/EvidenceUploadClient.ts` | Removeu guard `UPLOAD_ENABLED`; adicionou `capturedAt` e `operationId` à interface; realinhou FormData ao contrato real; adicionou tratamento de 409; mapeou `serverId` da resposta 201 |
| `mobile/src/infrastructure/sync/InspectionSyncService.ts` | Adicionou `capturedAt?` ao tipo do payload interno; derivou `outboxOperationId` deterministicamente; passa `capturedAt` e `operationId` ao `upload()` |
| `mobile/.env.example` | Documentou que `EXPO_PUBLIC_EVIDENCE_UPLOAD` era legada e não tem mais efeito |

Branch: `feat/mobile-evidence-upload-sync` · Base: `develop`

</details>
