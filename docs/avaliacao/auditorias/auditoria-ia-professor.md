# Grupo C (Toyota) — Auditoria Notion × GitHub — 20.10.2026

## Escopo e metodologia

Auditoria inicial em 20/10/2026 do repositório 404NOTFOUND_Field_Ops, com foco na branch `develop`. Referenciais: 15 - Backlog do Produto (backlog), 18 - Definição de Pronto - Definition of Done (Definition of Done) e 19 - Critérios de Avaliação (rubrica).
A avaliação distingue existência de código, issue declarada, integração efetiva, testes e demonstração. Commits não equivalem a percentual de conclusão.

## Repositório e branches

Repositório público, branch padrão `develop`, monorepo com `api/`, `frontend/`, `mobile/` e `docs/`. Outras branches identificadas: `feat/mobile-evidence-upload-sync`, `feat/mobile-pull-inspection-by-id`, `feat/pbi-045-end-location`, `feat/pbi-045-location-sync`, `feat/pbi-084-local-notifications`, `feat/pbi-086-signature-canvas`, `feat/pbi-092-csv-export`, `fix/inspections-date-filter-input`, `fix/mobile-evidence-location-sync` e `fix/204-render-datasource-config`. A presença de branch não comprova merge.

## Planejamento versus GitHub

O cronograma do próprio grupo relaciona PBIs a backend, web e mobile, com equipe e datas. A correspondência integral PBI ↔ issue ↔ PR ↔ commit ↔ teste ainda não foi concluída.
Há commits recentes indicando desenvolvimento de dashboard (PBI-083), responsividade, tema e correções da API. Exemplo: merge do dashboard e correção de filtros PostgreSQL. Isso indica trabalho realizado, não aprovação integral do aceite.

## Pendências verificáveis nas issues

- #263: detalhe de cliente ainda descrito como alimentado por mocks; demanda API real.
- #264: detalhe de localização ainda descrito como alimentado por mocks.
- #262: exibição do motivo, autor e data de cancelamento na interface.
- #259: auditoria do grupo reporta 75 vulnerabilidades no mobile (2 críticas, 56 altas, 17 moderadas); é snapshot da issue, não verificação independente atual.
- #260: auditoria do grupo reporta 6 vulnerabilidades no web (1 crítica, 4 altas, 1 moderada); snapshot sujeito a mudança.
- #265: melhoria de usabilidade e acessibilidade do campo de senha.

## Parecer técnico preliminar

O projeto demonstra organização por componentes e registro detalhado de tarefas. Pontos de atenção: telas que ainda usam dados simulados, segurança de dependências e validação ponta a ponta da operação offline, sincronização, revisão e build. A existência de pastas ou merges não comprova a Definition of Done.

## Situação da avaliação

**Nota parcial: não atribuída. Percentual de entrega: não calculado.** O inventário inicial de issues, PRs e commits foi parcial; faltam análise exaustiva por PBI, validação de testes/execução, conferência da conclusão efetiva na `develop` e demonstração. Uma contagem semanal por autor também exige coleta paginada e identificação correta da autoria e da branch, ainda não concluída. Não substituir essas evidências por contagem de arquivos ou commits.

## Próximas verificações

1. Consolidar inventário de PBIs do Notion e do cronograma do grupo, incluindo diferenças de planejamento.
2. Relacionar cada PBI a issues, PRs, commit integrado na `develop`, testes e aceite.
3. Conferir lint, builds e testes de API, web e mobile, além de demonstração end-to-end.
4. Apurar commits por semana e autor na `develop`, distinguindo merges e commits de funcionalidades.
5. Aplicar rubrica de 100 pontos apenas após evidências suficientes, distinguindo grupo e integrantes.

## Visão de implementação por componente — padrão de acompanhamento

**Critério de leitura:** “implementado no código” indica evidência estática na branch avaliada; não implica aceite. “Declarado” provém da documentação da equipe e requer inspeção/teste. “Validado” somente após teste dos critérios do Notion e demonstração integrada.

### Frontend Web — React / Vite — frontend/develop

- **Identificado no código/documentação:** estrutura React 19 + TypeScript + Vite, rotas protegidas, camadas `pages → hooks → api`, componentes de interface, cliente HTTP e testes Vitest. Commits incorporados mostram dashboard (PBI-083), responsividade, ajustes de tema e integração de filtros.
- **Parcial/pendente identificado:** detalhes de cliente (#263) e localização (#264) ainda descritos como alimentados por mocks; justificativa de cancelamento não exibida conforme #262.
- **Não validado:** fluxo completo de cadastro, modelos, agendamento e revisão contra API real; execução de testes e build; correções de dependências relatadas na #260.

### Aplicativo Expo — mobile/develop

- **Identificado no código/documentação:** Expo SDK 57, React Native, TypeScript, Expo Router, SQLite, Secure Store, módulo de conexão, rotas de inspeção/checklist, scanner, evidências e estrutura de outbox/sync. README afirma persistência/offline, mas isso ainda não é demonstração funcional.
- **Parcial/em desenvolvimento:** branches específicas de download, upload de evidências, sincronização/localização, notificações e assinatura; conferir merges na `develop` antes de considerar aceitas.
- **Não validado:** execução efetiva offline após reiniciar app, pull/outbox sem duplicação, câmera/QR/GPS em aparelho, APK e testes independentes. #259 documenta débito de segurança de dependências.

### Backend — Spring Boot — api/develop

- **Identificado no código/documentação:** Java 21, Spring Boot 3.5, PostgreSQL, Flyway, JWT, OpenAPI, dados de demonstração, Docker Compose e endpoint de saúde. Documentação descreve cadastros, modelos, inspeções, auditoria e contratos de sincronização; commits recentes evidenciam correções reais de filtros/dados do dashboard no PostgreSQL.
- **Parcial/atenção:** documentação apresenta ambiente de demonstração com contas fictícias e segredo JWT padrão somente para demonstração; configuração produtiva deve usar segredo próprio. Issue #258 solicita ampliar estados cobertos pelo seed.
- **Não validado:** execução de Maven/Testcontainers, regras críticas, idempotência sob reenvio, upload de evidências e fluxo integrado completo.

### Síntese transversal

- Web: **rotas, módulos e dashboard no código; detalhes ainda usam mocks segundo issues**.
- Expo: **arquitetura e funcionalidades declaradas, mas aceite offline/nativo não verificado**.
- Backend: **API e infraestrutura documentadas; execução e critérios não homologados**.
- **Percentuais por componente:** não apurados; requer cruzamento individual de PBI, issue, PR, código integrado e teste.

## Resumo de commits por autor — branch develop (corte em 20/10/2026)

Histórico de commits **alcançáveis pela branch `develop`**, incluindo merges; todas as datas são datas de autoria do Git. O levantamento inclui `NataliaNogueira1/404NOTFOUND_Field_Ops`. Os números são **commits, não PBIs concluídos e nem nota individual**. Commits com múltiplas alterações, coautorias não registradas ou autoria de merge podem distorcer contribuições.

**Total encontrado:** 587 commits, 9 identificadores de autor distintos.

| Autor (GitHub ou nome no Git) | Commits | Commits de merge* | Demais commits | Primeiro–último (UTC) | Exemplos de mensagens (amostra) |
| --- | --- | --- | --- | --- | --- |
| NataliaNogueira1 | 309 | 101 | 208 | 2026-08-08 a 2026-10-20 | 📝 docs: update sprint analysis verdicts for 20/10/2026 review; 📝 docs: add integration analysis document (20/10/2026) |
| MarcelaMulato | 71 | 24 | 47 | 2026-08-20 a 2026-10-19 | ✅ test: cover dynamic checklist item card component; 🔧 chore: set up React Native component testing with jest projects |
| Rodrigof981 | 61 | 1 | 60 | 2026-08-12 a 2026-10-17 | 🔥 remove: technician sync and NC routes without backend support; ♻️ refactor: drop mock user from technician layout |
| lucasmiguelleite | 54 | 0 | 54 | 2026-08-12 a 2026-10-14 | feat: add incremental mobile sync pull; feat: sync mobile answers and nonconformities |
| JujubsPaes | 37 | 1 | 36 | 2026-08-12 a 2026-10-17 | feat: integrate non-conformities page with API; feat: integrate inspection templates with API |
| Cutiur | 22 | 0 | 22 | 2026-09-14 a 2026-10-07 | ✨ feat: complete PBI-041 acceptance criteria for QR scanner; 🎨 style: replace QR button text with blue circle Ionicons icon |
| DreBartolomeu | 13 | 0 | 13 | 2026-09-11 a 2026-09-23 | ✨ feat: wire DashboardPage to real API with loading/error/empty states; ✨ feat: add loading prop to StatCard with pulse skeleton |
| almeida-carol | 11 | 0 | 11 | 2026-09-15 a 2026-10-14 | feat(pbi-225): integrar listagem e criacao de inspecoes no web (substituir mocks); feat(pbi-224): integrar timeline de auditoria no web (substituir mocks) |
| IanLucasss | 9 | 0 | 9 | 2026-09-15 a 2026-09-26 | feat(mobile): add biometric unlock toggle to Profile screen; feat(mobile): wire biometric lock into AuthGate and AppState |

*Merge identificado heurísticamente pelo título `Merge pull request`, `Merge branch` ou `Merge remote-tracking`; squash merges e merges com título personalizado podem não ser identificados. A autoria é o campo `author` do GitHub quando disponível, caso contrário o nome da assinatura do commit. Essa tabela é um panorama de autoria aparente e não comprova responsabilidade exclusiva, revisão, complexidade ou qualidade.

**Leitura pedagógica:** examinar os PRs, os arquivos modificados e a defesa técnica individual para interpretar os dados. Períodos sem commits na `develop` não demonstram ausência de trabalho em branches não integradas. Não usar contagem como critério isolado de avaliação.

## Avaliação parcial de 0 a 100 — estimativa diagnóstica (20/10/2026)

<aside>
⚠️

**Nota provisória: 69/100.** Pontuação **diagnóstica, não oficial**, atribuída à evidência técnica estática registrada na auditoria de 20/10/2026. Pontos de demonstração/defesa não foram concedidos porque não houve avaliação, **não** porque os alunos falharam. Não é percentual de entrega nem nota individual. Sujeita a revisão após build, teste, aceite de PBIs P0 e defesa.

</aside>

**Fundamentação:** Código estruturado nas três camadas, SQLite/outbox e recursos nativos identificados; telas com mocks, segurança de dependências e aceite integrado pendentes. Branch develop.

| Critério da rubrica oficial (máximo) | Pontos preliminares |
| --- | --- |
| Visão/requisitos (5) | 4 |
| Arquitetura (10) | 8 |
| Mobile (20) | 15 |
| Recursos nativos (10) | 6 |
| Offline/sincronização (15) | 8 |
| Admin Web (10) | 8 |
| API/dados (15) | 12 |
| Testes/segurança (7) | 4 |
| Documentação/processo (4) | 4 |
| Demonstração/defesa (4) | 0 |
| **Total estimado (100)** | **69/100** |

**Indicador separado:** percentual de PBIs P0 efetivamente aceitos = não apurado. Fechamento administrativo de issues não equivale a entrega funcional.
**Próxima avaliação:** reproduzir builds/API/Web/Expo, verificar segurança, recursos nativos, SQLite/outbox e sincronização; executar cenário ponta a ponta e registrar defesa individual. A nota final será publicada em relatório distinto.
**Rubrica:** 19 - Critérios de Avaliação.