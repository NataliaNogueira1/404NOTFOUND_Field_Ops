# Análise de Integração — FieldOps

> Gerado em: 20/10/2026
> Baseado na verificação direta do código do repositório (backend, frontend web e mobile).

---

## Backend — 100% concluído (Sprint 1 + Sprint 2)

O backend está totalmente pronto. Todos os 37 endpoints relevantes existem, são protegidos por role e têm migrações Flyway (V1–V26, sem V22).

| Grupo | Endpoints |
|-------|-----------|
| Autenticação | `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me` |
| Usuários | `GET/POST/PUT /users`, `PATCH /{id}/status` |
| Clientes | `GET/POST/PUT /clients`, `PATCH /{id}/status` |
| Locais | `GET/POST/PUT /sites`, `PATCH /{id}/status` |
| Equipamentos | `GET/POST/PUT /equipment`, `PATCH /{id}/status`, `GET /equipment/by-qr/{qrCode}` |
| Modelos | CRUD de templates, seções, itens + `POST /{id}/publish` + `GET /{id}/preview` |
| Inspeções | `POST /inspections`, `GET /inspections`, `PATCH /{id}/cancel`, `POST /{id}/approve`, `POST /{id}/reject`, `POST /{id}/begin-review` |
| Revisão | `GET /inspections/{id}/review`, `GET /inspection-evidences/{id}/content` |
| Comentários de revisão | `GET /inspections/{id}/review-comments`, `POST /inspections/{id}/items/{itemId}/review-comment` |
| Histórico de respostas | `GET /inspections/{id}/answers/history` |
| Auditoria | `GET /inspections/{id}/history` |
| Dashboard | `GET /dashboard/summary` (filtros: `from`, `to`, `clientName`) |
| Relatório PDF | `GET /inspections/{id}/report.pdf` |
| Exportação CSV | `GET /inspections/export.csv` |
| Não conformidades | `GET /non-conformities` |
| Notificações push | `POST /devices/register` |
| Sync mobile | `POST /mobile/sync/push` (aplica `INSPECTION_STATUS`, `ANSWER_UPSERT`, `EVIDENCE_CREATE`, `NON_CONFORMITY_CREATE`) |
| Sync pull | `GET /mobile/inspections` |
| Seed / demonstração | `DemoSeedRunner` ativo em profiles `dev` e `demo` |

**Resumo: Sprint 1 — 23/23 (100%) · Sprint 2 — 14/14 (100%)**

---

## Frontend Web

### ✅ Integrado à API real

| Módulo | Endpoints consumidos |
|--------|---------------------|
| Autenticação / sessão | `POST /auth/login`, `GET /auth/me`, `POST /auth/refresh` (interceptor single-flight) |
| CRUD de usuários | `GET/POST/PUT /users`, `PATCH /{id}/status` |
| CRUD de clientes (lista) | `GET/POST/PUT /clients`, `PATCH /{id}/status` |
| CRUD de locais | `GET/POST/PUT /sites`, `PATCH /{id}/status` |
| CRUD de equipamentos | `GET/POST/PUT /equipment`, `PATCH /{id}/status`, `/by-qr` |
| Construtor de modelos | Templates, seções e itens via `adminCatalog.ts` + publicação |
| Prévia do checklist | `GET /inspection-templates/{id}/preview` |
| Agendamento de inspeção | `POST /inspections` com seleção encadeada cliente → local → equip → técnico |
| Lista de inspeções | `GET /inspections` com filtros e paginação |
| Cancelar inspeção | `POST /inspections/{id}/cancel` |
| Fila de revisão | `GET /inspections?review=true` |
| Revisão (seções / itens / lightbox) | `GET /inspections/{id}/review`, `GET /inspection-evidences/{id}/content` |
| Aprovar / Reprovar | `POST /inspections/{id}/approve`, `POST /inspections/{id}/reject` |
| Histórico de respostas | `GET /inspections/{id}/answers/history` |
| Relatório PDF | `GET /inspections/{id}/report.pdf` (download autenticado via Blob URL) |
| Auditoria | `GET /inspections/{id}/history` |
| Não conformidades | `GET /non-conformities` com filtros e paginação |
| Dashboard | `GET /dashboard/summary` com filtros de período e cliente |
| Portal do técnico (web) | `GET /mobile/inspections` via `mobileInspectionsApi` |
| Comentários de revisão (camada API) | `inspectionReviewApi.listComments` e `addComment` já mapeados em `inspectionReview.ts` |

**Resumo: Sprint 1 — 16/16 (100%) · Sprint 2 — ~54% (7/13)**

---

### ❌ O que ainda falta no Frontend Web

#### 1. Comentários de revisão — UI não existe (PBI-089) · issue #151

A camada de API está pronta (`inspectionReviewApi.listComments` / `addComment` em `src/api/inspectionReview.ts`), mas não existe nenhuma tela, componente ou integração visual que exiba ou permita adicionar comentários por item na `InspectionReviewPage`.

**O que falta:** criar o componente de comentários e integrá-lo à página de revisão.

---

#### 2. Exportação CSV — botão não existe (PBI-092) · issue #154

O endpoint `GET /inspections/export.csv` está pronto no backend. Não há função de download no frontend (`src/api/inspectionReport.ts` só tem `downloadPdf`) e não há botão na `InspectionsPage`.

**O que falta:** adicionar `exportCsv` em `inspectionReport.ts` e o botão de download na tela de inspeções.

---

#### 3. Páginas de detalhe de cliente/local ainda usam mocks

`ClientDetailsPage` e `ClientSiteDetailsPage` (em `src/pages/catalog/ClientsPage.tsx`) ainda usam `seedClients`, `seedSites` e `seedEquipment` de `@/mocks/domain` como estado inicial e para operações de edição e estrutura.

A listagem principal e os formulários de criação **já estão integrados**. O problema está na view de detalhe: a aba de locais e a aba de equipamentos do local operam sobre estado local com dados mockados — edições feitas ali não persistem no backend.

**O que falta:** integrar `ClientDetailsPage` e `ClientSiteDetailsPage` à API real de locais e equipamentos, removendo a dependência de `@/mocks/domain`.

---

#### 4. "Iniciar revisão" formal não existe (PBI-059 — parcial)

`inspectionReviewApi.beginReview` está mapeado no cliente (`POST /inspections/{id}/begin-review`), mas não há botão ou ação na `InspectionReviewPage` para disparar essa transição. Aprovar e reprovar funcionam, mas o estado `UNDER_REVIEW` nunca é acionado formalmente pelo usuário.

---

#### 5. Deploy / publicação sem configuração (PBI-069 — parcial)

O CI (`frontend-ci.yml`) roda lint, test e build. Não há etapa de publicação ou deploy configurada.

---

## Mobile

### ✅ Integrado e funcionando

**Sprint 1 — 13/13 (100%):** login, sessão, pull de inspeções, SQLite versionado, checklist offline, progresso por item, observações, modo offline com `OfflineBanner`, notificações push.

**Sprint 2 concluída (15/22 — ~68%):**

| PBI | Feature |
|-----|---------|
| PBI-040 | Conclusão com validação de obrigatórios |
| PBI-042 | Captura de fotografia (câmera / galeria) com prévia |
| PBI-043 | Evidência associada ao item correto |
| PBI-044 | Evidência pendente quando upload falha (retry + `markFailed`) |
| PBI-046 | Não conformidade com criticidade (criação automática em `NAO_CONFORME`) |
| PBI-049 | Respostas persistem após fechar o app |
| PBI-050 | Outbox persistente (`sync_queue`) |
| PBI-054 | Tela de status de sincronização com dados reais |
| PBI-055 | Detecção de conflito de versão (`VersionConflictError`) |
| PBI-062 | Técnico recebe inspeção reprovada para correção |
| PBI-067 | READMEs com instruções de execução |
| PBI-068 | Build de APK via `eas.json` |
| PBI-085 | Notificações push de nova atribuição |
| PBI-090 | Biometria para reabertura de sessão local |
| PBI-091 | Tema escuro (mobile) |

---

### ❌ Descompasso crítico: sync de conteúdo

O backend já aplica os três tipos de conteúdo via `POST /mobile/sync/push`. O mobile **ainda não envia nenhum deles**.

| Lacuna | Detalhe | Issue |
|--------|---------|-------|
| Respostas e NCs nunca chegam ao servidor | `InspectionSyncService.sendOperation` lança `"not supported by the API yet"` para `answer` e `non_conformity` — o código de envio não existe | #232 |
| Upload de evidências desligado | `EvidenceUploadClient` está atrás da flag `EXPO_PUBLIC_EVIDENCE_UPLOAD=false`; quando habilitado, tenta `POST /inspections/{id}/evidence` que não existe no backend | #229 |
| Pull por ID não existe no backend | `pullInspection` chama `GET /mobile/inspections/{id}`, mas o `MobileInspectionController` não expõe esse endpoint | #230 |

> **Consequência:** o técnico pode preencher tudo offline no app mobile, mas ao sincronizar, **só a transição de status chega ao servidor**. Respostas, fotos e NCs ficam apenas no SQLite do dispositivo, o que bloqueia revisão real e a demo ponta a ponta (PBI-072).

---

### ❌ Outras lacunas do Mobile (Sprint 2)

| PBI | Feature | Status |
|-----|---------|--------|
| PBI-041 | Leitura de QR Code real (`expo-camera`) | 🟡 Board marca como Done via PR #218 — confirmar no `scanner.tsx` |
| PBI-045 | GPS na conclusão e envio ao servidor | 🟡 Capturado no início, mas não na conclusão nem enviado |
| PBI-053 | Pull incremental com cursor de sincronização | ❌ `pullInspections` baixa tudo; `sync_metadata` não é usado como cursor |
| PBI-065 | Testes de UI com React Testing Library | 🟡 Jest + testes de sync existem; UI sem cobertura |
| PBI-072 | Demo ponta a ponta | ❌ Bloqueada pelo sync de conteúdo |
| PBI-084 | Notificações locais de prazo | ❌ Sem `scheduleNotificationAsync` |
| PBI-086 | Assinatura desenhada no dispositivo | ❌ Sem código |

---

## Resumo Geral

| Camada | Sprint 1 | Sprint 2 | Principal lacuna |
|--------|----------|----------|-----------------|
| **Backend** | ✅ 23/23 (100%) | ✅ 14/14 (100%) | — |
| **Frontend Web** | ✅ 16/16 (100%) | ~54% (7/13) | PBI-089 (comentários), PBI-092 (CSV), detalhes de cliente mockados |
| **Mobile** | ✅ 13/13 (100%) | ~68% (15/22) | Sync de conteúdo (respostas/NCs/evidências nunca chegam ao servidor) |

---

## Prioridades imediatas

1. **Mobile — envio de respostas e NCs via push (issue #232):** implementar `ANSWER_UPSERT` e `NON_CONFORMITY_CREATE` no `InspectionSyncService`
2. **Mobile — upload de evidências (issue #229):** definir estratégia com o backend (endpoint dedicado ou via sync batch)
3. **Mobile — pull por ID (issue #230):** adicionar `GET /mobile/inspections/{id}` no `MobileInspectionController`
4. **Frontend Web — comentários de revisão por item (PBI-089):** criar UI na `InspectionReviewPage` usando `inspectionReviewApi.listComments` / `addComment`
5. **Frontend Web — botão de exportação CSV (PBI-092):** adicionar `exportCsv` em `inspectionReport.ts` e o botão na tela de inspeções
6. **Frontend Web — detalhe de cliente/local:** integrar `ClientDetailsPage` e `ClientSiteDetailsPage` à API real, removendo `@/mocks/domain`
