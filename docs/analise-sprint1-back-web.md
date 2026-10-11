# Análise PBI a PBI — Backend e Frontend Web (Sprint 1)

> Análise baseada no código real do repositório. Frontend Web considerado apenas funcionalidade integrada com a API (não mocks).
>
> **Atualização (setembro):** os veredictos de backend foram revisados após os merges dos PRs #128–#135. Concluídos desde a última versão: Sprint 1 — PBI-027 (técnico ativo) e PBI-029 (cancelar); Sprint 2 — PBI-051, PBI-052, PBI-060, PBI-061 e PBI-063.
>
> **Revisão de setembro (código atual):** nova verificação no código mudou vereditos adicionais. Backend: **PBI-066** (seed de demonstração `DemoSeedRunner`, restrito ao profile `dev`) passou a ✅. Mobile: com `expo-location` presente, **PBI-034** (iniciar com horário + GPS local) e **PBI-039** (observação por item) passaram a ✅; **PBI-045** passou de ❌ para 🟡 (GPS capturado no início, mas ainda não na conclusão nem enviado ao servidor). READMEs: **PBI-067** e **PBI-001 (mobile)** passaram a ✅ (existem `api/`, `frontend/` e `mobile/README.md`). Com isso, a Sprint 1 Mobile fica **13/13 (100%)**.
>
> **Revisão após PR #142 (`fix/backend-pbi-feedback`):** **PBI-022 (prévia do checklist)** passou a ✅ — foi adicionado o endpoint `GET /api/v1/inspection-templates/{id}/preview`, deixando o **backend da Sprint 1 em 23/23 (100%)**. O agendamento (**PBI-025**) passou a reforçar versão publicada, cliente ativo e equipamento ativo.
>
> **Revisão de outubro (código atual):** nova verificação de toda a coluna Veredicto contra o código. Correções factuais no backend: enum `ResponseType` é `TEXT_SHORT/TEXT_LONG/...` (não `TEXT`); migrações Flyway vão até **V26** (não há V22); o `NonConformity` do dashboard é a **V26** (não V20); `DemoSeedRunner` é `@Profile({"dev","demo"})`; o resultado do batch de sync inclui também `CONFLICT`. **Frontend Web** subiu bastante: os CRUDs de catálogo, construtor de modelos, seleção encadeada, cancelamento e listagem **já consomem a API real** (Sprint 1 Web → 16/16); o refresh token single-flight **já está plugado** na sessão ativa; na Sprint 2, **PBI-056** e **PBI-088** estão integrados, e **PBI-083**/**PBI-091** saíram de "sem código" para parciais. **Mobile Sprint 2** teve várias correções: **PBI-040/044/054/055/085/090** passaram a ✅ e **PBI-065/091** a 🟡, elevando a Sprint 2 Mobile para **12/22 (~55%)**.
>
> **Revisão de 05/10/2026 (após PR #208 e re-verificação do código):** a tela de revisão web deixou de ser protótipo. Sprint 2 **Frontend Web**: **PBI-047/057/058** passaram a ✅ (revisão por seção/item, evidências/NCs e lightbox agora consomem o backend real; aprovar/reprovar via `inspectionReviewApi`), e **PBI-091 (web)** foi concluído (`ThemeToggle` exposto no `Header` + telas de cadastros/inspeções adaptadas), elevando a Sprint 2 Web para **6/13 (~46%)**. Sprint 2 **Mobile**: **PBI-062** (pull propaga a reprovação do servidor), **PBI-068** (build de APK via `eas.json`) e **PBI-091 (mobile)** (telas migradas para `useThemeColors()`) passaram a ✅, elevando a Sprint 2 Mobile para **15/22 (~68%)**. Ressalva: **PBI-087** (PDF web) e **PBI-069** (deploy) foram fechados no GitHub, mas no código seguem incompletos — o PDF ainda usa jsPDF/mocks (não consome `report.pdf`) e não há deploy ativo.

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

> Verificado no **código real** do módulo `api/` (controllers, services, entidades e migrações Flyway V1–V26, sem V22).

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
> Os módulos de catálogo — usuários, clientes, locais, equipamentos — e os de modelos de inspeção, agendamento, cancelamento e acompanhamento de inspeções **já estão integrados à API real** (não são mais mocks). Os módulos que ainda utilizam mocks/stores locais são principalmente os de **revisão** (respostas por seção, lightbox de evidências/NCs), **relatório PDF** e boa parte do **dashboard**, enquanto os endpoints correspondentes não são totalmente consumidos.
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
| PBI-013 | CRUD de clientes (telas) | [#23](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/23) | ✅ Concluído — integrado à API real (`clientsApi` → `GET/POST/PUT /api/v1/clients`, `PATCH /{id}/status`); páginas de detalhe ainda usam seeds de `@/mocks/domain` |
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

> O PBI-003 foi alinhado à implementação atual em React + Vite. Revisão de outubro: os CRUDs de catálogo (usuários, clientes, locais, equipamentos), o construtor de modelos (rascunho/seções/itens/prévia), a seleção encadeada, o cancelamento e a listagem de inspeções **já consomem a API real** (não são mais mocks/telas isoladas). Restam apenas pontos de detalhe usando seeds de `@/mocks/domain` como fallback (ex.: páginas de detalhe de cliente e estado inicial de alguns selects).

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

Além da autenticação, os CRUDs de catálogo, o construtor de modelos, a seleção encadeada, o cancelamento, a listagem/acompanhamento de inspeções e, após o PR #208, a **tela de revisão** (respostas por seção/item, lightbox de evidências reais, aprovar/reprovar) já consomem a API real. Os módulos que **ainda dependem de mocks/stores locais** são principalmente o **relatório PDF** e boa parte do **dashboard** — enquanto os endpoints correspondentes não são totalmente consumidos.

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

### Principais fluxos frontend concluídos

Entre os fluxos implementados estão:

- CRUD visual de usuários;
- fluxo Cliente → Local → Equipamento;
- criação e edição de modelos de inspeção;
- criação de draft de modelo realmente novo;
- criação, edição e reordenação de seções;
- criação, edição e reordenação de itens;
- tipos de resposta do checklist;
- prévia utilizando o draft atual;
- seleção encadeada Cliente → Local → Equipamento;
- criação/agendamento mockado de inspeção;
- pesquisa e filtros;
- filtros por período;
- limpar filtros;
- cancelamento de inspeção;
- revisão de inspeções;
- bloqueio de ações em inspeções canceladas;
- não conformidades;
- auditoria;
- Portal Web do Técnico.

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

> Concluídos: **PBI-001 (repositório/convenções + README)**, **PBI-002 (Expo + TS)**, **PBI-008 (login/sessão)**, **PBI-031 (download de inspeções)**, **PBI-032 (filtros)**, **PBI-033 (detalhes)**, **PBI-034 (iniciar com horário + GPS local)**, **PBI-035 (checklist dinâmico)**, **PBI-036 (tipos de resposta)**, **PBI-037 (salvamento local)**, **PBI-038 (progresso)**, **PBI-039 (observações por item)** e **PBI-048 (acesso offline)**.

### Infraestrutura offline e sincronização

O mobile já possui a espinha dorsal de sincronização implementada:

- SQLite versionado (`migrations.ts` v1/v2) com tabelas `inspections`, `inspection_sections`, `inspection_items`, `answers`, `evidences`, `non_conformities`, `sync_queue` (outbox) e `sync_metadata`;
- padrão outbox via `sync_queue` + `SyncQueueRepository`, orquestrado por `InspectionSyncService` (`enqueue*`, `pushPendingOperations`, `pullInspections`, `fullSync`);
- `sync_status` por linha (synced/pending/error) e contagem de tentativas/erros;
- conectividade via `ConnectivityContext` (NetInfo) e `OfflineBanner`.

### Funcionalidades presentes fora do escopo do Sprint 1

Também já existem no código, embora pertençam a PBIs de sprints seguintes:

- captura de evidências (câmera/galeria) em `(protected)/evidence.tsx`;
- leitor de QR Code em `(protected)/scanner.tsx`;
- criação automática de não conformidade ao responder `NAO_CONFORME`;
- fluxo de inspeção reprovada (`RejectionBanner`, colunas `rejection_reason`/`rejected_by`/`rejected_at`, ação "Corrigir");
- tela de conclusão/resumo (`inspections/[id]/summary.tsx`).

### Qualidade e validação (Mobile)

> Atualização: o módulo mobile **já possui testes automatizados** da camada de sincronização. O `package.json` tem `jest`, `jest-expo`, `ts-jest` e script `"test": "jest"`, com `jest.config.js`/`tsconfig.jest.json` e suítes como `src/infrastructure/sync/__tests__/pbi044.test.ts` e `src/features/synchronization/__tests__/pbi054.test.ts` (rodam migrations e repositórios reais em SQLite in-memory). O que ainda falta é React Testing Library para testes de componentes e cobertura dos fluxos de UI. ESLint também está configurado.

### Pequenos ajustes pendentes identificados no código

- `scanner.tsx` ainda é simulado (botão "Simular leitura" com equipamento fixo), sem leitura real de QR por `expo-camera` (PBI-041).

> Observação: os dois itens antes listados aqui — o pull não propagar o estado de reprovação (PBI-062) e as telas usarem `Colors` estático (PBI-091) — **não procedem mais**. O pull agora mapeia `rejectionReason`/`rejectedBy`/`rejectedAt` do servidor, e as telas foram migradas para `useThemeColors()`.

> Observação: o item antes listado aqui sobre o `sync.tsx` exibir métricas fixas de demonstração **não procede mais** — a tela consome dados reais do outbox via `useSyncStatus()` (ver PBI-054).
---

# Análise PBI a PBI — Sprint 2

> Mesma metodologia da Sprint 1: veredicto baseado no **código real** do repositório. Os PBIs e títulos são os previstos no `cronograma.md` para a Sprint 2; os números de issue foram verificados no GitHub.
>
> ⚠️ **Contexto importante:** a Sprint 2 ainda está no começo. A maior parte do backend e as funcionalidades P1 ainda não têm código. Vários itens já presentes (revisão no web, evidências/NC no mobile) foram construídos como **protótipo/mock** durante a Sprint 1 e ainda dependem dos endpoints correspondentes no backend.

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
| PBI-071 | OpenAPI completo e diagramas | [#91](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/91) | ✅ Concluído — contrato gerado pelo springdoc validado com 39 rotas, esquema Bearer JWT e endpoints críticos; `OpenApiConfig` traz metadados de uso e [`docs/api-diagrams.md`](./api-diagrams.md) documenta os diagramas Mermaid de entidades e estados da inspeção (commit `62495b0`). |
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

> Concluídos após os merges de setembro: revisão/aprovação (**PBI-060/061**), sincronização em lote e idempotência (**PBI-051/052**), auditoria de mudanças de estado (**PBI-063**) e o seed reproduzível de demonstração (**PBI-066**, `DemoSeedRunner` — `@Profile({"dev","demo"})`).
>
> Ainda em aberto: os endpoints de escrita de conteúdo que o mobile chama no sync (`/answers`, `/evidences`, `/non-conformities`) **ainda não existem** — hoje o único tipo de operação aplicada no batch/idempotência é a transição de status (`/inspections/{id}/status`); os demais tipos podem reutilizar o `IdempotencyService` e o `SyncBatchService`. Os itens P1 (073–082) seguem sem código; os P1 também não têm issue correspondente (os números 073–076 no GitHub são de outras tarefas — ver ressalva ao final).

---

## Sprint 2 Frontend Web (Andressa, Ian, Júlia e Carol)

| PBI | Título | Issue | Veredicto |
|-----|--------|-------|-----------|
| PBI-047 | Visualizar evidências e NCs no admin | [#67](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/67) | ✅ Concluído — `InspectionReviewPage` mostra NCs e o lightbox de evidências com **dados reais do backend** (download autenticado via Blob URL), não mais mocks (PR #208) |
| PBI-056 | Lista de inspeções aguardando revisão | [#76](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/76) | ✅ Concluído — `ReviewQueuePage` consome `listInspections({ review: true })` (`GET /api/v1/inspections?review=true`) com paginação/busca reais; badge via `useReviewCount` também real |
| PBI-057 | Revisão de respostas por seção e item | [#77](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/77) | ✅ Concluído — `InspectionReviewPage` consome o backend real: seções/itens do snapshot, pergunta/resposta/observação, destaque de não conformidade e navegação por seção (PR #208) |
| PBI-058 | Lightbox de fotografias na revisão | [#78](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/78) | ✅ Concluído — lightbox exibe a fotografia real vinda de `GET /api/v1/inspection-evidences/{id}/content` (download autenticado) com data, localização e item vinculado (PR #208). Observação: seed demo não traz evidências, então validado por testes |
| PBI-059 | Iniciar revisão formalmente | [#79](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/79) | 🟡 Parcial — aprovar/reprovar em `InspectionReviewPage` agora são **reais** (`inspectionReviewApi.approve`/`reject`, habilitados só em `UNDER_REVIEW`); porém ainda **não** há ação/estado formal de "iniciar revisão" (transição dedicada) |
| PBI-064 | Estados de carregamento, vazio, erro e offline | [#84](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/84) | 🟡 Parcial — páginas integradas (Users/Clients/Sites/Equipment/Inspections/ReviewQueue) e `AnswerHistoryTab` têm estados reais de loading/vazio/erro (com retry); falta tratamento específico de **offline** no web |
| PBI-069 | Build e publicação do painel web admin | [#89](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/89) | 🟡 Parcial — CI existe (`.github/workflows/frontend-ci.yml`); publicação ainda não configurada |
| PBI-083 | *P1:* Dashboard com indicadores (telas) | [#146](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/146) | 🟡 Parcial — `DashboardPage` existe e está roteado (`/app/dashboard`) com KPIs/gráficos (Recharts); dados ainda majoritariamente de `@/mocks/domain`, exceto "Revisões pendentes" (`useReviewCount`, API real). Não consome o `GET /api/v1/dashboard/summary` |
| PBI-087 | *P1:* Relatório PDF básico (visualização/download) | [#149](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/149) | 🟡 Parcial — `InspectionReportPage` com prévia e download via jsPDF/`jspdf-autotable`; dados mockados e **não** consome o endpoint `report.pdf` do backend |
| PBI-088 | *P1:* Histórico detalhado de respostas (telas) | [#150](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/150) | ✅ Concluído — `AnswerHistoryTab` (aba em `InspectionReviewPage`) consome `GET /api/v1/inspections/{id}/answers/history` com agrupamento por seção/item e estados loading/ready/not-found/error; tem testes |
| PBI-089 | *P1:* Comentários de revisão por item (telas) | [#151](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/151) | ❌ Não feito (sem código no frontend) — issue no backlog |
| PBI-091 | *P1:* Tema escuro | [#153](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/153) | ✅ Concluído (web) — `ThemeProvider` (claro/escuro/sistema, classe `dark` no `<html>`, persistência em `localStorage`, segue `prefers-color-scheme`) plugado em `App.tsx`, `ThemeToggle` acessível **exposto no `Header`** e telas de cadastros/inspeções adaptadas aos tokens (PRs #208 e dark mode). Mobile é tratado no PBI-091 (mobile) |
| PBI-092 | *P1:* Exportação CSV (botão e download) | [#154](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/154) | ❌ Não feito (sem código no frontend) — issue no backlog |

### Resumo Sprint 2 Frontend Web (13 itens)

| Categoria | Qtd |
|-----------|-----|
| ✅ Concluído | 6 |
| 🟡 Parcial | 5 |
| ❌ Não feito | 2 |

**Porcentagem: ~46%** concluído (6/13). Concluídos: PBI-056 (fila de revisão), PBI-088 (histórico de respostas), PBI-047 (evidências/NCs reais), PBI-057 (revisão por seção/item real), PBI-058 (lightbox com foto real) e PBI-091 (tema escuro web). Parciais: PBI-059, 064, 069, 083 e 087. Não feitos: PBI-089 e 092.

> Revisão de outubro (atualizada após PR #208): a tela de revisão (`InspectionReviewPage`) deixou de ser protótipo — agora consome o backend real (respostas por seção/item, lightbox com fotografia real via `inspection-evidences/{id}/content`, aprovar/reprovar via `inspectionReviewApi`). Com isso, PBI-047/057/058 passaram a ✅ e o tema escuro web (PBI-091) foi concluído com o `ThemeToggle` exposto no `Header` e as telas adaptadas. Seguem pendentes: PBI-059 (não há "iniciar revisão" formal, só aprovar/reprovar), PBI-087 (PDF ainda via jsPDF/mocks, não consome o endpoint real), PBI-083 (dashboard ainda majoritariamente mock), PBI-064 (falta offline no web), PBI-069 (deploy não configurado), PBI-089 e PBI-092 (sem código no front).

---

## Sprint 2 Mobile (Rodrigo, Natália e Cutiur)

| PBI | Título | Issue | Veredicto |
|-----|--------|-------|-----------|
| PBI-040 | Conclusão com validação de obrigatórios | [#57](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/57) | ✅ Concluído — `summary.tsx` calcula itens obrigatórios pendentes e `tryConclude()` **bloqueia** a conclusão abrindo modal "Não é possível concluir"; só chama `conclude()` (SUBMITTED + enfileira status) quando não há obrigatórios faltando |
| PBI-041 | Leitura de QR Code para confirmar equipamento | [#58](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/58) | 🟡 Parcial — existe tela `scanner.tsx`, mas não há confirmação real do equipamento por QR |
| PBI-042 | Capturar fotografia e visualizar prévia | [#59](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/59) | ✅ Concluído — `(protected)/evidence.tsx` com câmera/galeria + prévia |
| PBI-043 | Associar fotografia ao item correto | [#63](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/63) | ✅ Concluído — `addEvidence(inspectionId, itemId, ...)` grava evidência vinculada ao item |
| PBI-044 | Foto pendente quando upload falha | [#64](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/64) | ✅ Concluído — migration v3 adiciona `operation_id/response_id/last_error/retry_count` em `evidences`; `uploadEvidence` usa `EvidenceUploadClient`, em falha chama `markFailed` (preserva o arquivo) e em sucesso `markSyncedById`; dependência foto→resposta via `getReady()`, `retryEvidenceUpload` ("Tentar novamente") e "Fotos com falha" no `sync.tsx`; coberto por `__tests__/pbi044.test.ts` |
| PBI-045 | Registrar localização no início e conclusão | [#65](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/65) | 🟡 Parcial — `expo-location` presente; GPS é capturado e gravado localmente **no início** (`start.tsx` + `useLocation`), mas **não na conclusão** (`summary.tsx` conclui sem localização) e ainda **não é enviado ao servidor** (o batch só consome `{inspectionId, status}`) |
| PBI-046 | Registrar não conformidade com criticidade | [#66](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/66) | ✅ Concluído — `addNonConformity` + criação automática ao responder `NAO_CONFORME`, com `Severity` |
| PBI-049 | Respostas persistem após fechar o aplicativo | [#69](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/69) | ✅ Concluído — respostas gravadas em SQLite (`answers`) e recarregadas na inicialização |
| PBI-050 | Registrar alterações na outbox persistente | [#70](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/70) | ✅ Concluído — tabela `sync_queue` + `SyncQueueRepository` (padrão outbox) |
| PBI-053 | Pull de alterações com cursor de sincronização | [#73](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/73) | ❌ Não feito — `pullInspections` baixa tudo; `sync_metadata`/`SyncMetadataRepository` guarda só `last_successful_sync` (timestamp), não é usado como cursor incremental |
| PBI-054 | Tela de status de sincronização | [#74](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/74) | ✅ Concluído — `(tabs)/sync.tsx` consome `useSyncStatus()` com **dados reais** do outbox (`SyncQueueRepository.getAll/countPending`) e `SyncMetadataRepository.getLastSuccessfulSync`, conectividade via `useConnectivity` e `syncStatusMapping` (synced/pending/error/waiting/conflict); coberto por `__tests__/pbi054.test.ts` |
| PBI-055 | Detecção de conflito de versão | [#75](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/75) | ✅ Concluído — migration v4 adiciona `server_version` em `inspections`; `enqueueTransition`/`enqueueStatusChange` enviam `baseVersion`; `pushInspectionStatus` lança `VersionConflictError` em resultado `CONFLICT`, `pushPendingOperations` chama `markConflict` e `sync.tsx` exibe banner "Conflito de versão"; coberto por `pbi054.test.ts` |
| PBI-062 | Técnico recebe inspeção reprovada para correção | [#80](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/80) | ✅ Concluído — `RejectionBanner` + colunas `rejection_reason`/`rejected_by`/`rejected_at` + ação "Corrigir"; o `pullInspections`/`saveInspectionLocally` agora **propaga** `rejectionReason`/`rejectedBy`/`rejectedAt` do servidor para o dispositivo |
| PBI-065 | Testes automatizados dos fluxos críticos | [#85](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/85) | 🟡 Parcial — `package.json` tem `jest`/`jest-expo`/`ts-jest`, script `"test": "jest"`, `jest.config.js` e suítes reais da camada de sync (`pbi044.test.ts`, `pbi054.test.ts`) rodando migrations/repos em SQLite in-memory; ainda **não** há React Testing Library para componentes nem cobertura ampla dos fluxos de UI |
| PBI-067 | READMEs com instruções de execução | [#87](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/87) | ✅ Concluído — `api/README.md`, `frontend/README.md` e `mobile/README.md` existem, com pré-requisitos, comandos de execução, estrutura e convenções de commit/PR |
| PBI-068 | Build Android (APK) para demonstração | [#88](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/88) | ✅ Concluído — `mobile/eas.json` com perfis `development`/`preview` em `buildType: apk` (demo) e `production` em `app-bundle`; `mobile/README.md` documenta o build de APK e scripts (`build:apk`, `build:apk:local`, `build:install`) |
| PBI-072 | Demonstração ponta a ponta | [#92](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/92) | ❌ Não feito — não há roteiro/fluxo de demo integrando ponta a ponta; o sync ainda só transmite status (sem escrita de respostas/evidências/NCs no servidor) |
| PBI-084 | *P1:* Notificações locais de prazo | [#147](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/147) | ❌ Não feito — não há `scheduleNotificationAsync`/notificação local de prazo; só push remoto |
| PBI-085 | *P1:* Notificações push de nova atribuição | [#155](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/155) | ✅ Concluído — `infrastructure/notifications/pushNotifications.ts` (expo-notifications) solicita permissão, obtém Expo push token e faz `POST /api/v1/devices/register` (chamado no `AuthContext` após login); `subscribeToNotificationTaps`/`useNotificationNavigation` abrem a inspeção pelo `inspectionId` ao toque |
| PBI-086 | *P1:* Assinatura desenhada no dispositivo | [#148](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/148) | ❌ Não feito (sem código) — issue criada no backlog |
| PBI-090 | *P1:* Biometria para reabertura de sessão local | [#152](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/152) | ✅ Concluído — `hooks/useBiometricAuth.ts` (expo-local-authentication) + `BiometricLockScreen`, toggle em `profile.tsx` (`biometricStorage`) e lock por AppState no `_layout.tsx` via `AuthContext.lockSession/unlockSession` |
| PBI-091 | *P1:* Tema escuro (mobile) | [#153](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/153) | ✅ Concluído — infra (`features/theme/ThemeContext.tsx`, `ThemeSelector`, `ThemeProvider` no `_layout.tsx`, paletas em `config/themes.ts`) + telas migradas para `useThemeColors()`: login, abas (sync/profile/inspections) e telas de inspeção (start/checklist/index/summary/non-conformities/evidence/scanner). Restam poucos resquícios de `Colors` estático (cores de marca fixas) |

### Resumo Sprint 2 Mobile (22 itens)

| Categoria | Qtd |
|-----------|-----|
| ✅ Concluído | 15 |
| 🟡 Parcial | 3 |
| ❌ Não feito | 4 |

**Porcentagem: ~68%** concluído (15/22).

> Revisão de outubro (atualizada): além dos já concluídos **PBI-040/042/043/044/046/049/050/054/055/067/085/090**, subiram para ✅ nesta verificação: **PBI-062** (o pull agora propaga `rejectionReason`/`rejectedBy`/`rejectedAt` do servidor), **PBI-068** (build de APK via `eas.json` + README) e **PBI-091 mobile** (telas migradas para `useThemeColors()`: login, abas e telas de inspeção). Parciais: **PBI-041** (scanner simulado), **PBI-045** (GPS no início, mas não na conclusão nem enviado ao servidor) e **PBI-065** (há Jest + testes de sync, falta testar UI). Não feitos: cursor de sync (053), demo ponta a ponta (072), notificações locais (084) e assinatura (086).

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

> Todos os itens P1 agora **têm issue no quadro** (coluna Backlog, prioridade P1). Continuam **sem código** — são melhorias planejadas, fora do escopo mínimo das duas sprints.
