# Análise PBI a PBI — Backend e Frontend Web (Sprint 1)

> Análise baseada no código real do repositório. Frontend Web considerado apenas funcionalidade integrada com a API (não mocks).
>
> **Atualização (setembro):** os veredictos de backend foram revisados após os merges dos PRs #128–#135. Concluídos desde a última versão: Sprint 1 — PBI-027 (técnico ativo) e PBI-029 (cancelar); Sprint 2 — PBI-051, PBI-052, PBI-060, PBI-061 e PBI-063.
>
> **Revisão de setembro (código atual):** nova verificação no código mudou vereditos adicionais. Backend: **PBI-066** (seed de demonstração `DemoSeedRunner`, restrito ao profile `dev`) passou a ✅. Mobile: com `expo-location` presente, **PBI-034** (iniciar com horário + GPS local) e **PBI-039** (observação por item) passaram a ✅; **PBI-045** passou de ❌ para 🟡 (GPS capturado no início, mas ainda não na conclusão nem enviado ao servidor). READMEs: **PBI-067** e **PBI-001 (mobile)** passaram a ✅ (existem `api/`, `frontend/` e `mobile/README.md`). Com isso, a Sprint 1 Mobile fica **13/13 (100%)**.
>
> **Revisão após PR #142 (`fix/backend-pbi-feedback`):** **PBI-022 (prévia do checklist)** passou a ✅ — foi adicionado o endpoint `GET /api/v1/inspection-templates/{id}/preview`, deixando o **backend da Sprint 1 em 23/23 (100%)**. O agendamento (**PBI-025**) passou a reforçar versão publicada, cliente ativo e equipamento ativo.

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
| PBI-020 | Itens com tipos de resposta | [#37](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/37) | ✅ Concluído — `TemplateItemService` + enum `ResponseType` (TEXT/NUMBER/BOOLEAN/CONFORMITY/SINGLE_CHOICE/DATE) + migrations V7/V11 |
| PBI-021 | Obrigatoriedade e regras de evidência | [#38](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/38) | ✅ Concluído — flags `required`, `observationRequiredOnFailure`, `evidenceRequiredOnFailure` + migration V12 |
| PBI-022 | Prévia do checklist | [#39](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/39) | ✅ Concluído — `GET /api/v1/inspection-templates/{id}/preview` → `InspectionTemplateService.preview` retorna `InspectionTemplatePreviewResponse` (checklist read-only + `validForPublication` + `issues`), rodando o `InspectionTemplatePublicationValidator` fora do publish (PR #142) |
| PBI-023 | Publicar versão imutável | [#40](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/40) | ✅ Concluído — `POST /api/v1/inspection-templates/{id}/publish` → `InspectionTemplateVersionService.publish` (versão imutável) + migration V13 |
| PBI-024 | Snapshot ao criar inspeção | [#41](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/41) | ✅ Concluído — `InspectionService.copyChecklist` → `InspectionItemSnapshot` (colunas `updatable=false`) + migrations V12/V14 |
| PBI-025 | Agendar inspeção | [#42](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/42) | ✅ Concluído — `POST /api/v1/inspections` (status ASSIGNED) + migration V14; agora reforça os critérios de agendamento: versão publicada (`TEMPLATE_VERSION_NOT_PUBLISHED`), cliente ATIVO (`CLIENT_NOT_ACTIVE`) e equipamento ATIVO (`EQUIPMENT_NOT_ACTIVE`) (PR #142) |
| PBI-027 | Atribuir inspeção a técnico | [#44](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/44) | ✅ Concluído — `validateAssignment` agora valida role TECHNICIAN **e** status ATIVO; técnico inativo → 422 `TECHNICIAN_NOT_ACTIVE` (PR #129) |
| PBI-028 | Prioridade, prazo e instruções | [#45](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/45) | ✅ Concluído — `CreateInspectionRequest` (priority/dueDate/dueTime/supervisorInstructions) + enum `Priority`; instruções limitadas a 2000 chars (PR #130) |
| PBI-029 | Cancelar inspeção | [#46](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/46) | ✅ Concluído — `POST /api/v1/inspections/{id}/cancel` com motivo obrigatório (min 10), state machine (bloqueia APPROVED → 422), campos `canceled_at/by/reason` + migration V15, auditoria (PR #128) |

### Resumo Sprint 1 Backend (23 itens)

> Verificado no **código real** do módulo `api/` (controllers, services, entidades e migrações Flyway V1–V18).

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
> Os demais módulos de domínio — usuários, clientes, locais, equipamentos, modelos de inspeção, inspeções, não conformidades e auditoria — possuem telas e fluxos funcionais no frontend, porém ainda utilizam mocks ou stores locais enquanto os respectivos endpoints backend não são implementados.
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
| PBI-011 | CRUD de usuários (telas) | [#21](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/21) | ✅ Concluído no frontend — integração do CRUD com API pendente |
| PBI-013 | CRUD de clientes (telas) | [#23](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/23) | ✅ Concluído no frontend — integração do CRUD com API pendente |
| PBI-014 | CRUD de locais (telas) | [#24](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/24) | ✅ Concluído no frontend — integração do CRUD com API pendente |
| PBI-015 | CRUD de equipamentos (telas) | [#25](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/25) | ✅ Concluído no frontend — integração do CRUD com API pendente |
| PBI-017 | Pesquisa e filtros (telas) | [#26](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/26) | ✅ Concluído no frontend |
| PBI-018 | Modelo em rascunho (telas) | [#35](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/35) | ✅ Concluído no frontend — persistência backend pendente |
| PBI-019 | Seções do checklist (telas) | [#36](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/36) | ✅ Concluído no frontend |
| PBI-020 | Itens com tipos (telas) | [#37](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/37) | ✅ Concluído no frontend |
| PBI-022 | Prévia do checklist | [#39](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/39) | ✅ Concluído |
| PBI-026 | Seleção encadeada cliente→local→equip | [#93](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/93) | ✅ Concluído no frontend |
| PBI-029 | Cancelar inspeção (tela) | [#46](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/46) | ✅ Concluído no frontend — persistência backend pendente |
| PBI-030 | Acompanhar inspeções com filtros | [#47](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/47) | ✅ Concluído no frontend |

### Resumo Sprint 1 Frontend Web (16 itens)

| Categoria | Qtd |
|-----------|-----|
| ✅ Concluído no escopo de frontend | 15 |
| 🟡 Parcial / requer validação externa | 1 |
| ❌ Não feito | 0 |

**Porcentagem do escopo Frontend Web: ~94%** (15/16)

> O PBI-003 foi alinhado à implementação atual em React + Vite; o escopo frontend pode ser avaliado pela estrutura, layout e rotas protegidas entregues.

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

> ⚠️ **Ressalva sobre renovação automática (PBI-010 no cliente web):** o backend está completo (endpoint de refresh + entidade + migration). No frontend existe um interceptor de refresh single-flight já implementado e testado (`src/services/api/httpClient.ts` + `src/services/auth/tokenStorage.ts`), **porém ele ainda não está plugado na aplicação** — a via de sessão ativa (`src/auth/session.ts` + `src/api/client.ts`) guarda apenas o `accessToken` e, ao receber 401, faz logout em vez de renovar. Ou seja, a renovação transparente está codificada mas ainda precisa ser conectada ao app.

Os demais módulos continuam utilizando dados mockados/stores locais enquanto seus respectivos endpoints backend não estão disponíveis.

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

> ⚠️ Diferentemente do Frontend Web, o módulo mobile **ainda não possui testes automatizados**: não há Jest nem Testing Library configurados e não existe script `test` no `package.json` (apenas `start`, `android`, `ios`, `web`, `lint`, `lint:fix`). Há apenas ESLint configurado.

### Pequenos ajustes pendentes identificados no código

- `sync.tsx` exibe métricas fixas de demonstração (ex.: "128 MB", data e "Inspeções atualizadas: 3") em vez de dados reais;
- em `ChecklistItemCard`, o botão "Adicionar foto" de itens em falha usa `inspectionId=ins-compressor` fixo na rota de evidência, ignorando o id real da inspeção.
---

# Análise PBI a PBI — Sprint 2

> Mesma metodologia da Sprint 1: veredicto baseado no **código real** do repositório. Os PBIs e títulos são os previstos no `cronograma.md` para a Sprint 2; os números de issue foram verificados no GitHub.
>
> ⚠️ **Contexto importante:** a Sprint 2 ainda está no começo. A maior parte do backend e as funcionalidades P1 ainda não têm código. Vários itens já presentes (revisão no web, evidências/NC no mobile) foram construídos como **protótipo/mock** durante a Sprint 1 e ainda dependem dos endpoints correspondentes no backend.

## Sprint 2 Backend (Lucas e Marcela)

| PBI | Título | Issue | Veredicto |
|-----|--------|-------|-----------|
| PBI-051 | Envio em lote respeitando dependências | [#71](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/71) | ✅ Concluído — `POST /api/v1/mobile/sync/push` (`SyncBatchService`) ordena por `dependencyIds`, resultado por operação (APPLIED/ALREADY_APPLIED/DEFERRED/FAILED), idempotente (PR #135) |
| PBI-052 | Idempotência — impedir duplicidade no reenvio | [#72](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/72) | ✅ Concluído — store `processed_operations` (migration V18) + `IdempotencyService`; `POST /api/v1/mobile/inspections/{id}/status` retorna ALREADY_APPLIED no reenvio (PR #133) |
| PBI-060 | Aprovar inspeção | [#81](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/81) | ✅ Concluído — `POST /api/v1/inspections/{id}/approve`; UNDER_REVIEW → APPROVED, comentário opcional, auditoria (PR #131) |
| PBI-061 | Reprovar inspeção com motivo obrigatório | [#82](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/82) | ✅ Concluído — `POST /api/v1/inspections/{id}/reject`; motivo obrigatório (min 10), UNDER_REVIEW → REJECTED, auditoria (PR #131) |
| PBI-063 | Auditoria de mudanças de estado | [#83](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/83) | ✅ Concluído — tabela imutável `audit_events` (migration V17) + `AuditService`; `GET /api/v1/inspections/{id}/history`; eventos de criar/atribuir/aprovar/reprovar/cancelar (PRs #132/#134) |
| PBI-066 | Dados de demonstração reproduzíveis (seed) | [#86](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/86) | ✅ Concluído — `DemoSeedRunner` cria dataset coerente (cliente + local + equipamento com QR + modelo publicado + inspeção ASSIGNED), idempotente por `existsByDocument`; **restrição: só roda no profile `dev` com `fieldops.bootstrap.demo-seed.enabled`, não em `prod`** |
| PBI-070 | API em contêiner Docker para demonstração | [#90](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/90) | ✅ Concluído — `docker compose up --build` validado em 25/09/2026: API e PostgreSQL saudáveis, Flyway/seed do perfil `demo`, health, OpenAPI, login e listagem de inspeções retornando 200. A história exige API publicada **ou** executável por contêiner; não requer hospedagem externa. |
| PBI-071 | OpenAPI completo e diagramas | [#91](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/91) | ✅ Concluído — contrato gerado pelo springdoc validado com 39 rotas, esquema Bearer JWT e endpoints críticos; `OpenApiConfig` traz metadados de uso e [`docs/api-diagrams.md`](./api-diagrams.md) documenta os diagramas Mermaid de entidades e estados da inspeção (commit `62495b0`). |
| PBI-083 | *P1:* Dashboard com indicadores por estado e criticidade (API) | [#146](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/146) | ✅ Concluído — `GET /api/v1/dashboard/summary` agrega estados, prioridades, atrasos e não conformidades abertas em quatro queries (sem N+1), aceita `from`, `to`, `client` e `technicianId`, e restringe acesso a ADMINISTRATOR/SUPERVISOR. O domínio `NonConformity` (migration V20) preserva inspeção, item opcional, criticidade e estados OPEN/CLOSED. |
| PBI-085 | *P1:* Notificações push — integração servidor | [#155](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/155) | ✅ Concluído — `POST /api/v1/devices/register` persiste múltiplos tokens por usuário, envio Expo assíncrono é disparado na atribuição e tokens inválidos são removidos. No mobile, `expo-notifications` solicita permissão, registra o Expo token e abre a inspeção pelo `inspectionId` ao toque. |
| PBI-087 | *P1:* Relatório PDF básico | [#149](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/149) | ❌ Não feito (sem código) — issue criada no backlog |
| PBI-088 | *P1:* Histórico detalhado de respostas | [#150](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/150) | ❌ Não feito (sem código) — issue criada no backlog |
| PBI-089 | *P1:* Comentários de revisão por item | [#151](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/151) | ❌ Não feito (sem código) — issue criada no backlog |
| PBI-092 | *P1:* Exportação CSV | [#154](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/154) | ❌ Não feito (sem código) — issue criada no backlog |

### Resumo Sprint 2 Backend (14 itens)

| Categoria | Qtd |
|-----------|-----|
| ✅ Concluído | 10 |
| 🟡 Parcial | 0 |
| ❌ Não feito | 4 |

**Porcentagem: ~71%** concluído (10/14; sem itens parciais).

> Concluídos após os merges de setembro: revisão/aprovação (**PBI-060/061**), sincronização em lote e idempotência (**PBI-051/052**), auditoria de mudanças de estado (**PBI-063**) e o seed reproduzível de demonstração (**PBI-066**, `DemoSeedRunner` — restrito ao profile `dev`).
>
> Ainda em aberto: os endpoints de escrita de conteúdo que o mobile chama no sync (`/answers`, `/evidences`, `/non-conformities`) **ainda não existem** — hoje o único tipo de operação aplicada no batch/idempotência é a transição de status (`/inspections/{id}/status`); os demais tipos podem reutilizar o `IdempotencyService` e o `SyncBatchService`. Os itens P1 (073–082) seguem sem código; os P1 também não têm issue correspondente (os números 073–076 no GitHub são de outras tarefas — ver ressalva ao final).

---

## Sprint 2 Frontend Web (Andressa, Ian, Júlia e Carol)

| PBI | Título | Issue | Veredicto |
|-----|--------|-------|-----------|
| PBI-047 | Visualizar evidências e NCs no admin | [#67](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/67) | 🟡 Parcial — `InspectionReviewPage` mostra NCs e modal de evidência, mas com dados mockados (protótipo) |
| PBI-056 | Lista de inspeções aguardando revisão | [#76](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/76) | 🟡 Parcial — listagem com filtro de revisão existe; integração real com backend pendente |
| PBI-057 | Revisão de respostas por seção e item | [#77](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/77) | 🟡 Parcial — `InspectionReviewPage` agrupa respostas por seção/item, porém em mocks |
| PBI-058 | Lightbox de fotografias na revisão | [#78](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/78) | 🟡 Parcial — há modal de evidência fotográfica; usa dados simulados |
| PBI-059 | Iniciar revisão formalmente | [#79](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/79) | ❌ Não feito — não há ação/estado de "iniciar revisão" formal |
| PBI-064 | Estados de carregamento, vazio, erro e offline | [#84](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/84) | ❌ Não feito — não confirmado como cobertura sistemática no código |
| PBI-069 | Build e publicação do painel web admin | [#89](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/89) | 🟡 Parcial — CI existe (`.github/workflows/frontend-ci.yml`); publicação ainda não configurada |
| PBI-083 | *P1:* Dashboard com indicadores (telas) | [#146](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/146) | ❌ Não feito (sem código) — issue criada no backlog |
| PBI-087 | *P1:* Relatório PDF básico (visualização/download) | [#149](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/149) | ❌ Não feito (sem código) — issue criada no backlog |
| PBI-088 | *P1:* Histórico detalhado de respostas (telas) | [#150](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/150) | ❌ Não feito (sem código) — issue criada no backlog |
| PBI-089 | *P1:* Comentários de revisão por item (telas) | [#151](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/151) | ❌ Não feito (sem código) — issue criada no backlog |
| PBI-091 | *P1:* Tema escuro | [#153](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/153) | ❌ Não feito (sem código) — issue criada no backlog |
| PBI-092 | *P1:* Exportação CSV (botão e download) | [#154](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/154) | ❌ Não feito (sem código) — issue criada no backlog |

### Resumo Sprint 2 Frontend Web (13 itens)

| Categoria | Qtd |
|-----------|-----|
| ✅ Concluído | 0 |
| 🟡 Parcial | 5 |
| ❌ Não feito | 8 |

**Porcentagem: 0%** concluído. Parciais (protótipo/mock): PBI-047, 056, 057, 058 e 069.

> A tela de revisão (aprovar/reprovar com motivo obrigatório, respostas por seção, lightbox) já existe no frontend, porém está explicitamente marcada como protótipo e roda sobre mocks — depende dos endpoints de revisão/aprovação do backend (PBI-060/061), que ainda não existem.

---

## Sprint 2 Mobile (Rodrigo, Natália e Cutiur)

| PBI | Título | Issue | Veredicto |
|-----|--------|-------|-----------|
| PBI-040 | Conclusão com validação de obrigatórios | [#57](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/57) | 🟡 Parcial — `concludeInspection` marca SUBMITTED e enfileira status, mas não valida os itens obrigatórios antes de concluir |
| PBI-041 | Leitura de QR Code para confirmar equipamento | [#58](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/58) | 🟡 Parcial — existe tela `scanner.tsx`, mas não há confirmação real do equipamento por QR |
| PBI-042 | Capturar fotografia e visualizar prévia | [#59](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/59) | ✅ Concluído — `(protected)/evidence.tsx` com câmera/galeria + prévia |
| PBI-043 | Associar fotografia ao item correto | [#63](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/63) | ✅ Concluído — `addEvidence(inspectionId, itemId, ...)` grava evidência vinculada ao item |
| PBI-044 | Foto pendente quando upload falha | [#64](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/64) | 🟡 Parcial — `sync_status='pending'` e outbox tratam pendência genérica; sem tratamento específico de falha de upload de foto |
| PBI-045 | Registrar localização no início e conclusão | [#65](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/65) | 🟡 Parcial — `expo-location` presente; GPS é capturado e gravado localmente **no início** (`start.tsx` + `useLocation`), mas **não na conclusão** (`summary.tsx` conclui sem localização) e ainda **não é enviado ao servidor** (o batch só consome `{inspectionId, status}`) |
| PBI-046 | Registrar não conformidade com criticidade | [#66](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/66) | ✅ Concluído — `addNonConformity` + criação automática ao responder `NAO_CONFORME`, com `Severity` |
| PBI-049 | Respostas persistem após fechar o aplicativo | [#69](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/69) | ✅ Concluído — respostas gravadas em SQLite (`answers`) e recarregadas na inicialização |
| PBI-050 | Registrar alterações na outbox persistente | [#70](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/70) | ✅ Concluído — tabela `sync_queue` + `SyncQueueRepository` (padrão outbox) |
| PBI-053 | Pull de alterações com cursor de sincronização | [#73](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/73) | ❌ Não feito — `pullInspections` baixa tudo; tabela `sync_metadata` existe mas não é usada como cursor |
| PBI-054 | Tela de status de sincronização | [#74](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/74) | 🟡 Parcial — existe a tela `(tabs)/sync.tsx`, mas com métricas fixas de demonstração |
| PBI-055 | Detecção de conflito de versão | [#75](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/75) | ❌ Não feito — sem lógica de conflito de versão |
| PBI-062 | Técnico recebe inspeção reprovada para correção | [#80](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/80) | 🟡 Parcial — há `RejectionBanner` e colunas `rejection_reason`/`rejected_by`/`rejected_at` + ação "Corrigir"; o backend de reprovação já existe (**PBI-061**), mas o `pullInspections` ainda não propaga o motivo/estado de reprovação do servidor para o dispositivo |
| PBI-065 | Testes automatizados dos fluxos críticos | [#85](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/85) | ❌ Não feito — mobile não tem Jest/Testing Library nem script de teste |
| PBI-067 | READMEs com instruções de execução | [#87](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/87) | ✅ Concluído — `api/README.md`, `frontend/README.md` e `mobile/README.md` existem, com pré-requisitos, comandos de execução, estrutura e convenções de commit/PR |
| PBI-068 | Build Android (APK) para demonstração | [#88](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/88) | ❌ Não feito — sem configuração de build de APK |
| PBI-072 | Demonstração ponta a ponta | [#92](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/92) | ❌ Não feito — depende de itens ainda ausentes (aprovação/reprovação, sync real) |
| PBI-084 | *P1:* Notificações locais de prazo | [#147](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/147) | ❌ Não feito (sem código) — issue criada no backlog |
| PBI-085 | *P1:* Notificações push de nova atribuição | [#155](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/155) | ❌ Não feito (sem código) — issue criada no backlog |
| PBI-086 | *P1:* Assinatura desenhada no dispositivo | [#148](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/148) | ❌ Não feito (sem código) — issue criada no backlog |
| PBI-090 | *P1:* Biometria para reabertura de sessão local | [#152](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/152) | ❌ Não feito (sem código) — issue criada no backlog |
| PBI-091 | *P1:* Tema escuro (mobile) | [#153](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues/153) | ❌ Não feito (sem código) — issue criada no backlog |

### Resumo Sprint 2 Mobile (22 itens)

| Categoria | Qtd |
|-----------|-----|
| ✅ Concluído | 6 |
| 🟡 Parcial | 6 |
| ❌ Não feito | 10 |

**Porcentagem: ~27%** concluído (6/22).

> Concluídos: **PBI-042 (foto+prévia)**, **PBI-043 (associar foto ao item)**, **PBI-046 (NC com criticidade)**, **PBI-049 (persistência de respostas)**, **PBI-050 (outbox)** e **PBI-067 (READMEs)**. Parciais dependem de validação, backend ou dados reais: PBI-040, 041, 044, **045 (GPS capturado no início, mas não na conclusão nem enviado ao servidor)**, 054 e 062. Não feitos: cursor de sync (053), conflito (055), testes (065), APK (068), demo (072) e todos os P1.

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
