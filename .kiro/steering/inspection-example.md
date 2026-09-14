---
inclusion: manual
---

# FieldOps — Exemplo Completo de Inspeção

Este documento serve como referência para implementação. Mostra exatamente como os dados fluem do agendamento até a aprovação.

---

## Contexto do Exemplo

- **Cliente:** Indústria Modelo Ltda.
- **Local:** Unidade Sorocaba - Galpão de Produção 02
- **Equipamento:** Compressor de Ar XPTO 500 (QR: COMP-004)
- **Modelo:** Inspeção Preventiva de Compressor (Versão 3)
- **Técnico:** Carlos Henrique
- **Supervisor:** Marina

---

## 1. Modelo de Inspeção (criado pela supervisora)

### Seção 1: Condições Gerais (3 itens)

| # | Pergunta | Tipo | Obrigatório | Obs. na falha | Evid. na falha |
|---|---|---|---|---|---|
| 1 | A placa de identificação está presente e legível? | CONFORMITY | Sim | Sim | Sim |
| 2 | O equipamento está limpo e conservado? | CONFORMITY | Sim | Sim | Sim |
| 3 | A estrutura externa está livre de danos? | CONFORMITY | Sim | Não | Não |

### Seção 2: Segurança (3 itens)

| # | Pergunta | Tipo | Obrigatório | Obs. na falha | Evid. na falha |
|---|---|---|---|---|---|
| 4 | Proteções das partes móveis instaladas? | CONFORMITY | Sim | Sim | Sim |
| 5 | Etiquetas de advertência visíveis? | CONFORMITY | Sim | Sim | Sim |
| 6 | Botão de emergência funcionando? | BOOLEAN | Sim | Não | Não |

### Seção 3: Sistema Elétrico (3 itens)

| # | Pergunta | Tipo | Obrigatório | Obs. na falha | Evid. na falha |
|---|---|---|---|---|---|
| 7 | Cabos elétricos íntegros? | CONFORMITY | Sim | Sim | Sim |
| 8 | Painel elétrico fechado e sem aquecimento? | CONFORMITY | Sim | Não | Não |
| 9 | Resistência do aterramento (Ω)? | NUMBER | Sim | Não | Não |

### Seção 4: Funcionamento (3 itens)

| # | Pergunta | Tipo | Obrigatório | Obs. na falha | Evid. na falha |
|---|---|---|---|---|---|
| 10 | Opera sem ruídos/vibrações anormais? | CONFORMITY | Sim | Sim | Sim |
| 11 | Pressão de operação (bar)? | NUMBER | Sim | Não | Não |
| 12 | Temperatura de operação (°C)? | NUMBER | Sim | Não | Não |

---

## 2. Agendamento (supervisora na web admin)

```json
POST /api/v1/inspections
{
  "templateVersionId": "uuid-version-3",
  "clientId": "uuid-industria-modelo",
  "siteId": "uuid-sorocaba",
  "equipmentId": "uuid-compressor-004",
  "technicianId": "uuid-carlos",
  "supervisorId": "uuid-marina",
  "priority": "MEDIUM",
  "scheduledFor": "2026-08-03T09:00:00Z",
  "instructions": "Verificar condição da bateria com atenção especial. Último relatório indicou início de corrosão."
}
```

**Resultado:** Inspeção criada com 12 InspectionItemSnapshot, estado ASSIGNED.

---

## 3. Sincronização pelo técnico (mobile)

```json
GET /api/v1/mobile/sync/pull?cursor=2026-08-02T00:00:00Z

Response:
{
  "inspections": [{ id, title, status: "ASSIGNED", priority, scheduledFor, instructions, ... }],
  "clients": [{ id: "uuid-industria-modelo", name: "Indústria Modelo" }],
  "sites": [{ id: "uuid-sorocaba", name: "Unidade Sorocaba", address: "..." }],
  "equipment": [{ id: "uuid-compressor-004", name: "Compressor XPTO 500", qrCode: "COMP-004" }],
  "snapshots": [/* 12 itens com section_title, item_title, response_type, etc. */],
  "nextCursor": "2026-08-02T08:15:00Z"
}
```

App salva tudo no SQLite. Inspeção aparece na lista.

---

## 4. Início da inspeção (técnico no campo)

Técnico abre a inspeção → confirma início.

**Operação criada na outbox:**
```json
{
  "operationId": "op-001-uuid",
  "entityType": "INSPECTION",
  "entityId": "uuid-inspection",
  "operationType": "TRANSITION",
  "baseVersion": 0,
  "payload": {
    "status": "IN_PROGRESS",
    "startedAtDevice": "2026-08-03T09:15:00-03:00",
    "location": { "latitude": -23.5015, "longitude": -47.4526, "accuracy": 8.5 }
  }
}
```

---

## 5. Preenchimento do checklist

### Resposta ao item 1 (Conforme)
```json
// Salvo no SQLite imediatamente
{
  "id": "resp-001-uuid",
  "inspectionItemId": "snapshot-item-1-uuid",
  "conformity": "CONFORMING",
  "observation": "Placa presente e legível",
  "answeredAtDevice": "2026-08-03T09:20:00-03:00"
}

// Outbox
{
  "operationId": "op-002-uuid",
  "entityType": "INSPECTION_RESPONSE",
  "entityId": "resp-001-uuid",
  "operationType": "UPSERT",
  "baseVersion": 0,
  "payload": { /* resposta acima */ }
}
```

### Resposta ao item 7 (Não Conforme → exige observação + evidência)
```json
{
  "id": "resp-007-uuid",
  "inspectionItemId": "snapshot-item-7-uuid",
  "conformity": "NON_CONFORMING",
  "observation": "Cabo de alimentação com desgaste na cobertura externa",
  "answeredAtDevice": "2026-08-03T09:35:00-03:00"
}
```

### Evidência vinculada ao item 7
```json
// SQLite
{
  "id": "evid-004-uuid",
  "inspectionId": "uuid-inspection",
  "responseId": "resp-007-uuid",
  "type": "PHOTO",
  "localUri": "file:///data/fieldops/photos/evid-004.jpg",
  "mimeType": "image/jpeg",
  "sizeBytes": 1245000,
  "capturedAtDevice": "2026-08-03T09:36:00-03:00",
  "latitude": -23.5015,
  "longitude": -47.4526
}

// Outbox (com dependência)
{
  "operationId": "op-008-uuid",
  "entityType": "EVIDENCE",
  "entityId": "evid-004-uuid",
  "operationType": "UPLOAD",
  "payload": { /* metadados */ },
  "dependencyIds": ["op-007-uuid"]  // só enviar após a resposta ser confirmada
}
```

### Não conformidade criada para item 7
```json
{
  "id": "nc-003-uuid",
  "inspectionId": "uuid-inspection",
  "inspectionItemId": "snapshot-item-7-uuid",
  "responseId": "resp-007-uuid",
  "title": "Cabo elétrico danificado",
  "description": "Desgaste na cobertura externa do cabo de alimentação. Risco de choque.",
  "severity": "CRITICAL",
  "status": "OPEN",
  "createdAtDevice": "2026-08-03T09:37:00-03:00"
}
```

### Resposta numérica ao item 9 (aterramento)
```json
{
  "id": "resp-009-uuid",
  "inspectionItemId": "snapshot-item-9-uuid",
  "valueNumber": 4.2,
  "conformity": "CONFORMING",
  "answeredAtDevice": "2026-08-03T09:40:00-03:00"
}
```

---

## 6. Conclusão offline

Técnico perde internet no galpão. Continua preenchendo normalmente (tudo salva no SQLite).

Ao concluir:
- App valida: 12/12 itens respondidos ✓
- Itens com obs obrigatória na falha: todos preenchidos ✓
- Itens com evidência obrigatória na falha: todos com foto ✓
- Técnico confirma conclusão

```json
// Outbox
{
  "operationId": "op-015-uuid",
  "entityType": "INSPECTION",
  "entityId": "uuid-inspection",
  "operationType": "TRANSITION",
  "payload": {
    "status": "SUBMITTED",
    "completedAtDevice": "2026-08-03T10:05:00-03:00",
    "location": { "latitude": -23.5015, "longitude": -47.4526, "accuracy": 12.0 }
  }
}
```

UI mostra: "✓ Inspeção concluída. Aguardando sincronização (15 operações pendentes)"

---

## 7. Sincronização (quando internet retorna)

```json
POST /api/v1/mobile/sync/push
{
  "deviceId": "device-uuid",
  "lastPullCursor": "2026-08-02T08:15:00Z",
  "operations": [
    { "operationId": "op-001-uuid", "entityType": "INSPECTION", "operationType": "TRANSITION", ... },
    { "operationId": "op-002-uuid", "entityType": "INSPECTION_RESPONSE", "operationType": "UPSERT", ... },
    // ... 12 respostas + 5 evidências + 4 NCs + 2 transições = ~23 operações
    { "operationId": "op-015-uuid", "entityType": "INSPECTION", "operationType": "TRANSITION", ... }
  ]
}

Response:
{
  "results": [
    { "operationId": "op-001-uuid", "status": "APPLIED", "entityVersion": 1 },
    { "operationId": "op-002-uuid", "status": "APPLIED", "entityVersion": 1 },
    // ... todas APPLIED
    { "operationId": "op-015-uuid", "status": "APPLIED", "entityVersion": 3 }
  ],
  "serverTime": "2026-08-03T11:20:00Z"
}
```

App marca todas como COMPLETED. UI: "✓ Sincronizado às 11:20"

---

## 8. Revisão pela supervisora (web admin)

Supervisora vê na lista: "Inspeção Compressor XPTO 500 — Aguardando revisão"

Abre a inspeção → visualiza:
- 12 itens respondidos
- 8 conformes, 4 não conformes
- 4 não conformidades (1 crítica, 2 moderadas, 1 leve)
- 6 evidências fotográficas

Clica "Iniciar Revisão" → estado muda para UNDER_REVIEW

Após analisar:
```json
POST /api/v1/inspections/{id}/approve
{
  "comments": "Inspeção aprovada. NC crítica do cabo elétrico encaminhada para manutenção."
}
```

Estado → APPROVED. Registra InspectionReview com decision=APPROVED.

---

## 9. Resultado Final

Na próxima sync do técnico, a inspeção aparece como APPROVED ✓

**Dados preservados permanentemente:**
- Snapshot dos 12 itens (mesmo se modelo mudar)
- 12 respostas com horários do dispositivo
- 6 evidências com metadados + localização
- 4 não conformidades
- 1 registro de revisão
- ~15 eventos de auditoria

---

## Cenário Alternativo: Reprovação

Se a supervisora reprovasse:
```json
POST /api/v1/inspections/{id}/reject
{
  "reason": "A foto do item 4 não mostra claramente a proteção lateral. Refazer.",
  "itemsToCorrect": ["snapshot-item-4-uuid"]
}
```

Na sync do técnico:
- Inspeção aparece como REJECTED com badge "Correção necessária"
- Motivo exibido: "A foto do item 4 não mostra..."
- Técnico pode editar somente o item indicado
- Após corrigir → nova conclusão → nova sync → nova revisão
