# Auditoria Final — FieldOps

> Data da auditoria: 20/10/2026. Branch auditada: `chore/review-adjustments` (`3067767`, igual a `develop`/`origin/develop` no momento da coleta). Esta auditoria não alterou código, issues ou Project.

## 1. Resumo executivo

O núcleo do MVP está substancialmente implementado: API Spring, web administrativo, app Expo/SQLite, fila de sincronização, revisão e dados de demonstração existem e há testes executáveis para API e web. A afirmação antiga de que respostas e não conformidades não sincronizavam é **obsoleta**: o mobile hoje enfileira e envia `ANSWER_UPSERT` e `NON_CONFORMITY_CREATE`, e a API os processa de modo idempotente.

O projeto **não está pronto para declarar o P0 concluído**. O caminho E2E obrigatório fica incompleto porque o upload de fotografia de produção está deliberadamente desligado por `EXPO_PUBLIC_EVIDENCE_UPLOAD`, localização não é capturada na conclusão, não há evidência de APK gerado nem de demo E2E realizada, e não há publicação configurada do painel web. Há ainda divergência arquitetural importante: o documento exige UUID globais para entidades, enquanto a API persiste quase todas com `Long`/`IDENTITY`.

Progresso conservador de P0, por PBIs: **64 DONE, 6 PARTIAL, 1 NOT_IMPLEMENTED, 1 NEEDS_VERIFICATION em 72 itens; 93,1%** pela fórmula definida abaixo. Esse número mede itens de backlog, não substitui a validação E2E: os itens parciais bloqueiam a demonstração.

## 2. Fontes utilizadas

| Fonte | Uso | Limitação |
|---|---|---|
| `docs/requisitos/fieldops-requisitos-rubrica.md` | Fonte primária: escopo, PBIs 001–082, RN, critérios de aceite e DoD. | Documento contém uma repetição do modelo de dados e imagens embutidas; não altera a interpretação do backlog. |
| Código atual (`api`, `frontend`, `mobile`) | Fonte de verdade da implementação: controllers, services, migrations, APIs, telas, SQLite/sync e testes. | Não houve execução de aplicativo em dispositivo físico. |
| `Análise_Integração.md`, `Análise_Integração_FieldOps.md`, `Análise_PBI_PBI_Backend_Frontend_Web.md` | Hipóteses e histórico, sempre revalidados. | Têm conclusões superadas pelo código atual. |
| Git, `git status`, `git log --oneline --decorate -30` | Confirmação de revisão atual. | Os quatro documentos em `docs/analise/` já estavam não rastreados. |
| GitHub Project/issues | Auditoria em 20/10: 152 issues lidas; estados e títulos cruzados com código. | Token permite `repo`, mas não `read:project`; Project/campos/itens não foram lidos. |

Para liberar somente leitura do Kanban, execute `gh auth refresh -s read:project`, seguido de `gh project item-list 2 --owner NataliaNogueira1 --limit 500 --format json`. Não é necessário mudar qualquer issue/card.

## 3. Metodologia

1. Inventariei e li todos os quatro Markdown disponíveis em `docs/analise/`.
2. Extraí o backlog oficial (PBI-001 a PBI-072 P0; PBI-073 a PBI-082 P1), regras RN-001–090 e critérios de aceite do `FieldOps.md`.
3. Inspecionei implementação real: endpoints/controllers, serviços de sync, entidades/migrations, clientes API, telas, mocks de produção e testes.
4. Rodei `api/.mvnw.cmd test`: **180 testes, 0 falhas, 0 erros, 0 ignorados** (36 relatórios Surefire). Rodei `frontend/npm.cmd run test -- --run`: saída com código 0. `mobile/npm.cmd test -- --runInBand` não iniciou: `jest` não está disponível no checkout.
5. Apliquei somente: `DONE`, `PARTIAL`, `NOT_IMPLEMENTED`, `BLOCKED`, `BOARD_INCORRECT`, `OUT_OF_SCOPE`, `DUPLICATE`, `NEEDS_VERIFICATION`. Estado de Project é `NEEDS_VERIFICATION` em todas as linhas porque o token não contém `read:project`.

## 4. Escopo obrigatório extraído do FieldOps.md

O P0 exige fundação e qualidade, identidade/autorização, cadastros, templates versionados e snapshot, agendamento, execução mobile offline, QR/foto/localização/NC, sincronização idempotente, revisão/aprovação, auditoria, testes, dados/README/build/deploy/OpenAPI e demonstração E2E. P1 inclui dashboard, notificações, assinatura, PDF, histórico detalhado, comentários, biometria, tema e CSV. Portal de cliente, multiempresa, tratamento de NC, ERP/IoT/IA, relatórios regulatórios e conflitos colaborativos complexos são P2/futuros, não pré-requisitos do MVP.

Papéis obrigatórios: `ADMINISTRATOR`, `SUPERVISOR`, `TECHNICIAN`; `CLIENT_VIEWER` e portal são futuros. Persistência prevista: PostgreSQL central, SQLite local, storage de arquivos, audit trail e migrations. Fluxo mínimo: cadastrar/selecionar dados → publicar template → agendar/atribuir → baixar → executar com QR/foto/localização offline → sincronizar sem duplicar → revisar → aprovar/reprovar.

## 5. Matriz completa de rastreabilidade

Legenda de evidência: `API` = `api/src/main/java`; `WEB` = `frontend/src`; `MOB` = `mobile/src`; `T` = testes. “Board” é `NEEDS_VERIFICATION` em todas as linhas por indisponibilidade do CLI. Cada PBI é um critério obrigatório rastreável; RN/AC relevantes são indicados na última coluna.

| ID / origem | Frente | Implementação, endpoint/persistência/teste | Issue/board | Status real | Gap / próxima ação / prioridade |
|---|---|---|---|---|---|
| PBI-001 `§15.3` | Todos | Monorepo, READMEs e convenções/CI presentes. | n/d / NV | DONE | — |
| PBI-002 | Mobile | Expo Router, TypeScript e features em `mobile`. | n/d / NV | DONE | — |
| PBI-003 | Web | React/Vite, rotas protegidas e layout. | n/d / NV | DONE | — |
| PBI-004 | API/DB | Spring, PostgreSQL/Flyway, Docker Compose. | n/d / NV | DONE | IDs são `Long`, não UUID (gap transversal). |
| PBI-005 | Todos | workflows e lint/type/test scripts. | n/d / NV | PARTIAL | Jest mobile ausente neste checkout; P2 corrigir instalação/reprodutibilidade. |
| PBI-006 | API | `OpenApiConfig`, Swagger `/v3/api-docs`, seed. | n/d / NV | DONE | — |
| PBI-007–010 | API/Web/Mobile | `/auth/login`, `/refresh`, `/logout`, `/me`; guards e armazenamento seguro mobile. | n/d / NV | DONE | T de auth/web e API. |
| PBI-011–012 | API/Web | `UserController`, `SecurityConfig`, UsersPage e testes de papel. | n/d / NV | DONE | — |
| PBI-013–017 | API/Web | `Client/Site/EquipmentController`, QR único, filtros/paginação; páginas administrativas. | n/d / NV | DONE | Detalhes cliente/local ainda mockados: ver PBI novo P0-04. |
| PBI-018–024 | API/Web | Templates/seções/itens/publicação/preview, snapshot; `AdminInspectionTemplateController`. | n/d / NV | DONE | Snapshot usa IDs numéricos; validar migração UUID como P2. |
| PBI-025–030 | API/Web | `POST/GET /api/v1/inspections`, cancelamento, agendamento encadeado e filtros. | n/d / NV | DONE | — |
| PBI-031–040 | Mobile/API | `/mobile/inspections`, SQLite, checklist dinâmico, respostas/outbox/progresso/conclusão. | n/d / NV | DONE | `FieldOpsContext`, `InspectionSyncService`; testes de sync. |
| PBI-041 | Mobile/API | `scanner.tsx` usa `CameraView`, permission e `/equipment/by-qr/{qrCode}`. | n/d / NV | DONE | — |
| PBI-042–043 | Mobile/API | câmera/galeria, preview e `EvidenceRepository` com vínculo a item. | n/d / NV | DONE | Upload é avaliado separadamente. |
| PBI-044 | Mobile/API | retry, arquivo local e `EvidenceUploadClient`; endpoint multipart existe. | n/d / NV | PARTIAL | Upload desligado por `EXPO_PUBLIC_EVIDENCE_UPLOAD !== enabled`; P0. |
| PBI-045 | Mobile/API | `useLocation` e captura no início. | n/d / NV | PARTIAL | Não captura/envia localização na conclusão; P0. |
| PBI-046 | Mobile/API | NC local/offline e `NON_CONFORMITY_CREATE`; API valida/persiste. | n/d / NV | PARTIAL | Evidência exigida para NC crítica não chega enquanto upload está desligado; P0. |
| PBI-047 | API/Web | review mostra NCs/evidências e endpoint de conteúdo. | n/d / NV | PARTIAL | Foto sincronizada não pode ser demonstrada com flag desligada; P0. |
| PBI-048–055 | Mobile/API | SQLite, outbox, batch com dependências/idempotência, cursor, status e conflito. `MobileSyncController`, `SyncBatchService`; `pbi051`, `pbi053`, `pbi054`. | n/d / NV | DONE | Arquivo binário continua dependente da PBI-044. |
| PBI-056–063 | API/Web/Mobile | fila/review por item/foto/lightbox, botão `beginReview`, approve/reject, retorno de rejeitada e audit. | n/d / NV | DONE | T de controller/review/audit. |
| PBI-064 | Mobile/Web | estados loading/empty/error; `OfflineBanner` + `useOnlineStatus` no `AppLayout`. | n/d / NV | DONE | Correção frente à análise antiga, que estava desatualizada. |
| PBI-065 | Todos | API e web têm testes; mobile contém testes de sync e componentes no código. | n/d / NV | PARTIAL | Não foi possível executar Jest mobile; não há prova de cobertura E2E/device; P2. |
| PBI-066–067 | API/Docs | `DemoSeedRunner`, READMEs dos três componentes. | n/d / NV | DONE | — |
| PBI-068 | Mobile | `eas.json` e scripts `build:apk`. | n/d / NV | NEEDS_VERIFICATION | Não há APK/execução de build como evidência; P1/P0 de entrega. |
| PBI-069 | Web/Infra | CI web faz lint/test/build. | n/d / NV | NOT_IMPLEMENTED | Não há configuração/publicação verificável do painel; P0. |
| PBI-070–071 | API/Infra/Docs | `api/docker-compose`, Dockerfile, `render.yaml`, health, Swagger/OpenAPI e docs. | n/d / NV | DONE | Publicação real Render requer verificação externa. |
| PBI-072 | Todos | Seed, fluxo e integrações existem. | n/d / NV | PARTIAL | Sem evidência de execução E2E com foto/upload, APK e roteiro; P0. |
| PBI-073 | Web/API | dashboard summary, filtros e gráfico. | n/d / NV | DONE | P1, não bloqueia MVP. |
| PBI-074 | Mobile | Sem `scheduleNotificationAsync`. | n/d / NV | NOT_IMPLEMENTED | P3/opcional para término do P0. |
| PBI-075 | Mobile/API | registro Expo token e push de atribuição. | n/d / NV | DONE | Requer validação de credenciais Expo em ambiente. |
| PBI-076 | Mobile | Não há implementação de assinatura. | n/d / NV | NOT_IMPLEMENTED | P3/opcional. |
| PBI-077–079 | API/Web | PDF, histórico de respostas, comentários por item e UI. | n/d / NV | DONE | P1 concluído. |
| PBI-080–081 | Mobile/Web | biometria e tema escuro. | n/d / NV | DONE | P1 concluído. |
| PBI-082 | API/Web | API `GET /inspections/export.csv` e testes API. | n/d / NV | PARTIAL | Sem função/botão download CSV em WEB; P2/P1. |

### Regras e critérios de aceite que mudam o veredicto

| Origem | Evidência / veredicto |
|---|---|
| RN-001–014, AC-AUTH/USERS/MASTER | DONE: status, perfil, QR único, filtros e inativação cobertos por controllers/services e testes. |
| RN-015–031, AC-TEMPLATE/SCHEDULING | DONE: validação/publicação, versão, snapshot, agendamento, cancelamento e auditoria existem. |
| RN-032–044, AC-START/CHECKLIST/COMPLETE | PARTIAL: execução e bloqueio de obrigatórios existem; conclusão não registra localização e evidência crítica depende do upload desligado. |
| RN-045–064, AC-EVIDENCE/QR/LOCATION | PARTIAL: foto/QR/permissões/local inicial existem; upload de foto e localização final/revisão ainda não satisfazem todos os ACs. |
| RN-065–078, AC-SYNC | DONE para dados estruturados (fila, cursor, conflito, idempotência e dependências); PARTIAL para binários por PBI-044. |
| RN-079–090, AC-REVIEW/SECURITY | DONE para revisão, decisão, transições, auditoria e autorização. NEEDS_VERIFICATION para inspeção manual de logs/segredos e de uma implantação pública real. |
| Modelo de dados `§10.2` | PARTIAL: exige UUID globais, mas entidades como `Client`, `User`, `Equipment`, `Inspection` usam `Long` com `GenerationType.IDENTITY`. Não é seguro migrar perto da demo; registrar como dívida arquitetural P2 com plano de migração. |
| AC-RELEASE | PARTIAL: não há prova de APK+dispositivo, upload habilitado e demo completa sem manipulação de BD. |

## 6. Situação por frente

| Frente | Total de critérios compartilhados avaliados | DONE | PARTIAL | Não/NV | Conclusão | Principal evidência/gap |
|---|---:|---:|---:|---:|---:|---|
| Backend / API | 40 | 38 | 2 | 0 | 97,5% | APIs, Flyway, sync e 180 testes; UUID e localização final dependem de fluxo cliente. |
| Web Admin / Supervisor | 35 | 31 | 3 | 1 | 92,9% | detalhes cliente/local mockados, CSV e deploy web. |
| Web Technician | 4 | 4 | 0 | 0 | 100% | portal usa `mobileInspectionsApi`; é melhoria, não canal MVP principal. |
| Mobile | 34 | 29 | 4 | 1 | 91,2% | upload foto, GPS final, teste/build verificáveis e demo. |
| Offline / Sync | 11 | 10 | 1 | 0 | 95,5% | batch/cursor/conflito funcionam; binário desligado. |
| Native Features | 6 | 3 | 2 | 1 | 66,7% | QR e câmera; GPS final e APK sem verificação. |
| Security / Auth | 8 | 8 | 0 | 0 | 100% | JWT, roles, guards e testes. |
| Audit / Review | 8 | 8 | 0 | 0 | 100% | review/audit/history/commentários. |
| Reports / Export | 3 | 2 | 1 | 0 | 83,3% | PDF/histórico; CSV não exposto no web. |
| Testing / QA | 6 | 4 | 1 | 1 | 75,0% | API/web executados; mobile não inicia Jest; sem E2E device. |
| Infrastructure / Deploy | 5 | 3 | 0 | 2 | 60,0% | Docker/Render definidos; painel e APK não comprovados. |
| Documentation / Demo | 5 | 3 | 1 | 1 | 70,0% | READMEs/seed/OpenAPI; roteiro e evidência demo faltam. |

“Web Technician” não é frente independente obrigatória do MVP: o canal obrigatório de campo é o mobile; foi separado apenas para não misturar a integração adicional existente.

## 7. Percentuais de conclusão

Fórmula reproduzível: para cada PBI P0, `DONE=1`, `PARTIAL=0,5`, `NOT_IMPLEMENTED/BLOCKED/NEEDS_VERIFICATION=0`; `% = pontos / critérios obrigatórios × 100`. P1, P2 e fora de escopo não reduzem o percentual. Resultado global: `(64×1 + 6×0,5 + 1×0 + 1×0) / 72 = 67/72 = 93,1%`; restante obrigatório = **6,9%**. A auditoria de issues confirmou as lacunas já contabilizadas e não alterou os percentuais. Os percentuais por frente acima contam critérios compartilhados em mais de uma frente e não devem ser somados.

## 8. Gaps reais encontrados

1. **P0:** habilitação verificável do upload de evidências e prova que foto chega/reaparece na revisão.
2. **P0:** localização no encerramento, com latitude/longitude/precisão/horário visíveis na revisão.
3. **P0:** executar e registrar a demonstração E2E (incluindo offline→online) em APK/dispositivo.
4. **P0:** publicar/verificar o painel administrativo; configuração de CI não é uma versão publicada.
5. **P1/P2:** instalar/lockar dependências do mobile, executar Jest e acrescentar teste E2E crítico.
6. **P1:** integrar as páginas de detalhe cliente/local à API; hoje importam `seedClients`, `seedSites` e `seedEquipment` em `ClientsPage.tsx`.
7. **P1:** expor download CSV no web.
8. **P2:** planejar migração de chaves numéricas para UUID sem tentar fazê-la durante a estabilização da entrega.

## 9. O Kanban está certo?

### Atualização de auditoria GitHub — 20/10/2026

O executável foi localizado em `C:\Program Files\GitHub CLI\gh.exe` e as **issues foram lidas em modo somente leitura**: 152 no total, 23 abertas e 129 fechadas. Contudo, o token autenticado tem `gist`, `read:org`, `repo`, `workflow`, mas **não** `read:project`; `gh project view/field-list/item-list` retornaram “missing required scopes [read:project]”. Portanto, o número de itens do Project, seus campos Status/Priority/Size e a associação issue↔card permanecem **NEEDS_VERIFICATION**. Para completar essa parcela, o titular deve executar `gh auth refresh -s read:project` e repetir apenas as três consultas `gh project`.

Veredicto que é possível sustentar agora: **PARCIALMENTE correto no nível de issues e não auditável no nível do Project**. Há cards fechados indevidamente, cards abertos já entregues, marcos/épicos com estado contraditório e duplicidades. Não há evidência para afirmar que uma coluna do Project está correta.

## 10. Issues faltando no Kanban

O Project continua indisponível, mas o repositório já contém cards para a maior parte das lacunas técnicas. Não criar cards antes de conferir a associação ao Project. As lacunas obrigatórias sem issue PBI individual claramente identificável são: GPS de conclusão com persistência/revisão (a #65 é genérica e duplicada), prova de APK (#88 foi fechado sem evidência), e publicação efetiva do painel (#89 foi fechado sem evidência).

| Título proposto | Frente | Dependências | Prioridade | Size | Critério |
|---|---|---|---|---|---|
| Habilitar e validar upload de evidência no ambiente de demo | Mobile/API | URL HTTPS API, variável EAS/env | P0 | S | PBI-044/047/072 |
| Registrar e sincronizar localização na conclusão | Mobile/API/Web | contrato de status/localização e tela review | P0 | M | PBI-045, AC-LOCATION |
| Executar e anexar evidência da demo E2E Android | Todos | duas tarefas P0 anteriores, seed e APK | P0 | M | PBI-072/AC-RELEASE |
| Publicar painel web e documentar URL | Web/Infra | API/CORS | P0 | M | PBI-069 |
| Remover mocks dos detalhes cliente/local | Web/API | endpoints já existem | P1 | M | PBI-013–017 |
| Exportar CSV pela tela de inspeções | Web | endpoint existente | P1 | S | PBI-082 |

## 11. Issues abertas que já estão prontas

| Issue | Veredicto | Evidência |
|---|---|---|
| #31 — épico PBI-048→055 | OPEN incorreto | Todas as PBIs-filhas #68–75 estão fechadas e o código tem SQLite, outbox, batch, cursor e conflito. |
| #227 — portal web do técnico | OPEN incorreto | `TechnicianPages.tsx` usa `useTechnicianInspections` e `mobileInspectionsApi`, sem mock de técnico. |
| #230 — mobile consumir detalhe da inspeção | OPEN incorreto | `MobileInspectionController.getById` e `InspectionSyncService.pullInspection` existem; testes da API cobrem o endpoint. |

Esses três devem ser conferidos no Project antes de qualquer alteração manual, pois não foi possível ler a coluna Status.

## 12. Issues fechadas incorretamente

| Issue | Por que o fechamento não corresponde ao código/aceite |
|---|---|
| #10 — Épico EP-10 | Fechado, mas PBI-065/068/069/072 ainda têm lacunas de teste, APK, publicação web e demo. |
| #33 — marco PBI-064→072 | Mesmo problema: agregado fechado com P0 pendentes. |
| #64 e #61 — PBI-044 | Upload binário está desligado por `EXPO_PUBLIC_EVIDENCE_UPLOAD`; retry local não comprova upload real. Além de incorretos, são duplicados. |
| #62 — PBI-045 | Localização só é capturada no início; falta conclusão/envio/revisão. |
| #66 — PBI-046 e #67 — PBI-047 | NC/evidência crítica e visualização administrativa dependem do upload real ainda desligado. |
| #85 — PBI-065 | Há testes API/web, mas Jest mobile não inicia neste checkout e não há evidência E2E/device. |
| #88 — PBI-068 | `eas.json` é configuração, não APK criado/instalado. |
| #89 — PBI-069 | CI não é painel publicado; nenhuma publicação web foi verificada. |

As #90, #91, #146, #149–153, #155, #168, #221–226, #228, #231 e #232 são compatíveis com a evidência atual. As demais fechadas requerem leitura do Project apenas para confirmar o campo de board, não para reavaliar seu estado de issue.

## 13. Issues fora do escopo original

“Fora do escopo” aqui significa não exigido pelo MVP/P0 de `FieldOps.md`; algumas são melhorias válidas, mas P2/P3. #256 (esqueci senha mobile), #257 (esqueci senha web), #258 (dois seeds por estado), #262 (exibir motivo de cancelamento), #265 (toggle de senha), #259/#260 (remediação de `npm audit` específica) e #246 (UI de versões além da prévia/publicação exigidas) não devem preceder o caminho crítico. #147 e #148 são P1 explícitos, portanto opcionais para P0, não defeitos de escopo.

## 14. Duplicidades

Foram encontradas ao menos cinco famílias: **#60/#63 (PBI-043)**, **#61/#64 (PBI-044)**, **#62/#65 (PBI-045)**, **#43/#93 (PBI-026)** e **#92/#197 (demo/sincronização E2E)**. A colisão histórica #96–99 versus PBI-073–076 é de numeração, não uma entrega duplicada: a análise anterior já documenta a renumeração para PBI-083–092. O Project precisa ser consultado antes de decidir qual card manter como referência.

## 15. Dependências e blockers

```text
API HTTPS + seed ─┬─> APK configurado ─> upload de evidência ─┐
                  └─> painel web/CORS ────────────────────────┼─> demo E2E ─> aceite
GPS de conclusão ──────────────────────────────────────────────┤
sync batch (já feito) ─> revisão/NC/histórico (já feito) ──────┘
```

Blocker maior: a demo obrigatória é bloqueada pela falta de **evidência operacional** de upload de foto, APK/dispositivo e execução E2E. O código de resposta/NC não é mais o blocker. Issues confirmadas no caminho: #229 (upload), #65 (GPS), #204 (backend público/APK), #92 e #197 (demo, duplicadas). O estado “Blocked” do Project é desconhecido por falta de `read:project`.

## 16. Prioridade real do backlog restante

| Prioridade | Itens |
|---|---|
| P0 | #229 upload/teste de evidência; #65 GPS final; #204 backend público/APK; publicação efetiva do painel (#89 fechado indevidamente); #92/#197 demo E2E (duplicadas). |
| P1 | #263/#264 detalhes cliente/local sem mocks; #154 CSV web; restaurar testes mobile e executar suíte. |
| P2 | #255 fotos de NC, #246 UI de versões, teste E2E automatizado/device, UUID e validação de deploy público. |
| P3/opcionais | #147 notificação local, #148 assinatura, #256/#257 recuperação de senha, #258/#262/#265 e melhorias fora do MVP. |

## 17. Caminho crítico

Menor conjunto para dizer que o escopo obrigatório foi concluído: (1) configurar ambientes HTTPS/EAS e seed; (2) habilitar upload de evidência e validar retry/review; (3) capturar/sincronizar GPS final; (4) publicar painel com CORS; (5) gerar APK e executar roteiro E2E offline→online, incluindo aprovação/reprovação; (6) registrar evidências/testes. CSV, assinatura, notificações locais, dashboard e portal cliente podem esperar.

## 18. Plano para terminar o FieldOps

| Ordem/onda | Issue | Descrição | Frente | Depende de | Pri. | Size | Paralelo | Pronto quando |
|---|---|---|---|---|---|---|---|---|
| 1 Wave 0 | #229 | Configurar URL API/EAS e `EXPO_PUBLIC_EVIDENCE_UPLOAD=enabled` no ambiente demo, sem versionar segredo. | Mobile/Infra | API HTTPS | P0 | S | #65 | upload é tentado no APK. |
| 2 Wave 0 | #65 | Implementar GPS no summary/conclusão, transportar e exibir dados. | Mobile/API/Web | contrato | P0 | M | #229 | AC-LOCATION passa. |
| 3 Wave 0 | #204 + #89 | Disponibilizar backend público e publicar painel/documentar CORS; #89 deve ser revalidada, não reaberta nesta auditoria. | Infra/Web | API | P0 | M | #229 | URLs autenticáveis disponíveis. |
| 4 Wave 1 | #229/#255 | Testar foto offline, retry, upload, relação com NC e lightbox administrativo. | Todos | 1, 3 | P0 | M | #65 | evidência chega e persiste. |
| 5 Wave 1 | #88 (revalidar) | Gerar/instalar APK preview e registrar artefato. | Mobile | 1 | P0 | S | 3 | build e instalação comprovados. |
| 6 Wave 1 | #92/#197 | Executar roteiro gravável E2E com seed; consolidar os duplicados depois de ler Project. | Todos | 2–5 | P0 | M | — | AC-RELEASE demonstrado. |
| 7 Wave 2 | #85 (revalidar) | Restaurar dependências Jest, rodar suite e adicionar fluxo crítico UI. | Mobile/QA | node_modules/lock | P1 | S | web fixes | resultado reprodutível. |
| 8 Wave 2 | #263/#264 | Remover mocks de detalhes clientes/locais. | Web | endpoints existentes | P1 | M | CSV | alterações persistem. |
| 9 Wave 2 | #154 | Botão/download CSV. | Web | endpoint existente | P1 | S | #263/#264 | CSV autenticado baixado. |
| 10 Wave 3 | nova P2-01 | Planejar migração UUID (não executar sem janela). | API/DB | backup/migração | P2 | XL | — | plano aprovado/testado. |

## 19. Divergências entre análises anteriores

| Análise anterior | Afirmação | Código atual | Conclusão |
|---|---|---|---|
| Ambas de integração | `beginReview` sem botão. | `InspectionReviewPage.tsx` contém botão e chama `inspectionReviewApi.beginReview`. | DONE, análise antiga. |
| Ambas de integração | comentários de revisão sem UI. | `ItemComments` lista/cria comentários na página de revisão. | DONE, análise antiga. |
| Integração | respostas/NC não são enviados. | `InspectionSyncService.pushAnswer/pushNonConformity`, enqueues e `pbi051-answers-ncs.test.ts`. | DONE para dados estruturados. |
| Integração | cursor não usado. | `pullChanges(cursor)` e `pbi053.test.ts`. | DONE. |
| Integração | QR precisava confirmação. | `scanner.tsx` usa `CameraView`. | DONE. |
| Análises antigas | web offline/deploy ausentes. | Offline banner existe; deploy do API tem Docker/Render, mas não há painel web publicado. | Offline DONE; deploy web NOT_IMPLEMENTED. |

## 20. Riscos para a entrega/demonstração

- A flag de upload torna a foto apenas local no ambiente padrão; isso contradiz a prova E2E requerida.
- Não há prova de APK final nem demo real; configuração não é evidência de entrega.
- CLI GitHub ausente impede correção do Kanban e pode ocultar cards fechados indevidamente.
- Testes mobile não executam neste checkout.
- A divergência UUID é dívida estrutural; não incluí-la no caminho crítico evita risco desnecessário agora, mas deve ser assumida explicitamente.

## 21. Checklist final de conclusão

- [ ] Project/issues lidos com `read:project`; estados corrigidos somente depois desta auditoria.
- [ ] Evidência de foto sincronizada e vista na revisão.
- [ ] GPS de início e conclusão sincronizado/visível.
- [ ] Painel web publicado e CORS validado.
- [ ] APK preview gerado, instalado e conectado ao ambiente demo.
- [ ] Roteiro E2E executado: cadastro/template/agendamento/download/QR/foto/GPS/offline/sync/review/decisão/histórico.
- [ ] Testes API, web e mobile executados e resultado anexado.
- [ ] Seed, README, OpenAPI e URLs de demo revisados.
- [ ] P1/P2 explicitamente separados do aceite P0.
