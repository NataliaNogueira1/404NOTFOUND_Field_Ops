# Revisão do Kanban por pessoa — status real vs. board

> Verificação do **status real no código** de cada issue atribuída, comparado com a
> coluna do board (projeto #2). Base: código do repositório (`api/`, `frontend/`,
> `mobile/`) na data da revisão (outubro/2026).
>
> Atualização (05/10/2026): re-verificação do código no `develop` após novos merges.
> Mudanças desde a última revisão: #77/#168/#174/#176 (Júlia, PR #208) concluídas;
> #88 (APK) e #80 (reprovação propagada no pull) de Felipe concluídas; #179 (dark
> login/abas mobile, Rodrigo) concluída. #149 (PDF web) e #89 (build web) foram
> fechadas no GitHub, mas a verificação no código mostra que seguem incompletas
> (ver observações nas tabelas).
>
> Atualização 2 (05/10/2026): verificação focada nas issues ainda não concluídas,
> considerando também branches com PR aberto. Resultados: #67 (evidências/NCs reais no
> admin) e #172 (tema escuro na autenticação web) estavam ✅ no `develop` e foram
> corrigidas no doc; #146 (dashboard) e #154 (CSV no front) já estão prontas em PRs
> abertos (#191 e #192) aguardando merge. Confirmadas como pendentes no código:
> #84 (offline web), #89 (deploy), #65 (GPS conclusão), #148, #147, #73, #79, #181.
>
> Legenda: ✅ Concluído · 🟡 Parcial · ❌ Não feito.
>
> Observação de rastreabilidade: pela regra do time, uma issue só vai para **Done**
> quando houver commit que comprove a conclusão (referenciado na issue) ou autorização
> explícita. As issues parciais/não feitas devem ficar em In progress/Ready conforme o
> andamento.

---

## Andressa

| Issue | Tarefa | Status real | Evidência / observação |
|-------|--------|-------------|------------------------|
| #146 | Dashboard | 🟡 Parcial no `develop` / ✅ no PR #191 (aberto) | Backend `GET /api/v1/dashboard/summary` pronto. No `develop`, a `DashboardPage` ainda usa mocks; **no PR #191 (aberto)** ela já consome o summary real via `dashboardApi.getSummary()` (byStatus/overdue/openNonConformities/byCriticality) com loading/erro. Pendente de merge. |
| #148 | Assinatura desenhada no dispositivo | ❌ Não feito | Sem código de assinatura no mobile (nenhuma lib de signature pad nem canvas de captura). |
| #154 | Exportação CSV | 🟡 Parcial no `develop` / ✅ no PR #192 (aberto) | Backend ✅ (`GET /api/v1/inspections/export.csv`, BOM/anti-injection). **No PR #192 (aberto)** o frontend ganhou o botão "Exportar CSV" em `InspectionsPage` → `adminCatalogApi.exportCsv()` baixa o blob com os filtros. Pendente de merge. |

## Carol

| Issue | Tarefa | Status real | Evidência / observação |
|-------|--------|-------------|------------------------|
| #84 | Estados de carregamento, vazio, erro e offline | 🟡 Parcial | Loading/vazio/erro reais nas telas integradas (Users/Clients/Sites/Equipment/Inspections/ReviewQueue, `AnswerHistoryTab`); falta tratamento de **offline** no web. |
| #149 | Relatório PDF (web) | ❌ Não feito (apesar de a issue estar fechada) | `InspectionReportPage` ainda gera PDF via jsPDF com dados de `@/mocks/domain`; não consome o endpoint `GET /api/v1/inspections/{id}/report.pdf` (que **já existe** no backend, `ReportController`). A issue #149 foi fechada no GitHub, mas o front não foi migrado para o endpoint real. |
| #155 | Notificações push de nova atribuição | ✅ Concluído | Backend (`/devices/register` + envio Expo na atribuição) e mobile (`pushNotifications.ts`: permissão + Expo token + register; abre inspeção ao toque). Commits 650134d/81555ef, PR #201. |
| #172 | Tema escuro — telas de autenticação (web) | ✅ Concluído | `LoginPage`/`AuthLayout` usam os tokens semânticos do tema (`bg-surface`, `text-text`, `bg-app-bg`), que o `.dark` redefine em `index.css`, então adaptam ao modo escuro automaticamente. Ressalva menor: resíduo `bg-slate-50` na caixa de dica do rodapé não acompanha o tema. |
| #171 | Tema escuro — padrão base das telas dark | ✅ Concluído | `ThemeProvider` + `ThemeToggle` + persistência em `localStorage` + testes, plugado no `App.tsx`. Base pronta (falta aplicar nas telas). |

## Felipe

| Issue | Tarefa | Status real | Evidência / observação |
|-------|--------|-------------|------------------------|
| #57 | Validação de obrigatórios na conclusão | ✅ Concluído | `summary.tsx` (`tryConclude()`) bloqueia a conclusão listando itens obrigatórios pendentes. PR #194. |
| #88 | Build Android (APK) | ✅ Concluído | `mobile/eas.json` com perfis `development`/`preview` em `buildType: apk` (demo) e `production` em `app-bundle`; `mobile/README.md` documenta build de APK e scripts (`build:apk`, etc.). |
| #80 | Técnico recebe inspeção reprovada para correção | ✅ Concluído | `RejectionBanner` + colunas `rejection_reason/rejected_by/rejected_at` + ação "Corrigir"; o pull agora **propaga** o estado/motivo do servidor (`InspectionSyncService.saveInspectionLocally` mapeia e persiste `rejectionReason/rejectedBy/rejectedAt`). |
| — | Ajustes de bugs | ✅ (vários) | Ex.: crash do Expo Go com `expo-notifications` (PRs #200/#201) e outros fixes mergeados. |

## Ian

| Issue | Tarefa | Status real | Evidência / observação |
|-------|--------|-------------|------------------------|
| #89 | Build e publicação do painel web | 🟡 Parcial (issue fechada) | CI (`frontend-ci.yml`) faz lint+test+build (sem step de deploy); `netlify.toml`/`vercel.json` existem. A issue #89 foi fechada no GitHub, mas não há workflow de deploy ativo no repositório — a publicação depende de integração externa (Vercel/Netlify) fora do código. |
| #65 | Registrar localização na conclusão | 🟡 Parcial | GPS capturado só no início; na conclusão não captura nem envia ao servidor (o batch só manda `{inspectionId, status}`). |
| #152 | Biometria para reabertura de sessão local | ✅ Concluído | `useBiometricAuth` (expo-local-authentication) + `BiometricLockScreen` + lock por AppState no `_layout.tsx`. |
| #147 | Notificações locais de prazo | ❌ Não feito | Sem `scheduleNotificationAsync`/notificação local; só push remoto. |

## Júlia

| Issue | Tarefa | Status real | Evidência / observação |
|-------|--------|-------------|------------------------|
| #77 | Revisão por seção/item (ligar tela real ao backend) | ✅ Concluído | `InspectionReviewPage` reescrita para consumir o backend real (seções/itens do snapshot, pergunta/resposta/observação, destaque de não conformidade, navegação por seção, aprovar/reprovar via endpoints reais). PR #208 (merge). |
| #168 | Evidências reais na revisão (PBI-058) | ✅ Concluído | Endpoint protegido `GET /api/v1/inspection-evidences/{id}/content` + storage em arquivo com proteção a path traversal + metadados (`capturedAt`, `location`, vínculo ao item) + download autenticado via Blob URL no lightbox. PR #208. Observação: seed demo não traz linhas de evidência, então o fluxo foi validado por testes (unit/integração), não com dados no demo. |
| #176 | Tema escuro — telas de inspeção (web) | ✅ Concluído | Telas de `pages/inspections/*` (listagem, agendamento, revisão, histórico, lightbox) adaptadas aos tokens semânticos do tema. PR #208. |
| #174 | Tema escuro — telas de cadastro (web) | ✅ Concluído | Users/Clients/Sites/Equipment (tabelas, filtros, formulários, modais, badges, paginação) adaptados aos tokens do tema. PR #208. |
| #171 | Tema escuro — padrão base das telas dark | ✅ Concluído | Mesma de Carol (base pronta e testada). O `ThemeToggle` agora está renderizado no `Header` (web), permitindo alternar Claro/Escuro/Sistema pela UI. |

## Lucas

| Issue | Tarefa | Status real | Evidência / observação |
|-------|--------|-------------|------------------------|
| #181 | Endpoints de sync de conteúdo (/answers, /evidences, /non-conformities) | ❌ Não feito | `SyncOperationType` só tem `INSPECTION_STATUS`; endpoints de conteúdo não existem. O enum comenta que serão adicionados depois (reaproveitando `SyncBatchService`/`IdempotencyService`). |
| #75 | Detecção de conflito de versão | ✅ Concluído | `server_version` + `baseVersion` + `VersionConflictError` + `markConflict`, com testes (`pbi054.test.ts`). |

## Marcela

| Issue | Tarefa | Status real | Evidência / observação |
|-------|--------|-------------|------------------------|
| #73 | Pull com cursor (sync_metadata) | ❌ Não feito | `pullInspections` baixa tudo; `sync_metadata` só guarda `last_successful_sync` (timestamp), não é cursor incremental. |
| #79 | Iniciar revisão formalmente | ❌ Não feito | Não há ação/estado de "iniciar revisão" formal; aprovar/reprovar na revisão são simulados. |
| #67 | Visualizar evidências e NCs no admin | ✅ Concluído | `InspectionReviewPage` consome `GET /api/v1/inspections/{id}/review` (dados reais): NCs por item + coluna lateral e evidências carregadas sob demanda (`loadEvidenceImage` → Blob) no lightbox. Não é mais mock (PR #208). |

## Rodrigo

| Issue | Tarefa | Status real | Evidência / observação |
|-------|--------|-------------|------------------------|
| #74 | Tela de sync com dados reais | ✅ Concluído | `useSyncStatus` lê o outbox real (`SyncQueueRepository`/`SyncMetadataRepository`), com testes (`pbi054.test.ts`). |
| #150 | Histórico detalhado de respostas | ✅ Concluído | Backend (migration V20 + `/answers/history`) e web (`AnswerHistoryTab` integrado, com testes). PRs #188/#198. |
| #167 | Testes do lightbox | ✅ Concluído | Existe `frontend/src/components/feedback/Lightbox.test.tsx`. |
| #179 | Tema escuro — login e abas (mobile) | ✅ Concluído | `login.tsx` e `(tabs)/_layout.tsx` consomem `useThemeColors()` (background/text/surface/border/tint dinâmicos). Restam só cores de marca fixas (brandMark/link/erro), que não mudam entre temas. |
| #64 | Foto pendente se upload falha | ✅ Concluído | `markFailed`/`retryEvidenceUpload` + "Fotos com falha" no `sync.tsx`, com testes (`pbi044.test.ts`). |

---

## Resumo — concluídas vs. pendentes

**✅ Concluídas (com código comprobatório):**

- #155 Notificações push (Carol)
- #171 Padrão base dark (Carol / Júlia)
- #57 Validação de obrigatórios (Felipe)
- #152 Biometria (Ian)
- #75 Conflito de versão (Lucas)
- #74 Tela de sync, #150 Histórico, #167 Testes do lightbox, #64 Foto pendente, #179 Dark login/abas mobile (Rodrigo)
- #77 Revisão por seção/item, #168 Evidências reais na revisão, #174 Dark mode cadastros, #176 Dark mode inspeções (Júlia) — PR #208 mergeado
- #88 Build APK, #80 Reprovação propagada no pull (Felipe)
- #67 Evidências/NCs reais no admin (Marcela), #172 Tema escuro autenticação web (Carol) — via PR #208 / tokens de tema

**🟡 Parciais:** #84 (estados, falta offline no web), #89 (build web — CI+configs
prontos, sem deploy ativo; issue fechada), #65 (GPS: capturado só no início, não na
conclusão nem enviado ao servidor).

**🟢 Prontas em PR aberto (ainda não mergeadas):** #146 (dashboard integrado ao
`/dashboard/summary` — PR #191), #154 (botão/download de CSV no front — PR #192).

**❌ Não feitas:** #148 (assinatura), #149 (PDF web — issue fechada, mas front ainda usa
mocks e não consome o endpoint real que já existe), #181 (endpoints de sync de conteúdo),
#73 (cursor de sync), #79 (iniciar revisão formal — só aprovar/reprovar existem),
#147 (notificações locais).
