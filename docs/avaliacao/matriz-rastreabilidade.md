# Matriz de rastreabilidade — FieldOps

> Objetivo: ligar cada PBI do backlog a **issue**, **PR**, **código efetivamente
> integrado na `develop`**, **teste** e **aceite**, respondendo diretamente à
> solicitação da auditoria do professor (item 2 de "Próximas verificações":
> *"Relacionar cada PBI a issues, PRs, commit integrado na `develop`, testes e aceite"*).
>
> **Como ler esta matriz:**
> - **Na develop?** indica se o código correspondente está **mergeado na branch
>   `develop`** (a branch avaliada). `Sim` = integrado; `Branch` = existe código em
>   branch **não mergeada** (ver seção 3); `Não` = sem código.
> - **Aceite** usa o veredicto verificado no código em
>   [`analise-sprint1-back-web.md`](../analises/sprints/analise-sprint1-back-web.md):
>   ✅ concluído, 🟡 parcial, ❌ não feito.
> - **Evidência de execução** aponta para teste automatizado ou para o registro E2E
>   em [`evidencias-e2e.md`](evidencias-e2e.md). "Pendente" = precisa ser executado e
>   registrado (não significa ausência de código).
>
> Fechamento de issue **não** comprova entrega: a coluna "Na develop?" é a que vale
> para a avaliação do código.

Última atualização: _preencher ao revisar_ · Corte de referência: 20/10/2026.

---

## 1. Como esta matriz foi montada

- **PBI ↔ issue ↔ aceite:** extraídos da [análise de sprint](../analises/sprints/analise-sprint1-back-web.md),
  que verifica o veredicto **no código real** do repositório.
- **Na develop? / Branch:** cruzamento com o estado do Git (branches não mergeadas em
  `develop`) e com o estado das issues (abertas/fechadas).
- **Evidência de execução:** [`test-results.md`](test-results.md) (automatizados) e
  [`evidencias-e2e.md`](evidencias-e2e.md) (execução ponta a ponta — a preencher).

> Observação metodológica importante para o avaliador: itens marcados como **Branch**
> têm **código pronto que ainda não foi mergeado na `develop`**. Uma análise feita
> somente na `develop` não enxerga esse código — por isso ele aparece aqui
> explicitamente, com o nome da branch.

---

## 2. Matriz por PBI (P0 — caminho crítico do MVP)

### 2.1. Backend (Sprint 1)

| PBI | Descrição | Issue | Na develop? | Teste | Aceite |
|---|---|---|---|---|---|
| PBI-001 | Repositórios e convenções | #11 | Sim | — | ✅ |
| PBI-004 | API Spring Boot + PostgreSQL + migrações | #14 | Sim | API | ✅ |
| PBI-006 | Contrato OpenAPI + dados simulados | #16 | Sim | API | ✅ |
| PBI-007 | Autenticação JWT | #17 | Sim | API (auth) | ✅ |
| PBI-010 | Refresh token | #20 | Sim | API | ✅ |
| PBI-012 | Autorização por perfil | #22 | Sim | API (RoleAuthorizationTest) | ✅ |
| PBI-011 | CRUD de usuários | #21 | Sim | API | ✅ |
| PBI-013 | CRUD de clientes | #23 | Sim | API | ✅ |
| PBI-014 | CRUD de locais | #24 | Sim | API | ✅ |
| PBI-015 | CRUD de equipamentos | #25 | Sim | API | ✅ |
| PBI-016 | QR Code único | #34 | Sim | API | ✅ |
| PBI-017 | Pesquisa/filtros/paginação | #26 | Sim | API | ✅ |
| PBI-018 | Modelo em rascunho | #35 | Sim | API | ✅ |
| PBI-019 | Seções do checklist | #36 | Sim | API | ✅ |
| PBI-020 | Itens com tipos de resposta | #37 | Sim | API | ✅ |
| PBI-021 | Obrigatoriedade/evidência | #38 | Sim | API | ✅ |
| PBI-022 | Prévia do checklist | #39 | Sim | API | ✅ |
| PBI-023 | Publicar versão imutável | #40 | Sim | API | ✅ |
| PBI-024 | Snapshot ao criar inspeção | #41 | Sim | API | ✅ |
| PBI-025 | Agendar inspeção | #42 | Sim | API | ✅ |
| PBI-027 | Atribuir a técnico ativo | #44 | Sim | API | ✅ |
| PBI-028 | Prioridade/prazo/instruções | #45 | Sim | API | ✅ |
| PBI-029 | Cancelar inspeção | #46 | Sim | API | ✅ |

### 2.2. Backend (Sprint 2)

| PBI | Descrição | Issue | Na develop? | Teste | Aceite |
|---|---|---|---|---|---|
| PBI-051 | Envio em lote com dependências | #71 | Sim | API (sync) | ✅ |
| PBI-052 | Idempotência no reenvio | #72 | Sim | API (sync) | ✅ |
| PBI-060 | Aprovar inspeção | #81 | Sim | API (review) | ✅ |
| PBI-061 | Reprovar com motivo | #82 | Sim | API (review) | ✅ |
| PBI-063 | Auditoria de estados | #83 | Sim | API (audit) | ✅ |
| PBI-066 | Seed de demonstração | #86 | Sim | API | ✅ |
| PBI-070 | API em contêiner Docker | #90 | Sim | Validado 25/09 | ✅ |
| PBI-071 | OpenAPI + diagramas | #91 | Sim | — | ✅ |

### 2.3. Frontend Web (Sprint 1)

| PBI | Descrição | Issue | Na develop? | Teste | Aceite |
|---|---|---|---|---|---|
| PBI-003 | Projeto React + Vite + layout | #13 | Sim | Web | ✅ |
| PBI-005 | Lint, tipos, PR | #15 | Sim | Web (lint) | ✅ |
| PBI-009 | Login e sessão web | #19 | Sim | Web (session) | ✅ |
| PBI-011 | CRUD usuários (telas) | #21 | Sim | Web | ✅ |
| PBI-013 | CRUD clientes (telas) | #23 | Sim (lista/form) | Web | ✅ (detalhe: ver 2.7) |
| PBI-014 | CRUD locais (telas) | #24 | Sim | Web | ✅ |
| PBI-015 | CRUD equipamentos (telas) | #25 | Sim | Web | ✅ |
| PBI-017 | Pesquisa/filtros (telas) | #26 | Sim | Web | ✅ |
| PBI-018 | Modelo rascunho (telas) | #35 | Sim | Web | ✅ |
| PBI-019 | Seções (telas) | #36 | Sim | Web | ✅ |
| PBI-020 | Itens/tipos (telas) | #37 | Sim | Web | ✅ |
| PBI-022 | Prévia do checklist (tela) | #39 | Sim | Web | ✅ |
| PBI-026 | Seleção encadeada | #93 | Sim | Web | ✅ |
| PBI-029 | Cancelar inspeção (tela) | #46 | Sim | Web | ✅ |
| PBI-030 | Acompanhar inspeções | #47 | Sim | Web | ✅ |

### 2.4. Frontend Web (Sprint 2)

| PBI | Descrição | Issue | Na develop? | Teste | Aceite |
|---|---|---|---|---|---|
| PBI-047 | Evidências e NCs no admin | — | Sim | Web | ✅ |
| PBI-056 | Fila de revisão | — | Sim | Web | ✅ |
| PBI-057 | Revisão por seção/item | — | Sim | Web | ✅ |
| PBI-058 | Lightbox de fotos | — | Sim | Web | ✅ |
| PBI-059 | Iniciar revisão formalmente | #79 (CLOSED) | **Branch** `feat/pbi-059-begin-review` | Pendente | 🟡 UI não aciona a transição na develop |
| PBI-064 | Estados loading/vazio/erro/offline | #84 | Sim (falta offline) | Web | 🟡 |
| PBI-069 | Build e publicação do painel | #89 (CLOSED) | Sim (CI); publicação não | Pendente | 🟡 deploy não validado |

### 2.5. Mobile (Sprint 1)

| PBI | Descrição | Issue | Na develop? | Teste | Aceite |
|---|---|---|---|---|---|
| PBI-002 | Projeto Expo + estrutura | #12 | Sim | — | ✅ |
| PBI-008 | Login e sessão mobile | #18 | Sim | Mobile | ✅ |
| PBI-031 | Download de inspeções | #48 | Sim | Mobile (sync) | ✅ |
| PBI-032 | Filtros | #49 | Sim | Mobile | ✅ |
| PBI-033 | Detalhes da inspeção | #50 | Sim | Mobile | ✅ |
| PBI-034 | Iniciar com horário + GPS início | #51 | Sim | Mobile | ✅ |
| PBI-035 | Checklist dinâmico | #52 | Sim | Mobile | ✅ |
| PBI-036 | Componentes de resposta | #53 | Sim | Mobile (checklist card) | ✅ |
| PBI-037 | Salvar resposta local (SQLite) | #54 | Sim | Mobile (persistência) | ✅ |
| PBI-038 | Progresso/pendentes | #55 | Sim | Mobile | ✅ |
| PBI-039 | Observações em itens | #56 | Sim | Mobile | ✅ |
| PBI-048 | Acesso offline a inspeções | #68 | Sim | Mobile | ✅ |

### 2.6. Mobile (Sprint 2)

| PBI | Descrição | Issue | Na develop? | Teste | Aceite |
|---|---|---|---|---|---|
| PBI-040 | Conclusão com validação | — | Sim | Mobile | ✅ |
| PBI-041 | QR Code real (CameraView) | — | Sim | Mobile | ✅ |
| PBI-042 | Capturar foto + prévia | — | Sim | Pendente (dispositivo) | ✅ código |
| PBI-043 | Associar foto ao item | — | Sim | Pendente (dispositivo) | ✅ código |
| PBI-044 | Foto pendente em falha de upload | — | Sim | Mobile (pbi044) | ✅ |
| PBI-045 | GPS no início **e na conclusão** | #65 (CLOSED) | **Início: Sim / Conclusão: Branch** `feat/pbi-045-end-location` | Pendente | 🟡 conclusão não está na develop |
| PBI-046 | NC com criticidade | — | Sim | Mobile | ✅ |
| PBI-049 | Respostas persistem ao fechar | — | Sim | Mobile (persistência) | ✅ |
| PBI-050 | Outbox persistente | — | Sim | Mobile (sync) | ✅ |
| PBI-053 | Pull incremental com cursor | — | Sim | Mobile (pbi053) | ✅ |
| PBI-054 | Tela de status de sync | — | Sim | Mobile | ✅ |
| PBI-055 | Detecção de conflito | — | Sim | Mobile | ✅ |
| PBI-062 | Técnico recebe reprovação | — | Sim | Mobile (pbi062) | ✅ |
| PBI-065 | Testes automatizados | #85 (CLOSED) | Sim (código) | **BLOCKED** (Jest não reproduzido) | 🟡 execução pendente |
| PBI-067 | READMEs | #87 | Sim | — | ✅ |
| PBI-068 | Build Android (APK) | #88 (CLOSED) | Config EAS sim | **NOT_RUN** (APK não validado) | 🟡 artefato pendente |
| PBI-072 | Demonstração ponta a ponta | #92 (OPEN) | — | Pendente E2E | ❌ |

### 2.7. Itens P1 (diferenciais — não bloqueiam o P0)

| PBI | Descrição | Issue | Na develop? | Aceite |
|---|---|---|---|---|
| PBI-083 | Dashboard (API + telas) | #146 | Sim | ✅ |
| PBI-087 | Relatório PDF | #149 | Sim | ✅ |
| PBI-088 | Histórico de respostas | — | Sim | ✅ |
| PBI-089 | Comentários de revisão | — | Sim | ✅ |
| PBI-091 | Tema escuro (web + mobile) | — | Sim | ✅ |
| PBI-092 | Exportação CSV | — | Verificar (branch `feat/pbi-092-csv-export`) | 🟡 |
| PBI-084 | Notificações locais de prazo | #147 (OPEN) | **Branch** `feat/pbi-084-local-notifications` | ❌ na develop |
| PBI-085 | Notificações push | #155 | Sim | ✅ |
| PBI-086 | Assinatura no dispositivo | #148 (CLOSED) | **Branch** `feat/pbi-086-signature-canvas` | ❌ na develop |
| PBI-090 | Biometria | — | Sim | ✅ |

---

## 3. Código pronto fora da `develop` (branches não mergeadas)

Esta é a seção mais importante para a reavaliação: há **código implementado que não
está na branch avaliada**. Mergear (com revisão) move estes itens de "não visto pela
auditoria" para "entregue".

| Branch | PBI / assunto | Issue | Estado da issue | Impacto |
|---|---|---|---|---|
| `feat/mobile-evidence-upload-sync` | Upload de foto para o backend | #229 | OPEN | **P0** — destrava foto na revisão (Teste 10) |
| `feat/pbi-045-end-location` | GPS na conclusão | #65 | **CLOSED** | **P0** — inconsistência: issue fechada, código fora da develop |
| `fix/204-render-datasource-config` | API pública / datasource | #204 | **CLOSED** | **P0** — inconsistência: issue fechada, código fora da develop |
| `feat/pbi-059-begin-review` | Iniciar revisão formal | #79 | **CLOSED** | Inconsistência: issue fechada, código fora da develop |
| `feat/client-details-api-integration` | Detalhe de cliente com API | #263 | OPEN | Remove mock apontado pela auditoria |
| `feat/web-password-toggle-login` | Toggle de senha (acessibilidade) | #265 | OPEN | Melhoria de UX/acessibilidade |
| `feat/273-view-submitted-approved-inspection` | Ver inspeção enviada/aprovada | #273 | OPEN | Mobile |
| `feat/pbi-084-local-notifications` | Notificações locais (P1) | #147 | OPEN | Diferencial P1 |
| `feat/pbi-086-signature-canvas` | Assinatura (P1) | #148 | **CLOSED** | Diferencial P1 — inconsistência issue/develop |
| `fix/dark-mode-shared-components` | Ajuste de tema (UI) | — | — | Sem issue associada |

### 3.1. Inconsistências "issue fechada × código fora da develop" (prioridade)

Estes casos derrubam credibilidade porque a rubrica diz que *"fechamento administrativo
de issues não equivale a entrega funcional"*. Ação recomendada: reabrir/registrar e
integrar na `develop`.

- **#65 (PBI-045 — GPS conclusão)** — CLOSED, código em `feat/pbi-045-end-location`.
- **#204 (API pública/datasource)** — CLOSED, código em `fix/204-render-datasource-config`.
- **#79 (PBI-059 — iniciar revisão)** — CLOSED, código em `feat/pbi-059-begin-review`.
- **#148 (PBI-086 — assinatura, P1)** — CLOSED, código em `feat/pbi-086-signature-canvas`.

---

## 4. Resumo executivo

| Categoria | Situação |
|---|---|
| Backend (S1 + S2) | 100% na `develop`, com testes automatizados (180 testes PASS). |
| Web (S1) | 100% na `develop` (detalhes de cliente/local com seed — ver #263/#264). |
| Web (S2) | Maioria na `develop`; pendências: iniciar revisão (branch), estado offline, deploy. |
| Mobile (S1) | 100% na `develop`. |
| Mobile (S2) | Maioria na `develop`; pendências de **integração na develop**: GPS conclusão, upload de foto. |
| Blockers do E2E | Upload de foto (#229), GPS conclusão (#65), APK instalado (#88), deploy web (#89), API pública (#204). |
| Evidência de execução | Automatizados: API/Web PASS, Mobile BLOCKED. E2E: pendente de registro — ver [`evidencias-e2e.md`](evidencias-e2e.md). |

---

## 5. Referências

- [Resposta à auditoria da IA](resposta-auditoria-ia.md)
- [Análise de sprint (veredictos por PBI)](../analises/sprints/analise-sprint1-back-web.md)
- [Registro de testes](test-results.md)
- [Roteiro de demonstração E2E](demo-runbook.md)
- [Evidências E2E (a preencher)](evidencias-e2e.md)
- [Limitações conhecidas](known-limitations.md)
- [Cronograma](../gestao/cronograma.md)
