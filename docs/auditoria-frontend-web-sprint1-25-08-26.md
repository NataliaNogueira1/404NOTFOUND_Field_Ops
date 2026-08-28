# Auditoria do Frontend Web FieldOps - Sprint 1

Fonte da auditoria: codigo atual do repositorio em `frontend/`, documentacao em `docs/` e validacoes locais executadas em 25/08/2026. Esta analise nao usa `docs/analise-sprint1-back-web.md` como verdade, apenas como referencia historica.

## A. Resumo executivo

- PBIs auditados: 16.
- PBIs com UI implementada: 13/16.
- PBIs parcialmente implementados: 14/16.
- PBIs realmente ausentes: 1/16, PBI-029 Cancelar inspecao.
- PBIs sem natureza de UI direta: PBI-001 e PBI-005.
- PBIs com integracao/backend pendente: 14/16.
- Frontend ainda e 100% mockado: sim, no codigo de `frontend/src` nao ha `fetch`, `axios`, client HTTP, `VITE_`, token, `localStorage/sessionStorage` ou services.
- Prototipo frontend aproximado: ~80% visual/interativo.
- Integracao frontend <-> backend: 0%.

Observacao critica: PBI-003 fala em "Projeto Next.js com layout", mas o frontend atual e React + Vite. Evidencias: `frontend/package.json`, `frontend/vite.config.ts`, `frontend/src/main.tsx`.

Validacoes executadas:

- `npm run lint`: passou.
- `npm run build`: passou.
- `npm test`: nao existe script em `frontend/package.json`.

## B. Matriz dos PBIs

| PBI | Funcionalidade | UI | Interacao local | API | Veredicto |
|---|---|---:|---:|---:|---|
| PBI-001 | Repositorios e convencoes | N/A | N/A | N/A | Parcialmente atendido no repo |
| PBI-003 | Projeto Next.js com layout | Sim | Sim | Nao | Layout existe, stack divergente, rotas sem protecao |
| PBI-005 | Lint, tipos e fluxo PR | N/A | N/A | N/A | Parcial |
| PBI-009 | Login e sessao | Sim | Sim, mock | Nao | UI existe, sessao real pendente |
| PBI-011 | CRUD usuarios | Sim | Sim, mock | Nao | UI/interacao existem, API pendente |
| PBI-013 | CRUD clientes | Sim | Sim, mock | Nao | UI/interacao existem, API pendente |
| PBI-014 | CRUD locais | Sim | Sim, mock | Nao | UI/interacao existem, API pendente |
| PBI-015 | CRUD equipamentos | Sim | Sim, mock | Nao | UI/interacao existem, API pendente |
| PBI-017 | Pesquisa/filtros | Sim | Parcial | Nao | Parcial, API pendente |
| PBI-018 | Modelo rascunho | Sim | Sim, mock | Nao | Parcial, sem persistencia real |
| PBI-019 | Secoes checklist | Sim | Sim, mock | Nao | Parcial |
| PBI-020 | Itens com tipos | Sim | Sim, mock | Nao | Parcial |
| PBI-022 | Previa checklist | Sim | Sim, mock | Nao | Parcial |
| PBI-026 | Selects encadeados | Sim | Sim, mock | Nao | Funcional em mock, API pendente |
| PBI-029 | Cancelar inspecao | Nao | Nao | Nao | Nao implementado |
| PBI-030 | Acompanhar inspecoes | Sim | Parcial | Nao | Parcial, API pendente |

## C. Analise detalhada

### PBI-001 - Repositorios e convencoes

Veredicto: parcialmente atendido.

O que existe:

- Estrutura clara com `api/`, `frontend/`, `mobile/`, `docs/`, `mocks/`.
- Documentacao de projeto e cronograma.

Evidencias:

- `README.md`
- `docs/cronograma.md`
- `docs/analise-sprint1-back-web.md`

O que falta:

- Nao encontrei `.github/`, workflow de CI ou templates/regras de PR no repositorio local.

Para considerar concluido:

- Formalizar convencoes, fluxo de PR e CI verificavel no repo.

### PBI-003 - Projeto Next.js com layout

Veredicto: UI/layout implementados; divergencia de stack; rotas protegidas pendentes.

O que existe:

- App web administrativo com React Router, layout autenticado visual, sidebar/header, rotas `/app/*`.
- Lazy loading das paginas.

Evidencias:

- `frontend/package.json`
- `frontend/vite.config.ts`
- `frontend/src/routes/AppRoutes.tsx`
- `frontend/src/layouts/AppLayout.tsx`

O que falta:

- Nao e Next.js; e React + Vite.
- Nao ha protecao real de rota: `/app` renderiza direto `AppLayout`.
- Nao ha sessao, role guard ou redirect por autenticacao.

Para considerar concluido:

- Ou ajustar criterio do PBI para Vite, ou migrar para Next.js.
- Implementar autenticacao/guards reais se "rotas protegidas" fizer parte do aceite.

### PBI-005 - Lint, tipos e fluxo de PR

Veredicto: parcial.

O que existe:

- `npm run lint`.
- `npm run build` com `tsc -b && vite build`.
- TypeScript strict.
- Alias `@/*`.
- ESLint com recommended, TypeScript, React Hooks e React Refresh.
- `lint` passou.
- `build` passou.

Evidencias:

- `frontend/package.json`
- `frontend/tsconfig.app.json`
- `frontend/eslint.config.js`
- `frontend/vite.config.ts`

O que falta:

- Nao ha script de testes.
- Nao encontrei `.github/workflows`.
- Nao encontrei regras formais de PR no repo local.
- Nao ha formatter configurado explicitamente.

Para considerar concluido:

- Adicionar CI, regras/checklist de PR, testes ou decisao formal de ausencia de testes, e formatter se requerido.

### PBI-009 - Login e sessao na web

Veredicto: UI implementada; validacao local; autenticacao/sessao reais pendentes.

O que existe:

- Tela de login.
- Validacao com React Hook Form + Zod.
- Campos com valores mockados `marina@fieldops.com` / `123456`.
- Submit navega para `/app/dashboard`.
- Link visual "Esqueci a senha".

Evidencias:

- `frontend/src/pages/auth/LoginPage.tsx`
- `frontend/src/routes/AppRoutes.tsx`

Nao existe:

- Context de auth.
- Token JWT.
- `localStorage`, cookie ou refresh.
- Logout real.
- Protecao de rota.
- Chamada `/login` ou equivalente.
- Tratamento de erro de API.

Para considerar concluido:

- Integrar autenticacao real, persistencia de sessao, refresh/logout, guard de rotas e erros de credenciais/API.

### PBI-011 - CRUD de usuarios

Veredicto: UI implementada; criacao/edicao/status mockados; API pendente.

O que existe:

- Listagem.
- Busca por nome/e-mail.
- Filtro por perfil.
- Filtro por status.
- Modal de novo/editar.
- Ativar/desativar localmente.
- Toast de "salvo no prototipo".

Evidencias:

- `frontend/src/pages/admin/UsersPage.tsx`
- `frontend/src/mocks/domain.ts`
- `frontend/src/types/domain.ts`

Nao existe:

- GET/POST/PUT/PATCH/DELETE users.
- Persistencia apos reload.
- Validacoes fortes no modal.
- Tratamento de erro de backend.

Para considerar concluido:

- Services/API, validacoes de dominio, persistencia real, loading/error states e testes.

### PBI-013 - CRUD de clientes

Veredicto: UI implementada; criacao/edicao mock; API pendente.

O que existe:

- Tabela de clientes.
- Busca por nome.
- Filtro por status.
- Criar/editar cliente em memoria.
- Visualizar locais do cliente em modal.

Evidencias:

- `frontend/src/pages/catalog/ClientsPage.tsx`
- `frontend/src/mocks/domain.ts`

Nao existe:

- API, persistencia, validacoes de documento/e-mail, inativacao explicita no modal, tratamento de erro.

Para considerar concluido:

- CRUD real com backend, validacoes e criterios da issue.

### PBI-014 - CRUD de locais

Veredicto: UI implementada; criacao/edicao mock; API pendente.

O que existe:

- Listagem.
- Cliente associado.
- Busca por nome.
- Filtro por cliente.
- Contagem de equipamentos por local.
- Modal de criar/editar local.

Evidencias:

- `frontend/src/pages/catalog/SitesPage.tsx`
- `frontend/src/mocks/domain.ts`

Nao existe:

- Filtro por status na tela.
- API/persistencia.
- Validacoes robustas.
- Gestao real do relacionamento com equipamentos.

Para considerar concluido:

- CRUD integrado, regras de relacionamento cliente/local/equipamento e estados de erro/loading.

### PBI-015 - CRUD de equipamentos

Veredicto: UI implementada; criacao/edicao/QR mockados; API pendente.

O que existe:

- Listagem.
- Busca por nome/patrimonio.
- Filtro por local.
- Criar/editar equipamento.
- Status exibido.
- Modal de QR Code mockado.
- Vinculo com local.

Evidencias:

- `frontend/src/pages/equipment/EquipmentPage.tsx`
- `frontend/src/mocks/domain.ts`

Nao existe:

- API/persistencia.
- Geracao/consulta real de QR.
- Filtro por status.
- Validacoes de patrimonio/serie.

Para considerar concluido:

- CRUD real, QR real/contrato backend, validacoes e erro/loading.

### PBI-017 - Pesquisa e filtros

Veredicto: parcial; varios filtros locais; filtros server-side pendentes.

Funcionais localmente:

- Usuarios: busca textual, perfil, status.
- Clientes: busca textual, status.
- Locais: busca textual, cliente.
- Equipamentos: busca textual, local.
- Inspecoes: busca por titulo, estado, tecnico, cliente, prioridade, atrasadas, aguardando revisao, combinacao de filtros, paginacao.
- Nao conformidades: busca, criticidade, status, cliente.
- Auditoria: acao, entidade, usuario.

Visuais/nao funcionais:

- Periodo em Inspecoes nao filtra.
- Periodo em Nao Conformidades nao filtra.
- Periodo em Auditoria nao filtra.
- Nao ha botao "limpar filtros" dedicado.

Evidencias:

- `frontend/src/pages/admin/UsersPage.tsx`
- `frontend/src/pages/catalog/ClientsPage.tsx`
- `frontend/src/pages/catalog/SitesPage.tsx`
- `frontend/src/pages/equipment/EquipmentPage.tsx`
- `frontend/src/pages/inspections/InspectionsPage.tsx`
- `frontend/src/components/tables/DataTable.tsx`

Para considerar concluido:

- Completar filtros de periodo/limpeza, alinhar criterios por tela e integrar paginacao/filtros com API.

### PBI-018 - Modelo em rascunho

Veredicto: UI implementada; edicao mockada; persistencia/API pendente.

O que existe:

- Lista de modelos.
- Abrir construtor.
- Titulo, categoria, descricao.
- Badge fixo "Rascunho".
- Botao salvar com toast.
- Botao publicar com confirmacao simulada.

Evidencias:

- `frontend/src/pages/inspectionTemplates/TemplatesPage.tsx`
- `frontend/src/pages/inspectionTemplates/TemplateBuilderPage.tsx`
- `frontend/src/mocks/domain.ts`

Nao existe:

- Criacao real de novo modelo: "Novo modelo" abre sempre `tpl-compressor/edit`.
- Persistencia apos sair/reload.
- Validacao real antes de publicar.
- Versionamento real.

Para considerar concluido:

- Criar fluxo real de draft, salvar/publicar via API, validacoes e regras de versao.

### PBI-019 - Secoes do checklist

Veredicto: UI/interacao local implementadas; persistencia pendente.

O que existe:

- Exibir secoes.
- Editar titulo da secao inline.
- Adicionar secao.
- Excluir secao.
- Adicionar itens dentro da secao.
- Reorganizar itens.

Evidencias:

- `frontend/src/pages/inspectionTemplates/TemplateBuilderPage.tsx`

Limite:

- Nao ha botoes para reorganizar secoes, apenas itens.
- Tudo fica em estado local.

Para considerar concluido:

- Persistir secoes, validar regras e adicionar reorganizacao de secoes se for criterio.

### PBI-020 - Itens com tipos

Veredicto: tipos suportados na UI; regras reais pendentes.

O que existe:

- Enum com `TEXT_SHORT`, `TEXT_LONG`, `NUMBER`, `BOOLEAN`, `CONFORMITY`, `SINGLE_CHOICE`, `DATE`.
- Modal de item com pergunta, descricao, tipo de resposta.
- Obrigatorio.
- Observacao obrigatoria na falha.
- Evidencia obrigatoria na falha.
- Opcoes para `SINGLE_CHOICE`.
- Editar, excluir e reorganizar itens.

Evidencias:

- `frontend/src/types/domain.ts`
- `frontend/src/pages/inspectionTemplates/TemplateBuilderPage.tsx`
- `frontend/src/mocks/domain.ts`

Nao existe:

- Validacao real das opcoes.
- Regras condicionais executadas contra respostas reais.
- Persistencia/API.

Para considerar concluido:

- Integrar contrato do modelo, validar payloads e cobrir regras por tipo.

### PBI-022 - Previa do checklist

Veredicto: rota e tela existem; previa baseada so em mock/source inicial.

O que existe:

- Rota `/app/inspection-templates/:id/preview`.
- Render mobile-like.
- Exibe secoes, itens, obrigatoriedade, conformidade e flags de observacao/evidencia.
- Usa `id` da URL para buscar em `templates`.

Evidencias:

- `frontend/src/routes/AppRoutes.tsx`
- `frontend/src/pages/inspectionTemplates/TemplatePreviewPage.tsx`

Limite importante:

- A previa nao deriva do estado editado no construtor. Se o usuario altera titulo/secoes e clica "Previa", a rota recarrega do mock `templates`, nao do draft editado.
- Tipos nao conformidade aparecem genericamente como `Resposta: TYPE`, nao como controle real por tipo.

Para considerar concluido:

- Compartilhar draft atual ou persistir antes da previa; renderizar fielmente todos os tipos.

### PBI-026 - Selecao encadeada cliente -> local -> equipamento

Veredicto: funcional com mocks; API/persistencia pendente.

O que existe:

- Cliente selecionado filtra locais.
- Mudar cliente limpa `siteId` e `equipmentId`.
- Local selecionado filtra equipamentos.
- Mudar local limpa `equipmentId`.
- Selects ficam desabilitados enquanto a selecao anterior nao existe.

Evidencias:

- `frontend/src/pages/inspections/NewInspectionPage.tsx`
- `frontend/src/mocks/domain.ts`

Nao existe:

- Busca de clientes/locais/equipamentos via API.
- Persistencia do agendamento criado.
- Validacao de obrigatoriedade antes de agendar.

Para considerar concluido:

- Integrar dados reais, validar payload e salvar inspecao no backend.

### PBI-029 - Cancelar inspecao

Veredicto: nao implementado.

O que existe:

- `CANCELED` no enum.
- Label/badge "Cancelada".
- Botoes genericos "Cancelar" em modais/forms, mas nao acao de cancelar inspecao.

Evidencias:

- `frontend/src/types/domain.ts`
- `frontend/src/components/badges/Badge.tsx`
- `frontend/src/pages/inspections/InspectionsPage.tsx`
- `frontend/src/pages/inspections/InspectionReviewPage.tsx`

Nao existe:

- Botao "Cancelar inspecao".
- Modal especifico de confirmacao.
- Mudanca local para `CANCELED`.
- Acao na tabela ou detalhe.
- Endpoint/API.

Para considerar concluido:

- Implementar acao de cancelamento conforme regra do produto, confirmacao, status, erro/loading e integracao backend.

### PBI-030 - Acompanhar inspecoes com filtros

Veredicto: UI implementada; filtros locais parciais; API pendente.

O que existe:

- Listagem de inspecoes.
- Busca textual por titulo.
- Estado.
- Tecnico.
- Cliente.
- Prioridade.
- Atrasadas.
- Aguardando revisao.
- Progresso.
- Badges de status/prioridade.
- Paginacao local com `pageSize={4}`.
- Navegacao para revisao.
- Botao "Nova inspecao".

Evidencias:

- `frontend/src/pages/inspections/InspectionsPage.tsx`
- `frontend/src/components/tables/DataTable.tsx`
- `frontend/src/mocks/domain.ts`

Limites:

- Placeholder diz "Inspecao, cliente ou equipamento", mas a busca filtra so `item.title`.
- Campo periodo existe visualmente, mas nao participa do filtro.
- Criacao de inspecao navega de volta apos toast, mas nao adiciona registro a lista.

Para considerar concluido:

- Corrigir busca para cliente/equipamento, implementar periodo, integrar listagem/filtros/paginacao com backend.

## D. O que ja esta pronto para demonstracao

- Login visual com validacao local.
- Dashboard administrativo mockado.
- Cadastros de usuarios, clientes, locais e equipamentos com modais e filtros locais.
- QR Code mockado de equipamento.
- Lista de modelos.
- Construtor de checklist com secoes, itens, tipos e publicacao simulada.
- Previa visual do checklist.
- Agendamento com selects encadeados funcionais.
- Lista de inspecoes com filtros locais e paginacao.
- Revisao de inspecao com aprovar/reprovar simulados e evidencia visual.
- Nao conformidades e auditoria mockadas.

## E. O que ainda e apenas mock

- Todos os dados de dominio vem de `frontend/src/mocks/domain.ts`.
- Login, sessao, usuarios, clientes, locais, equipamentos, modelos, inspecoes, revisao, nao conformidades, auditoria e dashboard.
- Salvar/publicar/agendar/aprovar/reprovar apenas exibem toast ou alteram estado local.

## F. O que realmente nao existe

Nao inclui integracao/API nesta secao.

- Cancelar inspecao pela interface.
- Auth guard real.
- Sessao/token/refresh/logout real.
- Testes frontend.
- Workflow CI em `.github`.
- Previa refletindo alteracoes nao salvas do construtor.
- Filtro de periodo funcional nas telas onde aparece.

## G. Integracoes pendentes

- Autenticacao e sessao.
- Usuarios.
- Clientes.
- Locais.
- Equipamentos e QR.
- Modelos de inspecao.
- Secoes e itens.
- Publicacao/versionamento de modelos.
- Agendamento/criacao de inspecoes.
- Listagem/filtros/paginacao server-side.
- Cancelamento de inspecao.
- Revisao/aprovacao/reprovacao.
- Nao conformidades.
- Auditoria.
- Dashboard/indicadores.

## H. Prioridade recomendada

### Bloqueantes

- Criar camada de API/services e configurar `VITE_API_URL`.
- Implementar autenticacao real, token, refresh/logout e guards.
- Integrar CRUDs principais e inspecoes com backend.
- Implementar estados loading/error/empty reais.

### Importante

- Corrigir PBI-003: alinhar Vite vs Next.js com o criterio oficial.
- Completar PBI-029.
- Fazer filtros de periodo e busca por cliente/equipamento em inspecoes.
- Persistir draft do construtor e fazer previa derivar do draft real.
- Adicionar validacoes de formularios.

### Polimento

- Botao limpar filtros.
- Feedbacks de erro por campo/API.
- Testes unitarios/integrados.
- CI com lint/build/test.
- Refinar textos ainda marcados como "prototipo".
