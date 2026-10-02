# Revisão do Kanban por pessoa — status real vs. board

> Verificação do **status real no código** de cada issue atribuída, comparado com a
> coluna do board (projeto #2). Base: código do repositório (`api/`, `frontend/`,
> `mobile/`) na data da revisão (outubro/2026).
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
| #146 | Dashboard | 🟡 Parcial | Backend `GET /api/v1/dashboard/summary` pronto; a tela web existe (`DashboardPage`, Recharts) mas usa mocks, só "Revisões pendentes" é real (`useReviewCount`). Está em **In review**; PR #191. |
| #148 | Assinatura desenhada no dispositivo | ❌ Não feito | Sem código de assinatura no mobile. |
| #154 | Exportação CSV | 🟡 Parcial | Backend ✅ (`GET /api/v1/inspections/export.csv`, com BOM/anti-injection); frontend ❌ (sem botão/download). PR #192 em review cobre o backend. |

## Carol

| Issue | Tarefa | Status real | Evidência / observação |
|-------|--------|-------------|------------------------|
| #84 | Estados de carregamento, vazio, erro e offline | 🟡 Parcial | Loading/vazio/erro reais nas telas integradas (Users/Clients/Sites/Equipment/Inspections/ReviewQueue, `AnswerHistoryTab`); falta tratamento de **offline** no web. |
| #149 | Relatório PDF (web) | ❌ Não feito | `InspectionReportPage` gera PDF via jsPDF com dados de `@/mocks/domain`; não consome o endpoint `report.pdf` do backend. |
| #155 | Notificações push de nova atribuição | ✅ Concluído | Backend (`/devices/register` + envio Expo na atribuição) e mobile (`pushNotifications.ts`: permissão + Expo token + register; abre inspeção ao toque). Commits 650134d/81555ef, PR #201. |
| #172 | Tema escuro — telas de autenticação (web) | ❌ Não feito | `LoginPage` não tem classes `dark:`; não adapta ao modo escuro. |
| #171 | Tema escuro — padrão base das telas dark | ✅ Concluído | `ThemeProvider` + `ThemeToggle` + persistência em `localStorage` + testes, plugado no `App.tsx`. Base pronta (falta aplicar nas telas). |

## Felipe

| Issue | Tarefa | Status real | Evidência / observação |
|-------|--------|-------------|------------------------|
| #57 | Validação de obrigatórios na conclusão | ✅ Concluído | `summary.tsx` (`tryConclude()`) bloqueia a conclusão listando itens obrigatórios pendentes. PR #194. |
| #88 | Build Android (APK) | ❌ Não feito | Sem `eas.json`/config de build de APK. |
| #80 | Técnico recebe inspeção reprovada para correção | 🟡 Parcial | `RejectionBanner` + colunas `rejection_reason/rejected_by/rejected_at` + ação "Corrigir"; o pull não propaga o estado/motivo de reprovação do servidor. |
| — | Ajustes de bugs | ✅ (vários) | Ex.: crash do Expo Go com `expo-notifications` (PRs #200/#201) e outros fixes mergeados. |

## Ian

| Issue | Tarefa | Status real | Evidência / observação |
|-------|--------|-------------|------------------------|
| #89 | Build e publicação do painel web | 🟡 Parcial | Está em **Blocked** no board. CI (`frontend-ci.yml`) + `netlify.toml`/`vercel.json` existem; publicação ativa não confirmada. |
| #65 | Registrar localização na conclusão | 🟡 Parcial | GPS capturado só no início; na conclusão não captura nem envia ao servidor (o batch só manda `{inspectionId, status}`). |
| #152 | Biometria para reabertura de sessão local | ✅ Concluído | `useBiometricAuth` (expo-local-authentication) + `BiometricLockScreen` + lock por AppState no `_layout.tsx`. |
| #147 | Notificações locais de prazo | ❌ Não feito | Sem `scheduleNotificationAsync`/notificação local; só push remoto. |

## Júlia

| Issue | Tarefa | Status real | Evidência / observação |
|-------|--------|-------------|------------------------|
| #77 | Revisão por seção/item (ligar tela real ao backend) | ❌ Não feito | A aba de revisão em `InspectionReviewPage` ainda usa mocks (`reviewAnswers`); aprovar/reprovar são simulados. A aba de histórico que é real é outra issue (PBI-088). |
| #168 | Evidências reais na revisão (PBI-058) | ❌ Não feito | Lightbox/galeria usam fotos de `@/mocks/domain`, não de endpoint do backend. |
| #176 | Tema escuro — telas de inspeção (web) | ❌ Não feito | Páginas de `pages/inspections/*` sem classes `dark:`. |
| #174 | Tema escuro — telas de cadastro (web) | ❌ Não feito | Users/Clients/Sites/Equipment sem classes `dark:`. |
| #171 | Tema escuro — padrão base das telas dark | ✅ Concluído | Mesma de Carol (base pronta e testada). |

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
| #67 | Visualizar evidências e NCs no admin | 🟡 Parcial | Tela existe (`InspectionReviewPage` mostra NCs e modal de evidência), mas com dados mockados. |

## Rodrigo

| Issue | Tarefa | Status real | Evidência / observação |
|-------|--------|-------------|------------------------|
| #74 | Tela de sync com dados reais | ✅ Concluído | `useSyncStatus` lê o outbox real (`SyncQueueRepository`/`SyncMetadataRepository`), com testes (`pbi054.test.ts`). |
| #150 | Histórico detalhado de respostas | ✅ Concluído | Backend (migration V20 + `/answers/history`) e web (`AnswerHistoryTab` integrado, com testes). PRs #188/#198. |
| #167 | Testes do lightbox | ✅ Concluído | Existe `frontend/src/components/feedback/Lightbox.test.tsx`. |
| #179 | Tema escuro — login e abas (mobile) | ❌ Não feito | Login/abas usam `Colors` estático; o `ThemeContext` confirma no comentário que as telas não foram migradas. |
| #64 | Foto pendente se upload falha | ✅ Concluído | `markFailed`/`retryEvidenceUpload` + "Fotos com falha" no `sync.tsx`, com testes (`pbi044.test.ts`). |

---

## Resumo — concluídas vs. pendentes

**✅ Concluídas (com código comprobatório):**

- #155 Notificações push (Carol)
- #171 Padrão base dark (Carol / Júlia)
- #57 Validação de obrigatórios (Felipe)
- #152 Biometria (Ian)
- #75 Conflito de versão (Lucas)
- #74 Tela de sync, #150 Histórico, #167 Testes do lightbox, #64 Foto pendente (Rodrigo)

**🟡 Parciais:** #146 (dashboard), #154 (CSV, só backend), #84 (estados, falta offline),
#80 (reprovação, falta propagar do servidor), #89 (build web, bloqueado), #65 (GPS na
conclusão), #67 (evidências/NCs no admin, mockado).

**❌ Não feitas:** #148 (assinatura), #149 (PDF web), #172/#176/#174/#179 (telas dark),
#77 (revisão por seção ligada ao backend), #168 (evidências reais na revisão), #181
(endpoints de sync de conteúdo), #73 (cursor de sync), #79 (iniciar revisão), #88 (APK),
#147 (notificações locais).
