# FieldOps — Índice de Evidências para Avaliação

## Objetivo

Este diretório organiza as evidências de avaliação do FieldOps. Ele não substitui os READMEs das aplicações nem a documentação técnica: oferece um índice conciso de rastreabilidade entre a rubrica, a implementação, os testes, as configurações e os registros públicos do projeto.

\`READY\` indica que há uma fonte de evidência concreta e localizável. \`PARTIAL\` indica que somente parte do critério está evidenciada ou que há uma integração identificada ainda incompleta. \`PENDING_VALIDATION\` indica que a implementação pode estar presente no código, mas ainda não há registro de execução, teste em dispositivo, deploy ou prova E2E neste índice.

## Mapa de evidências da rubrica de avaliação

| Dimensão | Evidência | Localização | Status | Observações |
|---|---|---|---|---|
| Visão, requisitos e aderência ao escopo | Requisitos oficiais, backlog de PBIs, regras de negócio e critérios de aceite. | [Escopo do FieldOps](../requisitos/fieldops-requisitos-rubrica.md) | READY | Esta é a fonte de autoridade do escopo para a avaliação. |
| Arquitetura e organização | Aplicações no monorepo, configuração Spring, rotas React, Expo Router e migrations SQLite/Flyway. | [README raiz](../../README.md), [configuração da API](../../api/src/main/resources/application.yml), [rotas Web](../../frontend/src/routes/AppRoutes.tsx), [layout raiz Mobile](../../mobile/app/_layout.tsx) | READY | A stack Web autorizada é React + TypeScript; não há migração para Angular implícita. |
| Aplicativo Mobile | Router, autenticação, execução de inspeção, persistência local e fontes de sync. | [README Mobile](../../mobile/README.md), [app Mobile](../../mobile/app), [código-fonte Mobile](../../mobile/src) | PARTIAL | O código-fonte existe; a instalação do APK e o fluxo completo em dispositivo seguem pendentes de validação. |
| Recursos nativos | Scanner QR, integração de câmera, hook de localização e configuração EAS de APK. | [scanner](<../../mobile/app/(protected)/scanner.tsx>), [hook de localização](../../mobile/src/infrastructure/location/useLocation.ts), [configuração EAS](../../mobile/eas.json) | PENDING_VALIDATION | QR/câmera estão implementados no código. APK, GPS final e evidência em dispositivo não foram registrados. |
| Offline e sincronização | SQLite, fila/outbox, batch de sync, cursor incremental, idempotência, retry e testes de sync. | [database](../../mobile/src/infrastructure/database), [serviço de sync](../../mobile/src/infrastructure/sync/InspectionSyncService.ts), [API de sync](../../api/src/main/java/com/fieldops/sync) | PENDING_VALIDATION | Há código e fontes de testes direcionados; ainda não foi registrada uma execução E2E completa offline→online. |
| Interface administrativa | Rotas protegidas, cadastros, templates, agendamento, revisão, auditoria, dashboard e testes Web. | [código-fonte Web](../../frontend/src), [README Web](../../frontend/README.md) | PARTIAL | Detalhes de cliente/local ainda usam dados seed; consulte [ClientsPage](../../frontend/src/pages/catalog/ClientsPage.tsx). Deploy público segue pendente de validação. |
| API, regras e modelo de dados | JWT/roles, controllers/services/DTOs, Flyway, endpoint de evidências, auditoria, OpenAPI, Docker, seeds e testes automatizados. | [código-fonte da API](../../api/src/main/java/com/fieldops), [migrations](../../api/src/main/resources/db/migration), [README da API](../../api/README.md) | PARTIAL | O código e a configuração local de container existem. Deploy público da API e validação E2E de upload de evidências continuam pendentes. |
| Testes, segurança e qualidade | Resultados de testes API e Web registrados pela auditoria técnica; testes de autorização e fontes de testes de cliente. | [auditoria técnica](auditorias/auditoria-final-fieldops.md), [testes da API](../../api/src/test/java), [testes Web](../../frontend/src) | PARTIAL | API: 180 aprovados, 0 falhas, 0 erros. Suíte Web aprovada. A suíte Mobile segue pendente de validação. |
| Documentação e processo | READMEs das aplicações, OpenAPI, escopo, auditoria e plano coletivo. | [documentação das aplicações](#documentação-das-aplicações), [documentos relacionados](#documentos-de-avaliação-relacionados) | PARTIAL | Este índice melhora a localizabilidade; os demais documentos de avaliação serão produzidos separadamente. |
| Demonstração e defesa técnica | Usuários/dados seed, fluxos de usuário implementados e registros de planejamento. | [seed de demonstração](../../api/src/main/java/com/fieldops/config/DemoSeedRunner.java), [plano coletivo](plano-100-pontos-equipe.md) | PENDING_VALIDATION | Um roteiro E2E completo e uma demonstração registrada ainda não estão disponíveis. |

## Documentação das aplicações

| Aplicação | Documentação | Evidência complementar | Status |
|---|---|---|---|
| API | [api/README.md](../../api/README.md) | [Docker Compose](../../api/docker-compose.yml), [Dockerfile](../../api/Dockerfile), [configuração Render](../../render.yaml) | READY |
| Interface administrativa Web | [frontend/README.md](../../frontend/README.md) | [rotas](../../frontend/src/routes/AppRoutes.tsx), [manifesto de pacotes](../../frontend/package.json) | READY |
| Aplicativo Mobile | [mobile/README.md](../../mobile/README.md) | [configuração Expo](../../mobile/app.json), [configuração EAS](../../mobile/eas.json), [manifesto de pacotes](../../mobile/package.json) | PARTIAL |
| Visão geral do repositório | [README raiz](../../README.md) | [escopo oficial](../requisitos/fieldops-requisitos-rubrica.md) | READY |

## Evidências da API

| Área | Evidência | Localização | Status | Observações |
|---|---|---|---|---|
| Autenticação | Controller e service de login/autenticação. | [AuthController](../../api/src/main/java/com/fieldops/auth/controller/AuthController.java), [AuthService](../../api/src/main/java/com/fieldops/auth/service/AuthService.java) | READY | Há testes unitários/de controller em [testes de auth](../../api/src/test/java/com/fieldops/auth). |
| Autorização | Configuração de segurança JWT no servidor e testes de autorização por perfil. | [SecurityConfig](../../api/src/main/java/com/fieldops/config/SecurityConfig.java), [RoleAuthorizationTest](../../api/src/test/java/com/fieldops/shared/security/RoleAuthorizationTest.java) | READY | A autorização não está limitada aos guards do frontend. |
| Controllers e DTOs | Pacotes de controllers/DTOs administrativos, de inspeção Mobile, sync, evidências e revisão. | [controllers](../../api/src/main/java/com/fieldops), [DTOs](../../api/src/main/java/com/fieldops) | READY | Exemplos concretos: [MobileInspectionController](../../api/src/main/java/com/fieldops/inspection/controller/MobileInspectionController.java) e [MobileSyncController](../../api/src/main/java/com/fieldops/sync/controller/MobileSyncController.java). |
| Services e regras de negócio | Services do ciclo/revisão da inspeção e validação de publicação de template. | [InspectionService](../../api/src/main/java/com/fieldops/inspection/service/InspectionService.java), [InspectionReviewService](../../api/src/main/java/com/fieldops/inspection/service/InspectionReviewService.java), [validador de publicação](../../api/src/main/java/com/fieldops/inspection/service/InspectionTemplatePublicationValidator.java) | READY | Evidência de implementação no código-fonte. |
| Banco de dados e Flyway | Migrations versionadas do schema PostgreSQL. | [migrations Flyway](../../api/src/main/resources/db/migration), [configuração da aplicação](../../api/src/main/resources/application.yml) | READY | As migrations são versionadas no repositório. |
| Sync e idempotência | Processador batch, service de idempotência, service de cursor/pull, DTOs de request e testes. | [SyncBatchService](../../api/src/main/java/com/fieldops/sync/service/SyncBatchService.java), [IdempotencyService](../../api/src/main/java/com/fieldops/sync/service/IdempotencyService.java), [SyncPullService](../../api/src/main/java/com/fieldops/sync/service/SyncPullService.java), [testes de sync](../../api/src/test/java/com/fieldops/sync) | READY | A validação E2E em dispositivo é tratada separadamente abaixo. |
| Upload de evidências | Endpoint multipart, service de storage, metadados e testes de controller. | [EvidenceUploadController](../../api/src/main/java/com/fieldops/evidence/controller/EvidenceUploadController.java), [EvidenceUploadService](../../api/src/main/java/com/fieldops/evidence/service/EvidenceUploadService.java), [teste de upload](../../api/src/test/java/com/fieldops/evidence/controller/EvidenceUploadControllerTest.java) | PARTIAL | Endpoint/fonte de teste existem; o upload Mobile contra ambiente ativo segue pendente de validação. |
| Trilha de auditoria | Modelo, service de auditoria e service de histórico. | [AuditService](../../api/src/main/java/com/fieldops/audit/service/AuditService.java), [service de histórico de respostas](../../api/src/main/java/com/fieldops/audit/service/InspectionAnswerHistoryService.java) | READY | Fontes de testes de revisão/histórico estão em [testes de audit](../../api/src/test/java/com/fieldops/audit). |
| OpenAPI | Configuração OpenAPI e instruções de execução da API. | [OpenApiConfig](../../api/src/main/java/com/fieldops/config/OpenApiConfig.java), [README da API](../../api/README.md) | READY | A disponibilidade pública depende de validação do deploy. |
| Docker/container | Dockerfile da API, stack Compose e manifesto Render. | [Dockerfile](../../api/Dockerfile), [docker-compose.yml](../../api/docker-compose.yml), [render.yaml](../../render.yaml) | PARTIAL | A configuração existe; a demonstração pública da API/container continua pendente de validação. |
| Seed/usuários de demonstração | Bootstrap de usuários de desenvolvimento e dados de inspeção de demonstração. | [DevUsersBootstrapRunner](../../api/src/main/java/com/fieldops/config/DevUsersBootstrapRunner.java), [DemoSeedRunner](../../api/src/main/java/com/fieldops/config/DemoSeedRunner.java) | READY | Consulte o README da API para o ambiente de demonstração controlado. |
| Testes automatizados da API | Execução Maven registrada pela auditoria e árvore de testes. | [auditoria técnica](auditorias/auditoria-final-fieldops.md), [testes da API](../../api/src/test/java) | READY | A auditoria registra 180 testes aprovados, 0 falhas e 0 erros. |

## Evidências Web

| Área | Evidência | Localização | Status | Observações |
|---|---|---|---|---|
| Autenticação e guards | Composição de rotas, testes de sessão/auth e página de login. | [AppRoutes](../../frontend/src/routes/AppRoutes.tsx), [testes de sessão](../../frontend/src/auth/session.test.tsx), [testes de LoginPage](../../frontend/src/pages/auth/LoginPage.test.tsx) | READY | Guards do cliente complementam, mas não substituem, a autorização da API. |
| Cadastros | Páginas/testes de cliente, local e equipamento. | [ClientsPage](../../frontend/src/pages/catalog/ClientsPage.tsx), [SitesPage](../../frontend/src/pages/catalog/SitesPage.tsx), [EquipmentPage](../../frontend/src/pages/equipment/EquipmentPage.tsx) | PARTIAL | Seções de detalhe em \`ClientsPage\` usam clientes/locais/equipamentos seed; não devem ser apresentadas como totalmente integradas à API. |
| Templates | Listagem, builder, preview e testes de templates. | [TemplatesPage](../../frontend/src/pages/inspectionTemplates/TemplatesPage.tsx), [TemplateBuilderPage](../../frontend/src/pages/inspectionTemplates/TemplateBuilderPage.tsx), [testes de templates](../../frontend/src/pages/inspectionTemplates) | READY | Fontes de implementação e testes são localizáveis. |
| Planejamento e agendamento | Páginas/testes de nova inspeção e lista de inspeções. | [NewInspectionPage](../../frontend/src/pages/inspections/NewInspectionPage.tsx), [InspectionsPage](../../frontend/src/pages/inspections/InspectionsPage.tsx) | READY | Smoke test em ambiente público continua pendente. |
| Revisão e decisão | Fila de revisão, página de revisão, testes de decisão/histórico/lightbox. | [ReviewQueuePage](../../frontend/src/pages/inspections/ReviewQueuePage.tsx), [InspectionReviewPage](../../frontend/src/pages/inspections/InspectionReviewPage.tsx), [testes de revisão](../../frontend/src/pages/inspections) | READY | A exibição de foto proveniente de upload Mobile real segue pendente de validação. |
| Aprovação/reprovação | Página de revisão e evidência de revisão na API. | [InspectionReviewPage](../../frontend/src/pages/inspections/InspectionReviewPage.tsx), [ReviewInspectionControllerTest](../../api/src/test/java/com/fieldops/inspection/controller/ReviewInspectionControllerTest.java) | READY | A demonstração completa do fluxo de usuário continua pendente de validação. |
| Auditoria | Página de auditoria, componente de timeline e testes. | [AuditPage](../../frontend/src/pages/audit/AuditPage.tsx), [AuditTimeline](../../frontend/src/components/inspections/AuditTimeline.tsx) | READY | |
| Dashboard | Página de dashboard e testes. | [DashboardPage](../../frontend/src/pages/dashboard/DashboardPage.tsx), [testes de DashboardPage](../../frontend/src/pages/dashboard/DashboardPage.test.tsx) | READY | |
| Testes e build Web | Fontes de teste e scripts do frontend. | [testes Web](../../frontend/src), [package.json](../../frontend/package.json), [auditoria técnica](auditorias/auditoria-final-fieldops.md) | READY | A auditoria registra uma suíte Web aprovada. Uma URL Web pública ainda está pendente de validação. |

## Evidências Mobile

| Área | Evidência | Localização | Status | Observações |
|---|---|---|---|---|
| Expo Router | Layouts de rota raiz e protegida. | [layout raiz](../../mobile/app/_layout.tsx), [layout protegido](<../../mobile/app/(protected)/_layout.tsx>) | READY | Evidência da arquitetura no código-fonte. |
| Autenticação | Contexto de auth e armazenamento seguro de token. | [AuthContext](../../mobile/src/features/auth/AuthContext.tsx), [token storage](../../mobile/src/infrastructure/storage/tokenStorage.ts) | READY | A execução em dispositivo não é declarada aqui. |
| Checklist dinâmico | Telas de inspeção e componentes de campo. | [rotas de inspeção](<../../mobile/app/(protected)/inspections>), [componentes de campo](../../mobile/src/components/fieldops) | READY | |
| Persistência SQLite | Provider, migrations e repositories. | [DatabaseProvider](../../mobile/src/infrastructure/database/DatabaseProvider.tsx), [migrations](../../mobile/src/infrastructure/database/migrations.ts), [repositories](../../mobile/src/infrastructure/database/repositories) | READY | O cenário E2E de persistência/recuperação segue pendente de validação. |
| Outbox e sync | Repository da fila e service de sync. | [SyncQueueRepository](../../mobile/src/infrastructure/database/repositories/SyncQueueRepository.ts), [InspectionSyncService](../../mobile/src/infrastructure/sync/InspectionSyncService.ts) | PENDING_VALIDATION | O código implementa fila/sync; não há prova E2E offline→online registrada. |
| QR Code | Rota de scanner baseada em câmera. | [scanner](<../../mobile/app/(protected)/scanner.tsx>) | PENDING_VALIDATION | \`CameraView\` está presente; a validação em dispositivo físico segue pendente. |
| Câmera/fotos | Persistência de mídia, repository de evidência e cliente de upload. | [persistência de mídia](../../mobile/src/infrastructure/media/persistEvidenceFile.ts), [EvidenceRepository](../../mobile/src/infrastructure/database/repositories/EvidenceRepository.ts), [EvidenceUploadClient](../../mobile/src/infrastructure/sync/EvidenceUploadClient.ts) | PENDING_VALIDATION | O upload é condicionado por \`EXPO_PUBLIC_EVIDENCE_UPLOAD\`; não há afirmação de upload E2E ativo. |
| Localização | Hook de localização e fluxo de início da inspeção. | [useLocation](../../mobile/src/infrastructure/location/useLocation.ts), [rotas de inspeção](<../../mobile/app/(protected)/inspections>) | PENDING_VALIDATION | A evidência auditada atual não comprova GPS capturado/sincronizado na conclusão. |
| Não conformidades | Repository local e fonte de teste de sync de respostas/NC. | [NonConformityRepository](../../mobile/src/infrastructure/database/repositories/NonConformityRepository.ts), [teste PBI-051](../../mobile/src/infrastructure/sync/__tests__/pbi051-answers-ncs.test.ts) | PENDING_VALIDATION | Código/fonte de teste existem; a validação E2E completa segue pendente. |
| Evidências/retry | Teste de upload de evidência e fonte de sync com retry. | [teste PBI-044](../../mobile/src/infrastructure/sync/__tests__/pbi044.test.ts), [serviço de sync](../../mobile/src/infrastructure/sync/InspectionSyncService.ts) | PENDING_VALIDATION | Não comprova upload em backend ativo. |
| Correção após reprovação | Teste do repository local de inspeção e rotas protegidas. | [teste PBI-062](../../mobile/src/infrastructure/database/repositories/__tests__/pbi062.test.ts), [rotas de inspeção](<../../mobile/app/(protected)/inspections>) | PENDING_VALIDATION | Requer fluxo executado de reprovação/correção como prova final. |
| Biometria | Hook biométrico e integração de autenticação. | [useBiometricAuth](../../mobile/src/hooks/useBiometricAuth.ts), [AuthContext](../../mobile/src/features/auth/AuthContext.tsx) | PENDING_VALIDATION | A validação nativa em dispositivo não foi registrada. |
| Testes Mobile | Fontes de testes de sync/componentes e scripts de pacote. | [testes de sync](../../mobile/src/infrastructure/sync/__tests__), [testes de sincronização](../../mobile/src/features/synchronization/__tests__), [package.json](../../mobile/package.json) | PENDING_VALIDATION | Não trate arquivos de teste como suíte executada: a execução Jest reproduzível segue pendente. |
| Build Android | Configuração de build EAS. | [eas.json](../../mobile/eas.json), [README Mobile](../../mobile/README.md) | PENDING_VALIDATION | Não há APK final instalado registrado. |

## Evidências de offline e sincronização

Esta seção diferencia presença de código de validação E2E. Nenhuma linha marcada como \`PENDING_VALIDATION\` deve ser lida como demonstração concluída em dispositivo.

| Capacidade | Implementado no código | Evidência de validação E2E | Status | Localização |
|---|---|---|---|---|
| SQLite | Sim: provider, migrations e repositories. | Não registrada. | PENDING_VALIDATION | [database](../../mobile/src/infrastructure/database) |
| Outbox | Sim: \`SyncQueueRepository\` e orquestração de sync. | Não registrada. | PENDING_VALIDATION | [queue repository](../../mobile/src/infrastructure/database/repositories/SyncQueueRepository.ts), [serviço de sync](../../mobile/src/infrastructure/sync/InspectionSyncService.ts) |
| Batch push | Sim: service Mobile de sync e service batch do servidor. | Não registrada. | PENDING_VALIDATION | [sync Mobile](../../mobile/src/infrastructure/sync/InspectionSyncService.ts), [batch da API](../../api/src/main/java/com/fieldops/sync/service/SyncBatchService.java) |
| Dependências de operações | Sim: \`dependencyIds\` é tratado pelo serviço de sync. | Não registrada. | PENDING_VALIDATION | [serviço de sync](../../mobile/src/infrastructure/sync/InspectionSyncService.ts) |
| Cursor incremental | Sim: metadados de cursor e implementação de pull; há fonte de teste direcionado. | Não registrada como E2E. | PENDING_VALIDATION | [teste PBI-053](../../mobile/src/infrastructure/sync/__tests__/pbi053.test.ts), [SyncPullService](../../api/src/main/java/com/fieldops/sync/service/SyncPullService.java) |
| Idempotência | Sim: IDs de operação e service de idempotência da API. | Não registrada como retry contra ambiente ativo. | PENDING_VALIDATION | [IdempotencyService](../../api/src/main/java/com/fieldops/sync/service/IdempotencyService.java), [serviço de sync](../../mobile/src/infrastructure/sync/InspectionSyncService.ts) |
| Retry | Sim: fonte de fila/retry de evidências. | Upload/retry ativo não registrado. | PENDING_VALIDATION | [EvidenceUploadClient](../../mobile/src/infrastructure/sync/EvidenceUploadClient.ts), [teste PBI-044](../../mobile/src/infrastructure/sync/__tests__/pbi044.test.ts) |
| Conflito | Sim: tratamento de resultado/estado de sync e migration de versão na API. | Não registrada em cenário completo no dispositivo. | PENDING_VALIDATION | [serviço de sync](../../mobile/src/infrastructure/sync/InspectionSyncService.ts), [migration V25](../../api/src/main/resources/db/migration/V25__add_inspection_version_for_mobile_sync.sql) |
| Respostas | Sim: sync de respostas e fonte de teste direcionado de respostas/NC. | Não registrada como E2E. | PENDING_VALIDATION | [teste PBI-051](../../mobile/src/infrastructure/sync/__tests__/pbi051-answers-ncs.test.ts), [service de sync de respostas](../../api/src/main/java/com/fieldops/audit/service/InspectionAnswerSyncService.java) |
| Não conformidades | Sim: repository local e service de sync da API. | Não registrada como E2E. | PENDING_VALIDATION | [repository Mobile](../../mobile/src/infrastructure/database/repositories/NonConformityRepository.ts), [service da API](../../api/src/main/java/com/fieldops/nonconformity/service/NonConformitySyncService.java) |
| Sincronização de inspeções | Sim: fontes pull/push e controller/testes da API. | Cenário completo offline → reconectar → revisar não registrado. | PENDING_VALIDATION | [MobileSyncController](../../api/src/main/java/com/fieldops/sync/controller/MobileSyncController.java), [testes de sync da API](../../api/src/test/java/com/fieldops/sync) |

## Testes e qualidade

| Área | Resultado registrado | Evidência | Status | Observações |
|---|---|---|---|---|
| API | 180 testes aprovados; 0 falhas; 0 erros. | [auditoria técnica](auditorias/auditoria-final-fieldops.md), [fontes de teste](../../api/src/test/java) | READY | Resultado registrado pela auditoria técnica em 20/10/2026. |
| Web | Suíte de testes aprovada. | [auditoria técnica](auditorias/auditoria-final-fieldops.md), [fontes de teste](../../frontend/src) | READY | A auditoria registra código de saída 0 para o comando de testes Web. |
| Mobile | Não há resultado de suíte reproduzível registrado. | [fontes de teste](../../mobile/src) | PENDING_VALIDATION | A auditoria anterior não conseguiu iniciar o Jest local; não infira uma execução aprovada. |
| Segurança e dependências | Há fontes/testes de autorização no servidor; auditoria atual de dependências não foi registrada. | [SecurityConfig](../../api/src/main/java/com/fieldops/config/SecurityConfig.java), [teste de autorização](../../api/src/test/java/com/fieldops/shared/security/RoleAuthorizationTest.java) | PARTIAL | Ainda é necessária uma verificação atual de vulnerabilidades de dependências. |
| Build/release | Scripts Docker/EAS/Web estão no código-fonte. | [configuração Docker da API](../../api/Dockerfile), [configuração EAS](../../mobile/eas.json), [scripts Web](../../frontend/package.json) | PENDING_VALIDATION | Configuração de build não prova painel Web publicado nem APK instalado. |

## Evidências do GitHub

| Registro | Evidência | Localização | Status | Observações |
|---|---|---|---|---|
| Repositório | Histórico de código, branches, issues, pull requests e commits. | [repositório GitHub](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops) | READY | Use os registros do repositório junto às evidências locais. |
| Backlog e GitHub Project | Quadro do Project utilizado para gestão e consultado pelas auditorias técnicas. | [GitHub Project](https://github.com/users/NataliaNogueira1/projects/2/views/1) | PARTIAL | Snapshots/exportações do Project foram usados nas auditorias técnicas, mas não são evidências navegáveis versionadas. O status do quadro não é fonte de verdade para conclusão funcional. |
| Issues | Escopo, critérios de aceite, status e discussões. | [issues do repositório](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/issues) | READY | Confirme uma issue contra código/testes antes de apresentá-la como concluída. |
| Pull requests | Racional da mudança, revisão, merge e registros de issues relacionadas. | [pull requests do repositório](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/pulls) | PARTIAL | O status e o conteúdo de cada PR precisam ser verificados por mudança; uma branch aberta não é evidência integrada. |
| Commits | Histórico de implementação original e registros de integração. | [commits do repositório](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commits/develop) | READY | Inspecione commits e diffs originais, não apenas contagens agregadas. |

> Merge ownership does not automatically represent implementation ownership.

O merge não representa automaticamente autoria de implementação. A avaliação individual deve considerar commits originais, autor do PR, issue relacionada, arquivos alterados, revisão, evento de merge e coautoria quando aplicável. Este índice não faz atribuições individuais.

## Evidências de avaliação pendentes

- **PENDING_VALIDATION:** APK Android gerado, instalado e identificado para o build avaliado.
- **PENDING_VALIDATION:** URL pública do painel Web, incluindo smoke test de login e revisão.
- **PENDING_VALIDATION:** disponibilidade pública da API/container, configuração CORS e smoke test em cliente real.
- **PENDING_VALIDATION:** upload E2E de evidência/foto a partir do Mobile, incluindo retry/idempotência e exibição na revisão.
- **PENDING_VALIDATION:** GPS capturado e sincronizado na conclusão da inspeção.
- **PENDING_VALIDATION:** demonstração E2E completa sem alteração de estado via Swagger nem edição manual do banco de dados.
- **PENDING_VALIDATION:** execução reproduzível da suíte de testes Mobile e registro dos resultados.

## Documentos de avaliação relacionados

- [Escopo e rubrica oficiais do FieldOps](../requisitos/fieldops-requisitos-rubrica.md)
- [Matriz de rastreabilidade (PBI ↔ issue ↔ PR ↔ develop ↔ teste ↔ aceite)](matriz-rastreabilidade.md)
- [Resposta à auditoria da IA do professor](resposta-auditoria-ia.md)
- [Evidências de execução E2E (a preencher)](evidencias-e2e.md)
- [Segurança de dependências — npm audit (a preencher)](seguranca-dependencias.md)
- [Roteiro de demonstração E2E](demo-runbook.md)
- [Registro de testes](test-results.md)
- [Limitações conhecidas](known-limitations.md)
- [Auditoria técnica final](auditorias/auditoria-final-fieldops.md)
- [Plano coletivo de conclusão](plano-100-pontos-equipe.md)
- [Auditoria diagnóstica da IA do professor](auditorias/auditoria-ia-professor.md)

