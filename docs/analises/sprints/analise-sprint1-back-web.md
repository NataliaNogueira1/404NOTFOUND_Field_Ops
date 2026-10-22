# Análise PBI a PBI — Backend e Frontend Web (Sprint 1)

> Análise baseada no código real do repositório. Frontend Web considerado apenas funcionalidade integrada com a API (não mocks).
>
> **Atualização (setembro):** os veredictos de backend foram revisados após os merges dos PRs #128–#135. Concluídos desde a última versão: Sprint 1 — PBI-027 (técnico ativo) e PBI-029 (cancelar); Sprint 2 — PBI-051, PBI-052, PBI-060, PBI-061 e PBI-063.
>
> **Revisão de setembro (código atual):** nova verificação no código mudou vereditos adicionais. Backend: **PBI-066** (seed de demonstração `DemoSeedRunner`, restrito ao profile `dev`) passou a ✅. Mobile: com `expo-location` presente, **PBI-034** (iniciar com horário + GPS local) e **PBI-039** (observação por item) passaram a ✅; **PBI-045** passou de ❌ para 🟡 (GPS capturado no início, mas ainda não na conclusão nem enviado ao servidor). READMEs: **PBI-067** e **PBI-001 (mobile)** passaram a ✅ (existem `api/`, `frontend/` e `mobile/README.md`). Com isso, a Sprint 1 Mobile fica **13/13 (100%)**.
>
> **Revisão após PR #142 (`fix/backend-pbi-feedback`):** **PBI-022 (prévia do checklist)** passou a ✅ — foi adicionado o endpoint `GET /api/v1/inspection-templates/{id}/preview`, deixando o **backend da Sprint 1 em 23/23 (100%)**. O agendamento (**PBI-025**) passou a reforçar versão publicada, cliente ativo e equipamento ativo.
>
> **Revisão de outubro (código atual):** nova verificação de toda a coluna Veredicto contra o código. Correções factuais no backend: enum `ResponseType` é `TEXT_SHORT/TEXT_LONG/...` (não `TEXT`); migrações Flyway vão até **V28** (V27 adiciona `location` em `inspection_evidences`; V28 adiciona `equipment_qr_code` em `inspections`); o `NonConformity` do dashboard é a **V26**; `DemoSeedRunner` é `@Profile({"dev","demo"})`; o resultado do batch de sync inclui também `CONFLICT`. **Frontend Web** subiu bastante: os CRUDs de catálogo, construtor de modelos, seleção encadeada, cancelamento e listagem **já consomem a API real** (Sprint 1 Web → 16/16); o refresh token single-flight **já está plugado** na sessão ativa; na Sprint 2, **PBI-056** e **PBI-088** estão integrados, e **PBI-083**/**PBI-091** saíram de "sem código" para parciais. **Mobile Sprint 2** teve várias correções: **PBI-040/044/054/055/085/090** passaram a ✅ e **PBI-065/091** a 🟡, elevando a Sprint 2 Mobile para **12/22 (~55%)**.
>
> **Revisão de 05/10/2026 (após PR #208 e re-verificação do código):** a tela de revisão web deixou de ser protótipo. Sprint 2 **Frontend Web**: **PBI-047/057/058** passaram a ✅ (revisão por seção/item, evidências/NCs e lightbox agora consomem o backend real; aprovar/reprovar via `inspectionReviewApi`), e **PBI-091 (web)** foi concluído (`ThemeToggle` exposto no `Header` + telas de cadastros/inspeções adaptadas), elevando a Sprint 2 Web para **6/13 (~46%)**. Sprint 2 **Mobile**: **PBI-062** (pull propaga a reprovação do servidor), **PBI-068** (build de APK via `eas.json`) e **PBI-091 (mobile)** (telas migradas para `useThemeColors()`) passaram a ✅, elevando a Sprint 2 Mobile para **15/22 (~68%)**. Ressalva: **PBI-087** (PDF web) e **PBI-069** (deploy) foram fechados no GitHub, mas no código seguem incompletos — o PDF ainda usa jsPDF/mocks (não consome `report.pdf`) e não há deploy ativo.

> **Revisão de 10/10/2026 (sync de conteúdo no backend + mapeamento de lacunas de integração):** nova verificação completa do código (backend, web e mobile) e do Kanban. Principais mudanças desde 05/10:
>
> - **Backend de sync de conteúdo concluído (PRs #181–#184, #214):** o enum `SyncOperationType` (`api/.../sync/dto/SyncOperationType.java`) deixou de ter só `INSPECTION_STATUS` e agora inclui **`ANSWER_UPSERT`, `EVIDENCE_CREATE`, `NON_CONFORMITY_CREATE`**. O `SyncBatchService` (`api/.../sync/service/SyncBatchService.java`) despacha os quatro tipos (`applyAnswerUpsert`/`applyEvidenceCreate`/`applyNonConformityCreate`), aplicados idempotentemente via **`POST /api/v1/mobile/sync/push`** (não há endpoints REST dedicados `/answers` `/evidences` `/non-conformities` — tudo passa pelo batch). O **PBI-087 (PDF web)** agora está **✅ integrado** (`frontend/src/api/inspectionReport.ts` + `InspectionReportPage` consomem `GET /inspections/{id}/report.pdf`; sem jsPDF/mocks — PRs #196/#216).
> - **Descompasso novo (backend pronto, cliente defasado):** mesmo com o backend aplicando conteúdo, o **mobile ainda não envia** `ANSWER_UPSERT`/`NON_CONFORMITY_CREATE` — `InspectionSyncService.sendOperation` continua lançando "not supported by the API yet" e o upload de evidência está **desligado** por flag (`EvidenceUploadClient`, `EXPO_PUBLIC_EVIDENCE_UPLOAD`), tentando um `POST /inspections/{id}/evidence` **que não existe** no backend. Além disso o mobile chama `GET /api/v1/mobile/inspections/{id}` (pull por id) que **não existe** no `MobileInspectionController`.
> - **Itens P1 com backend pronto mas front ausente:** **PBI-083 (dashboard)** — `GET /dashboard/summary` existe, mas `DashboardPage` ainda usa `@/mocks/domain`; **PBI-092 (CSV)** — `GET /inspections/export.csv` existe, mas não há botão/`exportCsv` no front; **PBI-089 (comentários de revisão)** — `ReviewCommentController` existe, mas não há camada de API nem UI no front.
> - **Lacunas de integração viraram issues (board #2):** foram abertas **#221–#232** cobrindo exatamente esses buracos, separadas por camada (backend só Lucas/Marcela; mobile e front com os demais) e vinculadas aos épicos **EP-08** (#221/#222/#223/#229/#230/#232) e **EP-10** (#224/#225/#226/#227/#228/#231). Todas estão **In progress** no board.
> - **Mantêm-se pendentes no código:** **PBI-045** (GPS só no início, não na conclusão — `summary.tsx` conclui sem `useLocation`), **PBI-053** (pull sem cursor incremental — `pullInspections` baixa tudo), **PBI-059** (não há transição formal "iniciar revisão", só approve/reject), **PBI-069** (sem deploy ativo — só `frontend-ci.yml`), **PBI-084** (sem notificação local de prazo; só push remoto), **PBI-086** (sem assinatura no dispositivo) e o **portal web do técnico** (ainda em `@/mocks/technician`).

> **Revisão de 20/10/2026 (verificação completa e minuciosa — código atual):** nova varredura linha a linha no código do repositório. Várias informações da revisão anterior de 10/10 estavam desatualizadas e foram corrigidas abaixo. Principais mudanças apuradas:
>
> - **Backend:** confirmadas as migrations **V27** (`ADD COLUMN location TEXT` em `inspection_evidences`) e **V28** (`ADD COLUMN equipment_qr_code` em `inspections`). O endpoint **`GET /api/v1/mobile/inspections/{id}`** foi adicionado ao `MobileInspectionController` (invalidando o registro anterior de ausência). O endpoint **`POST /api/v1/inspections/{id}/evidence`** existe em `EvidenceUploadController` com `multipart/form-data` restrito a `TECHNICIAN` (também corrige o registro anterior). A lista completa de controllers tem **19 controllers**; o `NonConformityController` com `GET /api/v1/non-conformities` paginado está completo.
> - **Mobile:** o **PBI-041 (QR Code real)** está ✅ concluído — `scanner.tsx` usa `CameraView`/`useCameraPermissions` do `expo-camera`, com haptic feedback, resolução local em SQLite e fallback online; **nenhum botão "Simular leitura" existe**. O **PBI-053 (pull incremental)** também passou a ✅ — `InspectionSyncService` tem `pullChanges(cursor)` como fluxo principal (`GET /mobile/sync/pull?cursor=...`) com fallback para `pullInspections()` somente na primeira carga; `pullInspection(id)` usa o novo `GET /mobile/inspections/{id}`. O **sync de conteúdo** evoluiu: `ANSWER_UPSERT` e `NON_CONFORMITY_CREATE` já são enviados via batch push, mas evidências **ainda vão por upload multipart** (`EvidenceUploadClient`) com a flag `EXPO_PUBLIC_EVIDENCE_UPLOAD` ausente do `.env` e desligada por padrão; o endpoint de destino (`POST /inspections/{id}/evidence`) **já existe no backend**, então o único bloqueio é habilitar a variável. A Sprint 2 Mobile sobe para **~82% (18/22)**.
> - **Frontend Web:** o **PBI-089 (comentários de revisão)** está ✅ concluído — `InspectionReviewPage` exibe `ItemComments` por item com listagem, textarea e botão "Adicionar comentário" via `inspectionReviewApi.listComments`/`addComment`; integrado com endpoints reais. O **PBI-083 (dashboard)** passou de 🟡 para ✅ — `DashboardPage` consome `dashboardApi.getSummary()` (`GET /dashboard/summary`) com filtros de período e cliente, gráfico por estado (Recharts) e painel de criticidade; não usa mais `@/mocks/domain`. A Sprint 2 Web sobe para **~69% (9/13)**.

---

## Sprint 1 Backend (Lucas e Marcela)

| PBI | Título | Issue | Veredicto |
|-----|--------|-------|-----------|
| PBI-001 | Repositórios e convenções | [#11](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/11) | ✅ Concluído |
| PBI-004 | API Spring Boot + PostgreSQL + migrações | [#14](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/14) | ✅ Concluído |
| PBI-006 | Contrato OpenAPI e dados simulados | [#16](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/16) | ✅ Concluído |
| PBI-007 | Autenticação JWT | [#17](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/17) | ✅ Concluído — `POST /api/v1/auth/login` valida senha (BCrypt) e emite JWT |
| PBI-010 | Refresh token | [#20](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/20) | ✅ Concluído — `POST /api/v1/auth/refresh` + entidade `RefreshToken` + migration V4 |
| PBI-012 | Autorização por perfil | [#22](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/22) | ✅ Concluído — matriz de roles no `SecurityConfig` + `@PreAuthorize` por método |
| PBI-011 | CRUD de usuários | [#21](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/21) | ✅ Concluído — `UserController` (list/create/update/status) + `UserService` + migration V8 |
| PBI-013 | CRUD de clientes | [#23](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/23) | ✅ Concluído — `ClientController` (CRUD + ativar/desativar) + migration V2 |
| PBI-014 | CRUD de locais | [#24](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/24) | ✅ Concluído — `InspectionSiteController` (CRUD + status) + migration V5 |
| PBI-015 | CRUD de equipamentos | [#25](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/25) | ✅ Concluído — `EquipmentController` (CRUD + status) + migration V6 |
| PBI-016 | QR Code único por equipamento | [#34](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/34) | ✅ Concluído — `GET /api/v1/equipment/by-qr/{qrCode}` + unicidade de QR (409) |
| PBI-017 | Pesquisa, filtros e paginação | [#26](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/26) | ✅ Concluído — filtros + `Pageable` em usuários, clientes, locais, equipamentos e inspeções |
| PBI-018 | Modelo de inspeção em rascunho | [#35](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/35) | ✅ Concluído — `InspectionTemplateService.createDraft` + migration V9 |
| PBI-019 | Seções do checklist | [#36](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/36) | ✅ Concluído — `TemplateSectionService` (criar/editar/ordenar seções, DRAFT-only) + migration V10 |
| PBI-020 | Itens com tipos de resposta | [#37](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/37) | ✅ Concluído — `TemplateItemService` + enum `ResponseType` (TEXT_SHORT/TEXT_LONG/NUMBER/BOOLEAN/CONFORMITY/SINGLE_CHOICE/DATE) + migrations V7/V11 |
| PBI-021 | Obrigatoriedade e regras de evidência | [#38](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/38) | ✅ Concluído — flags `required`, `observationRequiredOnFailure`, `evidenceRequiredOnFailure` + migration V12 |
| PBI-022 | Prévia do checklist | [#39](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/39) | ✅ Concluído — `GET /api/v1/inspection-templates/{id}/preview` → `InspectionTemplateService.preview` retorna `InspectionTemplatePreviewResponse` (checklist read-only + `validForPublication` + `issues`), rodando o `InspectionTemplatePublicationValidator` fora do publish (PR #142) |
| PBI-023 | Publicar versão imutável | [#40](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/40) | ✅ Concluído — `POST /api/v1/inspection-templates/{id}/publish` → `InspectionTemplateVersionService.publish` (versão imutável) + migration V13 |
| PBI-024 | Snapshot ao criar inspeção | [#41](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/41) | ✅ Concluído — `InspectionService.copyChecklist` → `InspectionItemSnapshot` (colunas `updatable=false`) + migrations V12/V14 |
| PBI-025 | Agendar inspeção | [#42](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/42) | ✅ Concluído — `POST /api/v1/inspections` (status ASSIGNED) + migration V14; agora reforça os critérios de agendamento: versão publicada (`TEMPLATE_VERSION_NOT_PUBLISHED`), cliente ATIVO (`CLIENT_NOT_ACTIVE`) e equipamento ATIVO (`EQUIPMENT_NOT_ACTIVE`) (PR #142) |
| PBI-027 | Atribuir inspeção a técnico | [#44](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/44) | ✅ Concluído — `validateAssignment` agora valida role TECHNICIAN **e** status ATIVO; técnico inativo → 422 `TECHNICIAN_NOT_ACTIVE` (PR #129) |
| PBI-028 | Prioridade, prazo e instruções | [#45](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/45) | ✅ Concluído — `CreateInspectionRequest` (priority/dueDate/dueTime/supervisorInstructions) + enum `Priority`; instruções limitadas a 2000 chars (PR #130) |
| PBI-029 | Cancelar inspeção | [#46](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/46) | ✅ Concluído — `POST /api/v1/inspections/{id}/cancel` com motivo obrigatório (min 10), state machine (bloqueia APPROVED → 422), campos `canceled_at/by/reason` + migration V15, auditoria (PR #128) |

### Resumo Sprint 1 Backend (23 itens)

> Verificado no **código real** do módulo `api/` (controllers, services, entidades e migrações Flyway V1–V28, sem V22).

| Categoria | Qtd |
|-----------|-----|
| ✅ Concluído | 23 |
| 🟡 Parcial | 0 |
| ❌ Não feito | 0 |

**Porcentagem: 100%** (23/23 concluídos)

> Concluídos: PBI-001, PBI-004, PBI-006, **PBI-007 (auth JWT)**, **PBI-010 (refresh token)**, **PBI-012 (autorização por perfil)**, os CRUDs de catálogo — **PBI-011 (usuários)**, **PBI-013 (clientes)**, **PBI-014 (locais)**, **PBI-015 (equipamentos)**, **PBI-016 (QR único)**, **PBI-017 (pesquisa/filtros/paginação)** — e todo o fluxo de modelos de inspeção: **PBI-018 (rascunho)**, **PBI-019 (seções)**, **PBI-020 (itens/tipos)**, **PBI-021 (obrigatoriedade/evidência)**, **PBI-023 (publicar versão imutável)**, **PBI-024 (snapshot)**, **PBI-025 (agendar)**, **PBI-028 (prioridade/prazo/instruções)**, além de **PBI-027 (atribuir a técnico ativo)** e **PBI-029 (cancelar inspeção)**, concluídos após os merges de setembro, e **PBI-022 (prévia do checklist)**, fechado no PR #142 com o endpoint `GET .../preview`.
>
> O backend da Sprint 1 está agora **100% concluído** (23/23).

---

## Sprint 1 Frontend Web (Andressa, Ian, Júlia, Carol)

> O Frontend Web evoluiu de um protótipo 100% mockado para uma aplicação com autenticação e sessão reais integradas ao backend.
>
> Atualmente, `POST /api/v1/auth/login` e `GET /api/v1/auth/me` são consumidos pela aplicação utilizando JWT Bearer, restauração de sessão e controle de acesso por perfil.
>
> Os módulos de catálogo — usuários, clientes, locais, equipamentos — e os de modelos de inspeção, agendamento, cancelamento e acompanhamento de inspeções **já estão integrados à API real** (não são mais mocks). Os módulos que ainda utilizam mocks/stores locais são as páginas de detalhe de cliente/local (`ClientDetailsPage`, `ClientSiteDetailsPage`), que carregam dados reais do cliente e do local via API, mas ainda renderizam a lista de sites e equipamentos a partir de seeds de `@/mocks/domain`.
>
> O frontend também possui lint, tipagem estrita, testes automatizados, CI e documentação de convenções.
>
> Atualização: o frontend web está padronizado em React + TypeScript + Vite, com layout, rotas protegidas e estrutura modular.

| PBI | Título | Issue | Veredicto |
|-----|--------|-------|-----------|
| PBI-001 | Repositórios e convenções | [#11](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/11) | ✅ Concluído |
| PBI-003 | Projeto React + Vite com layout | [#13](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/13) | ✅ Concluído — layout, rotas protegidas e estrutura modular em React + Vite |
| PBI-005 | Lint, tipos e fluxo de PR | [#15](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/15) | ✅ Concluído |
| PBI-009 | Login e sessão na web | [#19](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/19) | ✅ Concluído — integrado à API real |
| PBI-011 | CRUD de usuários (telas) | [#21](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/21) | ✅ Concluído — integrado à API real (`usersApi` → `GET/POST/PUT /api/v1/users`, `PATCH /{id}/status`) |
| PBI-013 | CRUD de clientes (telas) | [#23](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/23) | ✅ Concluído — integrado à API real (`clientsApi` → `GET/POST/PUT /api/v1/clients`, `PATCH /{id}/status`); páginas de detalhe carregam cliente e local via API, mas lista de sites e equipamentos ainda vem de seeds |
| PBI-014 | CRUD de locais (telas) | [#24](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/24) | ✅ Concluído — integrado à API real (`sitesApi` → `GET/POST/PUT /api/v1/sites`, `PATCH /{id}/status`) |
| PBI-015 | CRUD de equipamentos (telas) | [#25](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/25) | ✅ Concluído — integrado à API real (`equipmentApi` → `GET/POST/PUT /api/v1/equipment`, `PATCH /{id}/status`, `by-qr`) |
| PBI-017 | Pesquisa e filtros (telas) | [#26](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/26) | ✅ Concluído — integrado à API via `useListQuery`/`useDebouncedValue` (filtros em query params) |
| PBI-018 | Modelo em rascunho (telas) | [#35](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/35) | ✅ Concluído — integrado à API real (`adminCatalog` persiste template/seções/itens e publica via backend) |
| PBI-019 | Seções do checklist (telas) | [#36](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/36) | ✅ Concluído — integrado à API real (`createTemplateSection/update/delete`) |
| PBI-020 | Itens com tipos (telas) | [#37](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/37) | ✅ Concluído — integrado à API real (`createTemplateItem/update` com `responseType`, obrigatoriedade, evidência) |
| PBI-022 | Prévia do checklist | [#39](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/39) | ✅ Concluído — `TemplatePreviewPage` consome o template real via `getTemplate` |
| PBI-026 | Seleção encadeada cliente→local→equip | [#93](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/93) | ✅ Concluído — `NewInspectionPage` encadeia clientes/locais/equipamentos/técnicos da API e cria via `POST /api/v1/inspections` |
| PBI-029 | Cancelar inspeção (tela) | [#46](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/46) | ✅ Concluído — integrado à API real (`cancelInspection` → `POST /api/v1/inspections/{id}/cancel`) |
| PBI-030 | Acompanhar inspeções com filtros | [#47](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/47) | ✅ Concluído — integrado à API real (`listInspections` → `GET /api/v1/inspections` com filtros) |

### Resumo Sprint 1 Frontend Web (16 itens)

| Categoria | Qtd |
|-----------|-----|
| ✅ Concluído no escopo de frontend | 16 |
| 🟡 Parcial / requer validação externa | 0 |
| ❌ Não feito | 0 |

**Porcentagem do escopo Frontend Web: 100%** (16/16)

> O PBI-003 foi alinhado à implementação atual em React + Vite. Revisão de outubro: os CRUDs de catálogo (usuários, clientes, locais, equipamentos), o construtor de modelos (rascunho/seções/itens/prévia), a seleção encadeada, o cancelamento e a listagem de inspeções **já consomem a API real** (não são mais mocks/telas isoladas). Restam apenas as páginas de detalhe de cliente/local usando seeds de `@/mocks/domain` para a lista de locais por cliente e equipamentos por local (fallback visual — a listagem principal e os formulários de criação são reais).

### Estado atual da integração Frontend ↔ Backend

A integração com o backend **não é mais 0%**.

Já estão integrados de forma real:

- `POST /api/v1/auth/login`;
- `GET /api/v1/auth/me`;
- autenticação JWT Bearer;
- sessão baseada em `accessToken`;
- restauração de sessão ao recarregar a aplicação;
- guards por perfil;
- redirecionamento de Admin/Supervisor e Técnico;
- logout local;
- tratamento distinto de `401 Unauthorized` e `403 Forbidden`;
- normalização da role `ADMINISTRATOR` do backend para `ADMIN` no frontend.

> ✅ **Renovação automática (PBI-010 no cliente web) — atualizado:** o backend está completo (endpoint de refresh + entidade + migration) e o frontend **já tem o refresh single-flight plugado na via ativa de sessão**. Os antigos `src/services/api/httpClient.ts` e `src/services/auth/tokenStorage.ts` hoje são apenas re-exports de `@/api/client`; o interceptor real vive em `src/api/client.ts` (`renewAccessToken`/`refreshInFlight`): ao receber 401 (com token, não sendo retry nem rota de login/refresh), chama `POST /api/v1/auth/refresh`, salva o novo `accessToken` e **repete a request original**, só fazendo logout se o refresh falhar. O login (`src/auth/session.ts`) grava `accessToken` **e** `refreshToken`. Única ressalva: não há rotação do refresh token no cliente (o `/auth/refresh` devolve apenas `accessToken` + `expiresIn`).

Além da autenticação, os CRUDs de catálogo, o construtor de modelos, a seleção encadeada, o cancelamento, a listagem/acompanhamento de inspeções e, após o PR #208, a **tela de revisão** (respostas por seção/item, lightbox de evidências reais, aprovar/reprovar) já consomem a API real.

### Estrutura Web atual

A aplicação Web possui duas áreas separadas:

- `/app/*` — Admin/Supervisor;
- `/technician/*` — Técnico.

O Portal Web do Técnico foi criado seguindo o mesmo domínio e fluxo do aplicativo mobile, incluindo:

- início;
- inspeções atribuídas;
- detalhes da inspeção;
- início da inspeção;
- checklist;
- não conformidades;
- resumo/conclusão;
- sincronização;
- perfil.

### Qualidade e validação

O frontend possui atualmente:

- TypeScript com configuração estrita;
- ESLint;
- Vitest;
- Testing Library;
- script `npm test`;
- GitHub Actions;
- documentação de branches, commits e fluxo de PR.

Última validação executada (após merge da `develop` na branch `feat/refresh-token-session-renewal`):

```text
Frontend
npm run lint   → PASSOU
npm test       → 22 testes passando (6 arquivos)
npm run build  → PASSOU (tsc -b + vite build)

Backend
./mvnw.cmd test
→ MobileInspectionControllerTest: 2 testes passando
→ BUILD SUCCESS
```

> Nota sobre a stack de testes: havia dois configs de Vitest conflitantes (um em `node`, outro em `jsdom`) trazidos pelo merge. Foram unificados em `jsdom` (`vite.config.ts`), removendo o `vitest.config.ts` duplicado, para que tanto os testes de componente quanto os de serviço rodem no mesmo ambiente.
---

## Sprint 1 Mobile (Rodrigo, Natália e Cutiur)

> Verificado no **código real** do módulo `mobile/` (Expo Router + React Native + TypeScript, SQLite via `expo-sqlite`, stores por Context e camada de sincronização com outbox). O status prevalece sobre o quadro Kanban.

| PBI | Título | Issue | Veredicto |
|-----|--------|-------|-----------|
| PBI-001 | Repositórios e convenções (participação) | [#11](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/11) | ✅ Concluído — `eslint.config.js` + estrutura por feature (`src/features/*`) e agora `mobile/README.md` com estrutura, comandos e convenções de commit/PR documentadas |
| PBI-002 | Projeto Expo com TypeScript e estrutura por features | [#12](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/12) | ✅ Concluído — Expo ~57 + expo-router, TypeScript, `src/features/*` e `src/infrastructure/*` |
| PBI-008 | Login e sessão no aplicativo mobile | [#18](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/18) | ✅ Concluído — `AuthContext.signIn` → `POST /api/v1/auth/login`, tokens no SecureStore, restauração via `GET /api/v1/auth/me` + interceptor de refresh |
| PBI-031 | Download e visualização das inspeções atribuídas | [#48](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/48) | ✅ Concluído — `InspectionSyncService.pullInspections` (`GET /api/v1/mobile/inspections`) persiste no SQLite; lista em `(tabs)/inspections.tsx` |
| PBI-032 | Filtrar inspeções por estado, data e prioridade | [#49](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/49) | ✅ Concluído — filtros de estado/prioridade/período + busca em `inspections.tsx` (useMemo `filtered`) |
| PBI-033 | Detalhes da inspeção no mobile | [#50](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/50) | ✅ Concluído — `inspections/[id]/index.tsx` (info, instruções, progresso, contagem de NCs/evidências, ações por status) |
| PBI-034 | Iniciar inspeção com registro de horário | [#51](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/51) | ✅ Concluído — `start.tsx` captura GPS via `expo-location` (`useLocation`), `startInspection` grava `started_at` + `start_latitude/longitude/accuracy` no SQLite e muda status para IN_PROGRESS; envio ao servidor da localização fica para PBI-045 |
| PBI-035 | Checklist dinâmico a partir do snapshot | [#52](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/52) | ✅ Concluído — `checklist.tsx` renderiza seções/itens do snapshot lido do SQLite (`inspection_sections`/`inspection_items`) |
| PBI-036 | Componentes de resposta para cada tipo de item | [#53](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/53) | ✅ Concluído — `ChecklistItemCard` cobre CONFORMITY, BOOLEAN, SINGLE_CHOICE, DATE, NUMBER e TEXT_SHORT/LONG |
| PBI-037 | Salvar cada resposta localmente (SQLite) | [#54](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/54) | ✅ Concluído — `useDebouncedSave` → `AnswerRepository.save` (`INSERT OR REPLACE`) + enfileiramento no `sync_queue` |
| PBI-038 | Visualizar progresso e itens pendentes | [#55](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/55) | ✅ Concluído — barra de progresso "X de Y itens", `updateProgress` no SQLite, `SyncBadge`/`pendingSyncCount` |
| PBI-039 | Registrar observações em itens | [#56](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/56) | ✅ Concluído — em `ChecklistItemCard` o campo de observação está disponível para qualquer item respondido (não só não conformidades) e é persistido em `answers.observation` via `useDebouncedSave` |
| PBI-048 | Acesso offline a inspeções baixadas | [#68](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/68) | ✅ Concluído — todas as telas leem do SQLite; fallback local quando a API falha; `ConnectivityContext`/`OfflineBanner` e modo "offline-limited" na sessão |

### Resumo Sprint 1 Mobile (13 itens)

| Categoria | Qtd |
|-----------|-----|
| ✅ Concluído | 13 |
| 🟡 Parcial | 0 |
| ❌ Não feito | 0 |

**Porcentagem: 100%** (13/13 concluídos)

---

## Sprint 1 — Infraestrutura offline e sincronização (Mobile)

O mobile já possui a espinha dorsal de sincronização implementada:

- SQLite versionado (`migrations.ts` v1–v4) com tabelas `inspections`, `inspection_sections`, `inspection_items`, `answers`, `evidences`, `non_conformities`, `sync_queue` (outbox) e `sync_metadata`;
- padrão outbox via `sync_queue` + `SyncQueueRepository`, orquestrado por `InspectionSyncService` (`enqueue*`, `pushPendingOperations`, `pullInspections`, `pullChanges`, `pullInspection`, `fullSync`);
- `sync_status` por linha (synced/pending/error) e contagem de tentativas/erros;
- conectividade via `ConnectivityContext` (NetInfo) e `OfflineBanner`.

---

# Análise PBI a PBI — Sprint 2

> Mesma metodologia da Sprint 1: veredicto baseado no **código real** do repositório.
>
> **Revisão de 20/10/2026:** múltiplas correções em relação ao documento anterior de 10/10. Ver cabeçalho para detalhes.

## Sprint 2 Backend (Lucas e Marcela)

| PBI | Título | Issue | Veredicto |
|-----|--------|-------|-----------|
| PBI-051 | Envio em lote respeitando dependências | [#71](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/71) | ✅ Concluído — `POST /api/v1/mobile/sync/push` (`SyncBatchService`) ordena por `dependencyIds`, resultado por operação (APPLIED/ALREADY_APPLIED/DEFERRED/FAILED/CONFLICT), idempotente (PR #135) |
| PBI-052 | Idempotência — impedir duplicidade no reenvio | [#72](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/72) | ✅ Concluído — store `processed_operations` (migration V18) + `IdempotencyService`; `POST /api/v1/mobile/inspections/{id}/status` retorna ALREADY_APPLIED no reenvio (PR #133) |
| PBI-060 | Aprovar inspeção | [#81](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/81) | ✅ Concluído — `POST /api/v1/inspections/{id}/approve`; UNDER_REVIEW → APPROVED, comentário opcional, auditoria (PR #131) |
| PBI-061 | Reprovar inspeção com motivo obrigatório | [#82](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/82) | ✅ Concluído — `POST /api/v1/inspections/{id}/reject`; motivo obrigatório (min 10), UNDER_REVIEW → REJECTED, auditoria (PR #131) |
| PBI-063 | Auditoria de mudanças de estado | [#83](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/83) | ✅ Concluído — tabela imutável `audit_events` (migration V17) + `AuditService`; `GET /api/v1/inspections/{id}/history`; eventos de criar/atribuir/aprovar/reprovar/cancelar (PRs #132/#134) |
| PBI-066 | Dados de demonstração reproduzíveis (seed) | [#86](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/86) | ✅ Concluído — `DemoSeedRunner` cria dataset coerente (cliente + local + equipamento com QR + modelo publicado + inspeção ASSIGNED), idempotente por `existsByDocument`; **restrição: `@Profile({"dev","demo"})` + flag `fieldops.bootstrap.demo-seed.enabled`, não roda em `prod`** |
| PBI-070 | API em contêiner Docker para demonstração | [#90](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/90) | ✅ Concluído — `docker compose up --build` validado em 25/09/2026: API e PostgreSQL saudáveis, Flyway/seed do perfil `demo`, health, OpenAPI, login e listagem de inspeções retornando 200. A história exige API publicada **ou** executável por contêiner; não requer hospedagem externa. |
| PBI-071 | OpenAPI completo e diagramas | [#91](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/91) | ✅ Concluído — contrato gerado pelo springdoc validado com 39 rotas, esquema Bearer JWT e endpoints críticos; `OpenApiConfig` traz metadados de uso e [`docs/arquitetura/api-diagrams.md`](../../arquitetura/api-diagrams.md) documenta os diagramas Mermaid de entidades e estados da inspeção (commit `62495b0`). |
| PBI-083 | *P1:* Dashboard com indicadores por estado e criticidade (API) | [#146](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/146) | ✅ Concluído — `GET /api/v1/dashboard/summary` agrega estados, prioridades, atrasos e não conformidades abertas em quatro queries (sem N+1), aceita `from`, `to`, `client` e `technicianId`, e restringe acesso a ADMINISTRATOR/SUPERVISOR. O domínio `NonConformity` (migration V26) preserva inspeção, item opcional, criticidade e estados OPEN/CLOSED. O filtro `client` é por nome (String), não por id. |
| PBI-085 | *P1:* Notificações push — integração servidor | [#155](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/155) | ✅ Concluído — `POST /api/v1/devices/register` persiste múltiplos tokens por usuário, envio Expo assíncrono é disparado na atribuição e tokens inválidos são removidos. No mobile, `expo-notifications` solicita permissão, registra o Expo token e abre a inspeção pelo `inspectionId` ao toque. |
| PBI-087 | *P1:* Relatório PDF básico | [#149](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/149) | ✅ Concluído — `GET /api/v1/inspections/{id}/report.pdf` gera `application/pdf` via OpenPDF com cabeçalho, decisão, snapshot, respostas registradas, NCs e referências/checksums de evidências persistidas em `inspection_evidences` (migration V24); protegido para ADMINISTRATOR/SUPERVISOR, com 403/404 validados. |
| PBI-088 | *P1:* Histórico detalhado de respostas | [#150](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/150) | ✅ Concluído — migration V20 cria o histórico imutável `inspection_response_history`; `GET /api/v1/inspections/{id}/answers/history` retorna item, seção, valor, observação, data e autor, ordenado por seção/item/data e protegido para ADMINISTRATOR/SUPERVISOR (403/404 validados). |
| PBI-089 | *P1:* Comentários de revisão por item | [#151](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/151) | ✅ Concluído — migration V23 cria `review_comments` imutáveis por inspeção/snapshot; `POST /api/v1/inspections/{id}/items/{itemId}/review-comment` e `GET /api/v1/inspections/{id}/review-comments` registram/listam orientação por item, ordenada, e gravam `REVIEW_COMMENT_ADDED` na auditoria. Escrita é restrita a ADMINISTRATOR/SUPERVISOR (403 validado). |
| PBI-092 | *P1:* Exportação CSV | [#154](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/154) | ✅ Concluído — `GET /api/v1/inspections/export.csv` exporta inspeções filtradas por estado/período/cliente, com colunas operacionais e contagem de NCs. O CSV inclui BOM UTF-8, escape de vírgulas/aspas/quebras de linha e proteção contra CSV injection; é exclusivo para ADMINISTRATOR e retorna só cabeçalho quando vazio. |

### Resumo Sprint 2 Backend (14 itens)

| Categoria | Qtd |
|-----------|-----|
| ✅ Concluído | 14 |
| 🟡 Parcial | 0 |
| ❌ Não feito | 0 |

**Porcentagem: 100%** concluído (14/14).

> **Nota (20/10/2026):** o backend da Sprint 2 está 100% concluído. Além dos 14 itens do cronograma, existem dois endpoints adicionais que emergiram da Sprint 2 e não estavam no cronograma original: `GET /api/v1/mobile/inspections/{id}` (`MobileInspectionController`) e `POST /api/v1/inspections/{id}/evidence` (`EvidenceUploadController`, multipart/form-data). Esses foram incorporados à Sprint 3 como PBIs novos. As migrações V27 e V28 acompanham esses endpoints.

---

## Sprint 2 Frontend Web (Andressa, Ian, Júlia e Carol)

| PBI | Título | Issue | Veredicto |
|-----|--------|-------|-----------|
| PBI-047 | Visualizar evidências e NCs no admin | [#67](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/67) | ✅ Concluído — `InspectionReviewPage` mostra NCs e o lightbox de evidências com **dados reais do backend** (download autenticado via Blob URL), não mais mocks (PR #208) |
| PBI-056 | Lista de inspeções aguardando revisão | [#76](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/76) | ✅ Concluído — `ReviewQueuePage` consome `listInspections({ review: true })` (`GET /api/v1/inspections?review=true`) com paginação/busca reais; badge via `useReviewCount` também real |
| PBI-057 | Revisão de respostas por seção e item | [#77](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/77) | ✅ Concluído — `InspectionReviewPage` consome o backend real: seções/itens do snapshot, pergunta/resposta/observação, destaque de não conformidade e navegação por seção (PR #208) |
| PBI-058 | Lightbox de fotografias na revisão | [#78](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/78) | ✅ Concluído — lightbox exibe a fotografia real vinda de `GET /api/v1/inspection-evidences/{id}/content` (download autenticado) com data, localização e item vinculado (PR #208). Observação: seed demo não traz evidências, então validado por testes |
| PBI-059 | Iniciar revisão formalmente | [#79](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/79) | 🟡 Parcial — aprovar/reprovar em `InspectionReviewPage` agora são **reais** (`inspectionReviewApi.approve`/`reject`, habilitados só em `UNDER_REVIEW`); `inspectionReviewApi.beginReview` está mapeado no cliente mas **não há botão/ação na UI** para disparar `POST /inspections/{id}/begin-review`; a transição formal nunca é acionada pelo usuário |
| PBI-064 | Estados de carregamento, vazio, erro e offline | [#84](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/84) | 🟡 Parcial — páginas integradas (Users/Clients/Sites/Equipment/Inspections/ReviewQueue/Dashboard/NCs) têm estados reais de loading/vazio/erro (com retry); falta tratamento específico de **offline** no web |
| PBI-069 | Build e publicação do painel web admin | [#89](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/89) | 🟡 Parcial — CI existe (`.github/workflows/frontend-ci.yml`); publicação ainda não configurada |
| PBI-083 | *P1:* Dashboard com indicadores (telas) | [#146](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/146) | ✅ Concluído — `DashboardPage` consome `dashboardApi.getSummary()` (`GET /api/v1/dashboard/summary`) com filtros de período/cliente, gráfico de barras por estado (Recharts + cores semânticas por tema), painel de criticidade por prioridade e 4 KPI cards; não usa mais `@/mocks/domain` |
| PBI-087 | *P1:* Relatório PDF básico (visualização/download) | [#149](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/149) | ✅ Concluído — `inspectionReportApi.downloadPdf` (`frontend/src/api/inspectionReport.ts`) faz download autenticado de `GET /api/v1/inspections/{id}/report.pdf`; `InspectionReportPage` carrega dados reais via `inspectionReviewApi` e gera o PDF no servidor (OpenPDF). Sem jsPDF/mocks (PRs #196/#216) |
| PBI-088 | *P1:* Histórico detalhado de respostas (telas) | [#150](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/150) | ✅ Concluído — `AnswerHistoryTab` (aba em `InspectionReviewPage`) consome `GET /api/v1/inspections/{id}/answers/history` com agrupamento por seção/item e estados loading/ready/not-found/error; tem testes |
| PBI-089 | *P1:* Comentários de revisão por item (telas) | [#151](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/151) | ✅ Concluído — `InspectionReviewPage` exibe componente `ItemComments` embaixo de cada item do checklist na tab de revisão: lista comentários com autor/timestamp via `inspectionReviewApi.listComments`, textarea + botão "Adicionar comentário" via `inspectionReviewApi.addComment`; validação mínima de 10 caracteres, loading e tratamento de erro |
| PBI-091 | *P1:* Tema escuro | [#153](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/153) | ✅ Concluído (web) — `ThemeProvider` (claro/escuro/sistema, classe `dark` no `<html>`, persistência em `localStorage`, segue `prefers-color-scheme`) plugado em `App.tsx`, `ThemeToggle` acessível **exposto no `Header`** e telas de cadastros/inspeções adaptadas aos tokens (PRs #208 e dark mode). Mobile é tratado no PBI-091 (mobile) |
| PBI-092 | *P1:* Exportação CSV (botão e download) | [#154](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/154) | ❌ Não feito — backend `GET /api/v1/inspections/export.csv` pronto; não há `exportCsv` em `inspectionReport.ts` nem botão na `InspectionsPage` |

### Resumo Sprint 2 Frontend Web (13 itens)

| Categoria | Qtd |
|-----------|-----|
| ✅ Concluído | 9 |
| 🟡 Parcial | 3 |
| ❌ Não feito | 1 |

**Porcentagem: ~69%** concluído (9/13).

> Revisão de 20/10/2026: **PBI-083** passou de 🟡 para ✅ — `DashboardPage` agora consome `dashboardApi.getSummary()` com filtros reais, gráfico Recharts e painel de criticidade, sem nenhum dado de `@/mocks/domain`. **PBI-089** passou de ❌ para ✅ — `InspectionReviewPage` tem UI completa de comentários por item, integrada com os dois endpoints de `ReviewCommentController`. Seguem pendentes: **PBI-092** (CSV — backend pronto, sem botão no front), **PBI-059** (beginReview mapeado, sem botão na UI), **PBI-064** (falta estado offline no web) e **PBI-069** (deploy não configurado).

---

## Sprint 2 Mobile (Rodrigo, Natália e Cutiur)

| PBI | Título | Issue | Veredicto |
|-----|--------|-------|-----------|
| PBI-040 | Conclusão com validação de obrigatórios | [#57](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/57) | ✅ Concluído — `summary.tsx` calcula itens obrigatórios pendentes e `tryConclude()` **bloqueia** a conclusão abrindo modal "Não é possível concluir"; só chama `conclude()` (SUBMITTED + enfileira status) quando não há obrigatórios faltando |
| PBI-041 | Leitura de QR Code para confirmar equipamento | [#58](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/58) | ✅ Concluído — `scanner.tsx` usa `CameraView`/`useCameraPermissions` do `expo-camera` com haptic feedback (`expo-haptics`), resolução local no SQLite e fallback online via `GET /api/v1/equipment/by-qr/{qrCode}`; nenhum botão "Simular leitura" existe (PR #218) |
| PBI-042 | Capturar fotografia e visualizar prévia | [#59](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/59) | ✅ Concluído — `(protected)/evidence.tsx` com câmera/galeria + prévia |
| PBI-043 | Associar fotografia ao item correto | [#63](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/63) | ✅ Concluído — `addEvidence(inspectionId, itemId, ...)` grava evidência vinculada ao item |
| PBI-044 | Foto pendente quando upload falha | [#64](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/64) | ✅ Concluído — migration v3 adiciona `operation_id/response_id/last_error/retry_count` em `evidences`; `uploadEvidence` usa `EvidenceUploadClient`, em falha chama `markFailed` (preserva o arquivo) e em sucesso `markSyncedById`; dependência foto→resposta via `getReady()`, `retryEvidenceUpload` ("Tentar novamente") e "Fotos com falha" no `sync.tsx`; coberto por `__tests__/pbi044.test.ts` |
| PBI-045 | Registrar localização no início e conclusão | [#65](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/65) | 🟡 Parcial — `expo-location` presente; GPS é capturado e gravado localmente **no início** (`start.tsx` + `useLocation`), mas **não na conclusão** (`summary.tsx` conclui sem localização) e ainda **não é enviado ao servidor** (V27 adicionou coluna `location` em `inspection_evidences`, mas o campo não é enviado no batch) |
| PBI-046 | Registrar não conformidade com criticidade | [#66](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/66) | ✅ Concluído — `addNonConformity` + criação automática ao responder `NAO_CONFORME`, com `Severity` |
| PBI-049 | Respostas persistem após fechar o aplicativo | [#69](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/69) | ✅ Concluído — respostas gravadas em SQLite (`answers`) e recarregadas na inicialização |
| PBI-050 | Registrar alterações na outbox persistente | [#70](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/70) | ✅ Concluído — tabela `sync_queue` + `SyncQueueRepository` (padrão outbox) |
| PBI-053 | Pull de alterações com cursor de sincronização | [#73](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/73) | ✅ Concluído — `InspectionSyncService.pullChanges(cursor)` usa `GET /api/v1/mobile/sync/pull?cursor=...` como fluxo principal; `fullSync()` usa cursor salvo em `sync_metadata` e só cai para `pullInspections` (download total) quando nunca houve cursor |
| PBI-054 | Tela de status de sincronização | [#74](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/74) | ✅ Concluído — `(tabs)/sync.tsx` consome `useSyncStatus()` com **dados reais** do outbox (`SyncQueueRepository.getAll/countPending`) e `SyncMetadataRepository.getLastSuccessfulSync`, conectividade via `useConnectivity` e `syncStatusMapping` (synced/pending/error/waiting/conflict); coberto por `__tests__/pbi054.test.ts` |
| PBI-055 | Detecção de conflito de versão | [#75](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/75) | ✅ Concluído — migration v4 adiciona `server_version` em `inspections`; `enqueueTransition`/`enqueueStatusChange` enviam `baseVersion`; `pushInspectionStatus` lança `VersionConflictError` em resultado `CONFLICT`, `pushPendingOperations` chama `markConflict` e `sync.tsx` exibe banner "Conflito de versão"; coberto por `pbi054.test.ts` |
| PBI-062 | Técnico recebe inspeção reprovada para correção | [#80](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/80) | ✅ Concluído — `RejectionBanner` + colunas `rejection_reason`/`rejected_by`/`rejected_at` + ação "Corrigir"; o `pullInspections`/`saveInspectionLocally` agora **propaga** `rejectionReason`/`rejectedBy`/`rejectedAt` do servidor para o dispositivo |
| PBI-065 | Testes automatizados dos fluxos críticos | [#85](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/85) | 🟡 Parcial — `package.json` tem `jest`/`jest-expo`/`ts-jest`, script `"test": "jest"`, `jest.config.js` e suítes reais da camada de sync (`pbi044.test.ts`, `pbi054.test.ts`) rodando migrations/repos em SQLite in-memory; ainda **não** há React Testing Library para componentes nem cobertura ampla dos fluxos de UI |
| PBI-067 | READMEs com instruções de execução | [#87](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/87) | ✅ Concluído — `api/README.md`, `frontend/README.md` e `mobile/README.md` existem, com pré-requisitos, comandos de execução, estrutura e convenções de commit/PR |
| PBI-068 | Build Android (APK) para demonstração | [#88](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/88) | ✅ Concluído — `mobile/eas.json` com perfis `development`/`preview` em `buildType: apk` (demo) e `production` em `app-bundle`; `mobile/README.md` documenta o build de APK e scripts (`build:apk`, `build:apk:local`, `build:install`) |
| PBI-072 | Demonstração ponta a ponta | [#92](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/92) | ❌ Não feito — o sync de respostas/NCs via batch já funciona; upload de evidências está bloqueado pela flag `EXPO_PUBLIC_EVIDENCE_UPLOAD` ausente do `.env`; falta roteiro/script de demonstração integrado |
| PBI-084 | *P1:* Notificações locais de prazo | [#147](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/147) | ❌ Não feito — não há `scheduleNotificationAsync`/notificação local de prazo; só push remoto |
| PBI-085 | *P1:* Notificações push de nova atribuição | [#155](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/155) | ✅ Concluído — `infrastructure/notifications/pushNotifications.ts` (expo-notifications) solicita permissão, obtém Expo push token e faz `POST /api/v1/devices/register` (chamado no `AuthContext` após login); `subscribeToNotificationTaps`/`useNotificationNavigation` abrem a inspeção pelo `inspectionId` ao toque |
| PBI-086 | *P1:* Assinatura desenhada no dispositivo | [#148](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/148) | ❌ Não feito (sem código) — issue criada no backlog |
| PBI-090 | *P1:* Biometria para reabertura de sessão local | [#152](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/152) | ✅ Concluído — `hooks/useBiometricAuth.ts` (expo-local-authentication) + `BiometricLockScreen`, toggle em `profile.tsx` (`biometricStorage`) e lock por AppState no `_layout.tsx` via `AuthContext.lockSession/unlockSession` |
| PBI-091 | *P1:* Tema escuro (mobile) | [#153](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/153) | ✅ Concluído — infra (`features/theme/ThemeContext.tsx`, `ThemeSelector`, `ThemeProvider` no `_layout.tsx`, paletas em `config/themes.ts`) + telas migradas para `useThemeColors()`: login, abas (sync/profile/inspections) e telas de inspeção (start/checklist/index/summary/non-conformities/evidence/scanner). Restam poucos resquícios de `Colors` estático (cores de marca fixas) |

### Resumo Sprint 2 Mobile (22 itens)

| Categoria | Qtd |
|-----------|-----|
| ✅ Concluído | 18 |
| 🟡 Parcial | 2 |
| ❌ Não feito | 3 |

**Porcentagem: ~82%** concluído (18/22).

> Revisão de 20/10/2026: **PBI-041** passou de 🟡 para ✅ — `scanner.tsx` usa `CameraView` real sem simulação (PR #218). **PBI-053** passou de ❌ para ✅ — `pullChanges(cursor)` é o fluxo principal com cursor incremental. O **PBI-072** foi reclassificado: o sync de respostas/NCs já funciona (`ANSWER_UPSERT`/`NON_CONFORMITY_CREATE` enviados via batch), mas evidências ainda estão atrás da flag desligada — assim o bloqueio da demo é só a variável `EXPO_PUBLIC_EVIDENCE_UPLOAD` no `.env`. Parciais: **PBI-045** (GPS não na conclusão) e **PBI-065** (sem testes de UI). Não feitos: **PBI-072** (demo), **PBI-084** (notificação local) e **PBI-086** (assinatura).

---

## Ressalva de numeração dos itens P1 (renumerados para PBI-083 a PBI-092)

No `cronograma.md` original, os números **PBI-073 a PBI-082** designavam as funcionalidades **P1** (dashboard, notificações locais/push, assinatura, PDF, histórico, comentários de revisão, biometria, tema escuro, CSV). Porém, no GitHub, os números **PBI-073 a PBI-076** já estavam em uso pelas issues #96–#99, com **outro significado** — tarefas de fundação já concluídas (criar protótipos e estruturas base de backend/web/mobile).

Para evitar a colisão, os itens P1 foram **renumerados para PBI-083 a PBI-092** e tiveram suas issues criadas no backlog do quadro (prioridade P1). Mapa da renumeração:

| Antigo | Novo | Feature | Issue |
|--------|------|---------|-------|
| PBI-073 | **PBI-083** | Dashboard com indicadores por estado e criticidade | [#146](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/146) |
| PBI-074 | **PBI-084** | Notificações locais de prazo | [#147](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/147) |
| PBI-075 | **PBI-085** | Notificações push de nova atribuição | [#155](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/155) |
| PBI-076 | **PBI-086** | Assinatura desenhada no dispositivo | [#148](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/148) |
| PBI-077 | **PBI-087** | Relatório PDF básico | [#149](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/149) |
| PBI-078 | **PBI-088** | Histórico detalhado de respostas | [#150](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/150) |
| PBI-079 | **PBI-089** | Comentários de revisão por item | [#151](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/151) |
| PBI-080 | **PBI-090** | Biometria para reabertura de sessão local | [#152](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/152) |
| PBI-081 | **PBI-091** | Tema escuro (web e mobile) | [#153](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/153) |
| PBI-082 | **PBI-092** | Exportação CSV | [#154](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/154) |

---

# Análise PBI a PBI — Sprint 3

> Sprint 3 cobre funcionalidades que **não estavam no cronograma original** das Sprints 1 e 2 mas que foram identificadas como lacunas de integração, melhorias técnicas ou features emergentes durante o desenvolvimento. Os PBIs foram abertos nas issues #221–#232 e seguintes, vinculados aos épicos EP-08 e EP-10.
>
> Esta seção também registra itens das Sprints 1 e 2 que permaneciam pendentes e que foram endereçados na Sprint 3.
>
> Metodologia: mesma das sprints anteriores — veredicto baseado no **código real** do repositório em 20/10/2026.

---

## Sprint 3 Backend (Lucas e Marcela)

> Todos os itens do cronograma das Sprints 1 e 2 já estão 100% concluídos. Os itens da Sprint 3 são funcionalidades emergentes que não constavam no cronograma original.

| PBI | Título | Issue | Veredicto |
|-----|--------|-------|-----------|
| PBI-S3-B01 | Endpoint `GET /mobile/inspections/{id}` — pull individual de inspeção | [#230](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/230) | ✅ Concluído — `MobileInspectionController.getById` (`@GetMapping("/{id}")`) retorna `MobileInspectionResponse` completo incluindo snapshot do template; restrito a TECHNICIAN; sem migration adicional (usa estrutura existente) |
| PBI-S3-B02 | Endpoint `POST /inspections/{id}/evidence` — upload binário de evidência | [#229](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/229) | ✅ Concluído — `EvidenceUploadController.upload` aceita `multipart/form-data` com arquivo e metadados (`itemSnapshotId`, `description`, `location`, `capturedAt`), persiste em `inspection_evidences` e retorna `EvidenceUploadResponse`; restrito a TECHNICIAN; V27 adiciona coluna `location` em `inspection_evidences`; V28 adiciona `equipment_qr_code` em `inspections` |
| PBI-S3-B03 | Sync de respostas via batch (`ANSWER_UPSERT`) | [#232](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/232) | ✅ Concluído — `SyncBatchService.applyAnswerUpsert` persiste resposta em `inspection_answers` via `InspectionAnswerSyncService`, idempotente por `(inspectionId, itemSnapshotId)` e pelo `IdempotencyService`; tipo `ANSWER_UPSERT` presente em `SyncOperationType` |
| PBI-S3-B04 | Sync de NCs via batch (`NON_CONFORMITY_CREATE`) | [#232](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/232) | ✅ Concluído — `SyncBatchService.applyNonConformityCreate` persiste NC via `NonConformitySyncService`, idempotente; tipo `NON_CONFORMITY_CREATE` em `SyncOperationType` |
| PBI-S3-B05 | Sync de evidências via batch (`EVIDENCE_CREATE`) | [#221](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/221) | ✅ Concluído — `SyncBatchService.applyEvidenceCreate` persiste referência de evidência via `EvidenceSyncService`; tipo `EVIDENCE_CREATE` em `SyncOperationType`; nota: o binário da evidência é enviado separadamente via `POST /inspections/{id}/evidence` (PBI-S3-B02) |
| PBI-S3-B06 | `ClientInspectionSiteController` e `SiteEquipmentController` | — | ✅ Concluído — `GET /api/v1/clients/{clientId}/sites` e `GET /api/v1/sites/{siteId}/equipment` existem e são usados na seleção encadeada do agendamento; não tinham registro explícito nas sprints anteriores |
| PBI-S3-B07 | `NonConformityController` paginado | [#228](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/228) | ✅ Concluído — `GET /api/v1/non-conformities` com filtros `inspectionId`, `client`, `severity`, `status` e `Pageable`; restrito a ADMINISTRATOR/SUPERVISOR |

### Resumo Sprint 3 Backend (7 itens)

| Categoria | Qtd |
|-----------|-----|
| ✅ Concluído | 7 |
| 🟡 Parcial | 0 |
| ❌ Não feito | 0 |

**Porcentagem: 100%** (7/7 concluídos)

---

## Sprint 3 Frontend Web (Andressa, Ian, Júlia e Carol)

> Itens não contemplados nas Sprints 1 e 2 do cronograma, identificados como lacunas de integração ou funcionalidades emergentes.

| PBI | Título | Issue | Veredicto |
|-----|--------|-------|-----------|
| PBI-S3-W01 | Portal do técnico (web) — integração com API real | [#224](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/224) | ✅ Concluído — `TechnicianPages.tsx` usa `useTechnicianInspections` → `mobileInspectionsApi.list()` → `GET /api/v1/mobile/inspections`; normalização completa de `BackendMobileInspection` para `TechnicianInspection`; hook `useTechnicianInspections` com estados loading/error/ready; nenhum dado de `@/mocks/technician` |
| PBI-S3-W02 | Página de não conformidades — integração com API real | [#226](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/226) | ✅ Concluído — `NonConformitiesPage` consome `nonConformitiesApi.list()` → `GET /api/v1/non-conformities` com filtros `client`, `severity`, `status` + paginação via `useListQuery`; modal de detalhe; estados loading/erro; nenhum dado de `@/mocks/domain` |
| PBI-S3-W03 | Página de auditoria — integração com API real | [#227](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/227) | ✅ Concluído — `AuditPage` consome `auditApi.getInspectionTimeline(id)` → `GET /api/v1/inspections/{id}/history`; busca por ID com debounce de 400ms; filtros locais por ação e período; `DataTable` com loading/empty/error |
| PBI-S3-W04 | Exportação CSV — botão e download | [#154](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/154) | ❌ Não feito — `GET /api/v1/inspections/export.csv` pronto no backend; não existe função `exportCsv` em nenhum módulo de `src/api/` e não há botão na `InspectionsPage`; identificado como pendente de Sprint 3 |
| PBI-S3-W05 | "Iniciar revisão" formalmente — botão na UI | [#79](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/79) | ❌ Não feito — `inspectionReviewApi.beginReview` mapeado em `inspectionReview.ts`; sem botão/ação na `InspectionReviewPage` para disparar `POST /inspections/{id}/begin-review`; transição formal de SUBMITTED → UNDER_REVIEW nunca é acionada pelo usuário via web |
| PBI-S3-W06 | Detalhe de cliente: lista de locais via API real | [#225](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/225) | 🟡 Parcial — `ClientDetailsPage` já carrega o cliente via `clientsApi.get(clientId)` quando ID é UUID válido; porém a lista de locais exibida na tabela ainda vem de `seedSites` filtrado por `clientId`; edições/adições de locais não persistem no backend |
| PBI-S3-W07 | Detalhe de local: lista de equipamentos via API real | [#225](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/225) | 🟡 Parcial — `ClientSiteDetailsPage` já carrega o local via `sitesApi.get(siteId)` quando ID é UUID válido; porém a tabela de equipamentos ainda vem de `seedEquipment` filtrado por `siteId`; edições/adições de equipamentos não persistem no backend |
| PBI-S3-W08 | Estado offline explícito no frontend web | [#231](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/231) | ❌ Não feito — não há detecção de conectividade (`navigator.onLine` ou similar) nem banner de offline nas páginas integradas; `PBI-064` permanece parcial por esta razão |
| PBI-S3-W09 | Deploy / publicação do painel web admin | [#89](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/89) | ❌ Não feito — CI (`frontend-ci.yml`) roda lint/test/build mas sem etapa de publicação; nenhuma plataforma de deploy configurada (Vercel, Netlify etc.) |

### Resumo Sprint 3 Frontend Web (9 itens)

| Categoria | Qtd |
|-----------|-----|
| ✅ Concluído | 3 |
| 🟡 Parcial | 2 |
| ❌ Não feito | 4 |

**Porcentagem: ~33%** concluído (3/9)

> Os itens ✅ cobrem as integrações do portal do técnico, da página de NCs e da auditoria — todas já consomem a API real. Os ❌ restantes (CSV, beginReview, offline, deploy) e os 🟡 (detalhe de cliente/local) são as lacunas abertas desta sprint.

---

## Sprint 3 Mobile (Rodrigo, Natália e Cutiur)

> Itens não contemplados no cronograma original, identificados como lacunas de integração ou funcionalidades emergentes durante a Sprint 2.

| PBI | Título | Issue | Veredicto |
|-----|--------|-------|-----------|
| PBI-S3-M01 | Envio de respostas via sync batch (`ANSWER_UPSERT`) | [#232](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/232) | ✅ Concluído — `InspectionSyncService` define `SyncPushType` com `ANSWER_UPSERT`; `pushAnswer()` enfileira a resposta no outbox; `pushPendingOperations` envia via `POST /api/v1/mobile/sync/push` com payload `{type: "ANSWER_UPSERT", payload: {...}}`; `enqueueAnswer()` chamado após cada salvamento local |
| PBI-S3-M02 | Envio de NCs via sync batch (`NON_CONFORMITY_CREATE`) | [#232](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/232) | ✅ Concluído — `pushNonConformity()` + `enqueueNonConformity()` enfileiram e enviam NC via batch; tipo `NON_CONFORMITY_CREATE` em `SyncPushType` |
| PBI-S3-M03 | Pull individual de inspeção (`GET /mobile/inspections/{id}`) | [#230](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/230) | ✅ Concluído — `pullInspection(token, id)` chama `GET /api/v1/mobile/inspections/{id}` e persiste no SQLite; usado para refresh pontual após sincronização de status |
| PBI-S3-M04 | Upload de evidências via multipart (`POST /inspections/{id}/evidence`) | [#229](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/229) | 🟡 Parcial — `EvidenceUploadClient` implementado e aponta para o endpoint correto (`POST /api/v1/inspections/{id}/evidence`) que **já existe no backend**; bloqueado pela variável `EXPO_PUBLIC_EVIDENCE_UPLOAD` **ausente do `.env`** (valor padrão `false`); sem essa variável habilitada o upload nunca é tentado; fix é apenas adicionar `EXPO_PUBLIC_EVIDENCE_UPLOAD=enabled` no `.env` |
| PBI-S3-M05 | GPS na conclusão da inspeção | [#65](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/65) | ❌ Não feito — `summary.tsx` não importa `useLocation` nem captura GPS; `conclude()` conclui sem localização; V27 adicionou a coluna `location` em `inspection_evidences` mas o campo de conclusão não é preenchido |
| PBI-S3-M06 | Testes de UI com React Testing Library | [#85](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/85) | ❌ Não feito — `package.json` não tem `@testing-library/react-native`; testes de componente/UI não existem; apenas `pbi044.test.ts` e `pbi054.test.ts` (camada de sync, SQLite in-memory) |
| PBI-S3-M07 | Demonstração ponta a ponta (roteiro + script) | [#92](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/92) | ❌ Não feito — não há roteiro de demo nem script; com `EXPO_PUBLIC_EVIDENCE_UPLOAD` habilitado, o fluxo end-to-end já seria viável (respostas/NCs chegam; evidências chegariam); o bloqueio restante é a variável e a ausência do roteiro |
| PBI-S3-M08 | Notificações locais de prazo (`scheduleNotificationAsync`) | [#147](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/147) | ❌ Não feito — sem `scheduleNotificationAsync` nem listener de prazo; só push remoto funciona |
| PBI-S3-M09 | Assinatura desenhada no dispositivo | [#148](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/148) | ❌ Não feito — sem código; sem lib de canvas/signature |

### Resumo Sprint 3 Mobile (9 itens)

| Categoria | Qtd |
|-----------|-----|
| ✅ Concluído | 3 |
| 🟡 Parcial | 1 |
| ❌ Não feito | 5 |

**Porcentagem: ~33%** concluído (3/9)

> Os itens ✅ (envio de respostas, NCs e pull por ID) representam o núcleo do descompasso de sync resolvido. O 🟡 (upload de evidências) está a um `EXPO_PUBLIC_EVIDENCE_UPLOAD=enabled` no `.env` de ser concluído — o endpoint backend existe e o cliente está implementado. Os ❌ restantes (GPS na conclusão, testes de UI, demo, notificação local, assinatura) são as lacunas remanescentes.

---

## Consolidado Geral — 20/10/2026

| Camada | Sprint 1 | Sprint 2 | Sprint 3 | Total geral |
|--------|----------|----------|----------|-------------|
| **Backend** | ✅ 23/23 (100%) | ✅ 14/14 (100%) | ✅ 7/7 (100%) | ✅ 44/44 (100%) |
| **Frontend Web** | ✅ 16/16 (100%) | ~69% (9/13) | ~33% (3/9) | ~78% (28/38) |
| **Mobile** | ✅ 13/13 (100%) | ~82% (18/22) | ~33% (3/9) | ~79% (34/44) |

### Itens abertos mais críticos

| Prioridade | Camada | Item | Bloqueio |
|------------|--------|------|---------|
| 🔴 Alta | Mobile | Upload de evidências (PBI-S3-M04) | Adicionar `EXPO_PUBLIC_EVIDENCE_UPLOAD=enabled` no `.env` do mobile |
| 🔴 Alta | Mobile | Demo ponta a ponta (PBI-S3-M07) | Depende do upload de evidências + roteiro |
| 🟠 Média | Frontend Web | Exportação CSV (PBI-S3-W04) | Criar `exportCsv` em `inspectionReport.ts` + botão na `InspectionsPage` |
| 🟠 Média | Frontend Web | "Iniciar revisão" na UI (PBI-S3-W05) | Botão na `InspectionReviewPage` para `beginReview` |
| 🟠 Média | Frontend Web | Detalhe de cliente/local via API (PBI-S3-W06/W07) | Integrar tabelas de locais e equipamentos à API real |
| 🟡 Baixa | Frontend Web | Estado offline na web (PBI-S3-W08) | Detectar `navigator.onLine` + banner |
| 🟡 Baixa | Frontend Web | Deploy (PBI-S3-W09) | Configurar plataforma de publicação |
| 🟡 Baixa | Mobile | GPS na conclusão (PBI-S3-M05) | Adicionar `useLocation` no `summary.tsx` |
| 🟡 Baixa | Mobile | Testes de UI mobile (PBI-S3-M06) | Instalar `@testing-library/react-native` |
| 🟡 Baixa | Mobile | Notificações locais de prazo (PBI-S3-M08) | Implementar `scheduleNotificationAsync` |
| 🟡 Baixa | Mobile | Assinatura no dispositivo (PBI-S3-M09) | Feature sem código — avaliar prioridade |
