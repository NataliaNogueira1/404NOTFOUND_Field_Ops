# Plano de Implementação — Issue #229: Mobile Evidence Upload (contrato real do backend)

**Branch:** `feat/mobile-evidence-upload-sync`  
**Arquivos principais:** `EvidenceUploadClient.ts`, `InspectionSyncService.ts`, `.env.example`

---

## 1. Contexto lido do código

### `EvidenceUploadClient.ts` — estado atual

```typescript
// Guard que bloqueia TUDO — upload nunca ocorre se a variável não estiver "enabled"
const UPLOAD_ENABLED = process.env.EXPO_PUBLIC_EVIDENCE_UPLOAD === 'enabled';

export interface EvidenceUploadInput {
  inspectionId: string;
  itemId: string;
  responseId?: string;   // ✅ já existe
  localUri: string;      // ✅ já existe
  description?: string;  // ✅ já existe
  mimeType?: string;     // ✅ já existe
  // ❌ falta: capturedAt  (obrigatório pelo backend)
  // ❌ falta: operationId (obrigatório pelo backend — RN-068)
  // ❌ falta: latitude/longitude (opcionais)
}

export interface EvidenceUploadResult {
  status: 'APPLIED';
  storageKey?: string;
  // ❌ falta: serverId?: number  (campo "id" da resposta 201)
}

async upload(token, input): Promise<EvidenceUploadResult> {
  if (!UPLOAD_ENABLED) throw new Error('...'); // bloqueia aqui sempre
  // FormData monta: file, inspectionId (incorreto — backend espera no path),
  //                 itemId, responseId, description
  // ❌ falta: capturedAtDevice, operationId, mimeType no FormData
  // ❌ URL usa input.inspectionId (UUID) corretamente no path já
  // ❌ HTTP 409 não é tratado — lança erro quando deveria ser idempotência
}
```

### `InspectionSyncService.ts` — método `uploadEvidence` — estado atual

```typescript
private async uploadEvidence(token, evidenceId, payload: {
  inspectionId: string;
  itemId: string;
  responseId?: string;
  uri?: string;
  description?: string;
  // ❌ falta: capturedAt?: string  (já está no payload do enqueueEvidence!)
}): Promise<void> {
  const evidence = await this.evidenceRepo.getById(evidenceId);
  const localUri = evidence?.uri ?? payload.uri;
  if (!localUri) throw new Error('Evidence has no local file to upload.');

  await evidenceUploadClient.upload(token, {
    inspectionId: payload.inspectionId,
    itemId: payload.itemId,
    responseId: payload.responseId,
    localUri,
    description: payload.description,
    // ❌ NÃO passa capturedAt — já existe no payload (enqueueEvidence envia)
    // ❌ NÃO passa operationId — precisa vir de operation.id
    // ❌ NÃO passa latitude/longitude (Evidence não tem esses campos)
  });
}
```

### `enqueueEvidence` — o que já está no outbox payload

```typescript
// enqueueEvidence já serializa:
{
  inspectionId: evidence.inspectionId,
  itemId: unscopeItemId(evidence.itemId),
  responseId: evidence.responseId,
  uri: evidence.uri,
  description: evidence.description,
  capturedAt: evidence.capturedAt,  // ✅ já está aqui — só precisa ser lido
}
```

### `Evidence` em `types.ts` — ausência de lat/long

```typescript
export interface Evidence {
  id: string;
  inspectionId: string;
  itemId: string;
  description: string;
  uri?: string;
  capturedAt: string;
  syncStatus: SyncStatus;
  operationId?: string;
  responseId?: string;
  lastError?: string;
  retryCount?: number;
  // ❌ NÃO tem latitude/longitude — localização de evidência não é capturada hoje
}
```

### `.env.example` — estado atual

```
EXPO_PUBLIC_API_URL=http://10.0.2.2:8085
# EXPO_PUBLIC_EVIDENCE_UPLOAD ausente
```

---

## 2. Diff conceitual — antes/depois

### 2.1 `EvidenceUploadClient.ts`

**REMOVER:**
```typescript
const UPLOAD_ENABLED = process.env.EXPO_PUBLIC_EVIDENCE_UPLOAD === 'enabled';
```
```typescript
if (!UPLOAD_ENABLED) {
  throw new Error('Upload de evidência indisponível: ...');
}
```

**ATUALIZAR — `EvidenceUploadInput`:**
```typescript
// ANTES
export interface EvidenceUploadInput {
  inspectionId: string;
  itemId: string;
  responseId?: string;
  localUri: string;
  description?: string;
  mimeType?: string;
}

// DEPOIS
export interface EvidenceUploadInput {
  inspectionId: string;
  itemId: string;
  /** ISO-8601 — mapeado para capturedAtDevice no FormData (obrigatório pelo backend). */
  capturedAt: string;
  /** UUID de idempotência — campo operationId no FormData (RN-068). */
  operationId: string;
  responseId?: string;
  localUri: string;
  description?: string;
  mimeType?: string;
  /** Latitude para o par lat/long (opcional — Evidence não tem esses campos ainda). */
  latitude?: number;
  /** Longitude para o par lat/long (opcional — Evidence não tem esses campos ainda). */
  longitude?: number;
}
```

**ATUALIZAR — `EvidenceUploadResult`:**
```typescript
// ANTES
export interface EvidenceUploadResult {
  status: 'APPLIED';
  storageKey?: string;
}

// DEPOIS
export interface EvidenceUploadResult {
  status: 'APPLIED';
  storageKey?: string;
  /** ID numérico da evidência no servidor (campo "id" da resposta 201). */
  serverId?: number;
}
```

**ATUALIZAR — JSDoc da classe:**
```typescript
// ANTES (linha 1-18): descreve limitação "endpoint não existe"
// DEPOIS: documentar contrato real, remover aviso de endpoint ausente, manter
//         a nota sobre UUID vs Long no path param com TODO.
```

**ATUALIZAR — corpo do método `upload`:**

FormData antes (campos enviados):
- `inspectionId` ← incorreto (não é campo do form, está no path)
- `itemId`
- `responseId`
- `description`
- `file`

FormData depois (campos corretos conforme contrato):
```
file           → obrigatório
itemId         → obrigatório (já existe, mantém)
capturedAtDevice → obrigatório (= input.capturedAt)
operationId    → obrigatório (= input.operationId, RN-068)
responseId     → opcional (se input.responseId existir)
mimeType       → opcional (se input.mimeType existir)
description    → opcional (se input.description existir)
latitude       → opcional (SOMENTE se ambos latitude e longitude existirem)
longitude      → opcional (SOMENTE se ambos latitude e longitude existirem)
```

> **Remover** `form.append('inspectionId', ...)` — `inspectionId` vai no path, não no form.

URL:
```typescript
// ANTES
`${BASE_URL}/api/v1/inspections/${input.inspectionId}/evidence`

// DEPOIS (mantém UUID, adiciona TODO)
// TODO: o backend espera Long como path param {id}, mas o mobile usa UUID.
// Enquanto o backend não mapear UUID → Long neste endpoint, o path
// envia o UUID string. Rastrear em issue futura para alinhar o contrato.
`${BASE_URL}/api/v1/inspections/${input.inspectionId}/evidence`
```

Tratamento de resposta:
```typescript
// ANTES
if (!response.ok) throw new Error(`Upload falhou (API ${response.status}): ...`);
const data = ... as { storageKey?: string };
return { status: 'APPLIED', storageKey: data.storageKey };

// DEPOIS
// 409 = idempotência já aplicada → retornar APPLIED sem lançar erro (RN-068)
if (response.status === 409) {
  return { status: 'APPLIED' };
}
if (!response.ok) {
  const message = await response.text().catch(() => response.statusText);
  throw new Error(`Upload falhou (API ${response.status}): ${message}`);
}
// 201 → { id: number, checksum: string }
const data = ... as { id?: number; checksum?: string };
return { status: 'APPLIED', storageKey: data.checksum, serverId: data.id };
```

---

### 2.2 `InspectionSyncService.ts`

**ATUALIZAR — tipo inline do payload do `uploadEvidence`:**
```typescript
// ANTES
payload: {
  inspectionId: string;
  itemId: string;
  responseId?: string;
  uri?: string;
  description?: string;
}

// DEPOIS
payload: {
  inspectionId: string;
  itemId: string;
  responseId?: string;
  uri?: string;
  description?: string;
  capturedAt?: string; // adicionado: vem do enqueueEvidence (evidence.capturedAt)
}
```

**ATUALIZAR — chamada ao `evidenceUploadClient.upload` dentro de `uploadEvidence`:**
```typescript
// ANTES
await evidenceUploadClient.upload(token, {
  inspectionId: payload.inspectionId,
  itemId: payload.itemId,
  responseId: payload.responseId,
  localUri,
  description: payload.description,
});

// DEPOIS
await evidenceUploadClient.upload(token, {
  inspectionId: payload.inspectionId,
  itemId: payload.itemId,
  // capturedAt: obrigatório — prefere payload, fallback para o que veio do DB (RN-074)
  capturedAt: payload.capturedAt ?? evidence?.capturedAt ?? new Date().toISOString(),
  // operationId: chave de idempotência (RN-068) — usa o id da operação do outbox
  operationId: operation.id,
  responseId: payload.responseId,
  localUri,
  description: payload.description,
  // mimeType: não está no payload nem na Evidence — omitido (backend usa image/jpeg como default)
  // latitude/longitude: Evidence não tem esses campos hoje
  // TODO: quando Evidence incluir latitude/longitude, passá-los aqui.
  //       Rastrear em issue futura (EP-08).
});
```

> **Atenção:** `uploadEvidence` recebe `(token, evidenceId, payload)` mas NÃO recebe
> `operation` diretamente. O `operation.id` que precisamos é o id do outbox row — que é
> o `operationId` estável gerado por `evidenceOperationId(evidence.id)`.
> **Solução:** passar `operation.id` adicionando-o ao parâmetro ou calculando
> `InspectionSyncService.evidenceOperationId(evidenceId)` — que é determinístico e
> já existe como método estático. Assim não é preciso mudar a assinatura de
> `sendOperation`.

Concretamente, dentro de `uploadEvidence`:
```typescript
// O id do outbox row é determinístico: evidenceOperationId(evidenceId)
const outboxOperationId = InspectionSyncService.evidenceOperationId(evidenceId);
await evidenceUploadClient.upload(token, {
  ...
  operationId: outboxOperationId,
  ...
});
```

---

### 2.3 `.env.example`

```diff
 # URL base da API FieldOps
 # - Emulador Android: http://10.0.2.2:8085
 # - Dispositivo físico na mesma rede: http://<IP_DA_MAQUINA>:8085
 # - iOS Simulator: http://localhost:8085
 EXPO_PUBLIC_API_URL=http://10.0.2.2:8085
+
+# [LEGADO] Flag que controlava o upload de evidências enquanto o endpoint backend
+# ainda não existia. O upload agora é sempre ativo (endpoint implementado em #221).
+# Esta variável não tem mais efeito e pode ser ignorada.
+# EXPO_PUBLIC_EVIDENCE_UPLOAD=enabled
```

---

## 3. Ordem de implementação

### Passo 1 — `EvidenceUploadClient.ts` (arquivo independente, sem dependências)

1. Atualizar JSDoc da classe: remover aviso de "endpoint não existe", documentar contrato real (POST `/api/v1/inspections/{id}/evidence`, multipart, 201 `{id, checksum}`).
2. Remover a constante `UPLOAD_ENABLED` e sua leitura de `EXPO_PUBLIC_EVIDENCE_UPLOAD`.
3. Adicionar campos `capturedAt: string`, `operationId: string`, `latitude?: number`, `longitude?: number` à interface `EvidenceUploadInput`.
4. Adicionar campo `serverId?: number` à interface `EvidenceUploadResult`.
5. No corpo de `upload()`:
   - Remover o bloco `if (!UPLOAD_ENABLED) { throw ... }`.
   - Remover `form.append('inspectionId', ...)` (não é campo do form, vai no path).
   - Adicionar ao FormData: `capturedAtDevice` (= `input.capturedAt`), `operationId` (= `input.operationId`).
   - Adicionar opcionais ao FormData: `mimeType` (se presente), `latitude`+`longitude` (somente se AMBOS presentes).
   - Adicionar o TODO sobre UUID vs Long no path param.
   - Inserir tratamento de HTTP 409 antes do `!response.ok`: retornar `{ status: 'APPLIED' }`.
   - Atualizar parse da resposta 201 para `{ id?: number; checksum?: string }` e retornar `{ status: 'APPLIED', storageKey: data.checksum, serverId: data.id }`.

**Commit:** `✨ feat: update EvidenceUploadClient to real backend contract`

---

### Passo 2 — `InspectionSyncService.ts` — método `uploadEvidence`

> Depende do Passo 1 (a interface `EvidenceUploadInput` já terá os novos campos obrigatórios, o TypeScript vai exigir que o caller os forneça).

1. Atualizar o tipo inline do parâmetro `payload` de `uploadEvidence` para incluir `capturedAt?: string`.
2. Calcular `outboxOperationId` usando o método estático determinístico:
   ```typescript
   const outboxOperationId = InspectionSyncService.evidenceOperationId(evidenceId);
   ```
3. Passar `capturedAt` e `operationId` ao `evidenceUploadClient.upload()`:
   ```typescript
   capturedAt: payload.capturedAt ?? evidence?.capturedAt ?? new Date().toISOString(),
   operationId: outboxOperationId,
   ```
4. Adicionar o TODO sobre `latitude`/`longitude` ausentes na entidade `Evidence`.

**Commit:** `✨ feat: pass capturedAt and operationId to evidence upload`

---

### Passo 3 — `.env.example`

1. Adicionar bloco comentado documentando `EXPO_PUBLIC_EVIDENCE_UPLOAD` como variável legada.

**Commit:** `📝 docs: update .env.example for evidence upload flag`

---

## 4. Checklist de verificação pós-implementação

### TypeScript
- [ ] `npx tsc --noEmit` (ou `npx expo export --platform android --dry-run`) no diretório `mobile/` — zero erros de tipagem.
- [ ] O campo `capturedAt: string` é obrigatório em `EvidenceUploadInput` → o TypeScript deve acusar erro se `uploadEvidence` não o fornecer (verifica que o contrato foi aplicado).
- [ ] O campo `operationId: string` é obrigatório em `EvidenceUploadInput` → idem.

### Guard removido
- [ ] Buscar `EXPO_PUBLIC_EVIDENCE_UPLOAD` em `EvidenceUploadClient.ts` — nenhuma ocorrência restante além do comentário legado.
- [ ] Buscar `UPLOAD_ENABLED` em `EvidenceUploadClient.ts` — zero ocorrências.
- [ ] O método `upload()` NÃO contém `throw new Error('Upload de evidência indisponível')`.

### Campos obrigatórios no FormData
- [ ] `form.append('file', ...)` → presente.
- [ ] `form.append('itemId', ...)` → presente.
- [ ] `form.append('capturedAtDevice', input.capturedAt)` → presente.
- [ ] `form.append('operationId', input.operationId)` → presente.
- [ ] `form.append('inspectionId', ...)` → **ausente** (foi removido — vai no path).

### Campos opcionais no FormData
- [ ] `responseId` → só appenda se `input.responseId` for truthy.
- [ ] `mimeType` → só appenda se `input.mimeType` for truthy.
- [ ] `description` → só appenda se `input.description` for truthy.
- [ ] `latitude`/`longitude` → só appenda se **ambos** estiverem presentes.

### HTTP 409 (idempotência — RN-068)
- [ ] Quando `response.status === 409`, o método retorna `{ status: 'APPLIED' }` sem lançar erro.
- [ ] Outros status não-2xx (400, 403, 404, 422, 5xx) lançam `Error`.

### Resposta 201
- [ ] O parse da resposta 201 usa `{ id?: number; checksum?: string }`.
- [ ] `serverId` é mapeado do campo `id` da resposta.
- [ ] `storageKey` é mapeado do campo `checksum` da resposta.

### `InspectionSyncService.ts`
- [ ] O tipo inline de `payload` em `uploadEvidence` inclui `capturedAt?: string`.
- [ ] `capturedAt` é passado ao `upload()` com fallback: `payload.capturedAt ?? evidence?.capturedAt ?? new Date().toISOString()`.
- [ ] `operationId` é passado ao `upload()` usando `InspectionSyncService.evidenceOperationId(evidenceId)`.
- [ ] TODO sobre `latitude`/`longitude` ausentes na entidade `Evidence` está presente como comentário.
- [ ] A lógica de dependências do outbox (`dependencyIds`), retry, e marcação SYNCED/FAILED **não foi alterada**.

### TODO sobre UUID vs Long
- [ ] Comentário TODO presente na URL de `EvidenceUploadClient.upload()` explicando que o backend espera `Long` mas o mobile passa UUID.

### `.env.example`
- [ ] Arquivo contém a linha comentada `# EXPO_PUBLIC_EVIDENCE_UPLOAD=enabled` com explicação de que é variável legada.

### Regras de negócio
- [ ] **RN-047**: nenhuma linha de código apaga arquivo local em caso de falha — verificar que `uploadEvidence` só lança erro (o caller em `pushPendingOperations` chama `evidenceRepo.markFailed`, não remove o arquivo).
- [ ] **RN-068**: `operationId` está sendo enviado no FormData → backend pode detectar reenvio.
- [ ] **RN-078**: upload de evidência continua em fluxo separado do `sync/push` estruturado.
- [ ] **RN-069**: a lógica de `dependencyIds` em `enqueueEvidence` não foi alterada.

---

## 5. Notas e limitações documentadas

| Limitação | Onde documentar | Ação |
|-----------|-----------------|------|
| `Evidence` não tem `latitude`/`longitude` | TODO no `uploadEvidence` do `InspectionSyncService.ts` | Issue futura EP-08 |
| Path param `{id}` do backend espera `Long`, mobile usa UUID | TODO na URL de `EvidenceUploadClient.ts` | Alinhar contrato com backend futuramente |
| `mimeType` não está na entidade `Evidence` nem no payload do outbox | Omitido (backend usa `image/jpeg` como default) | Sem ação no MVP |
| `responseId` ainda não é persistido pelo backend (forward-compat) | Comentário existente mantido | Sem ação no MVP |
