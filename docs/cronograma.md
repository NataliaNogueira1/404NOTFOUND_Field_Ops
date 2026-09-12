# Cronograma do Projeto — FieldOps

> Documento de **controle de execução**. Cada PBI possui uma caixa de status para
> acompanhar o que já foi concluído. Marque `[x]` quando o item for finalizado.
>
> Fonte do status:
> - **Backend** — verificado no **código real** do módulo `api/` (controllers, services,
>   entidades e migrações Flyway V1–V14) em **11/09/2026**. Prevalece sobre o quadro Kanban.
> - **Frontend Web / Mobile** — status do **quadro Kanban** (`kanban-fieldops`), ainda não
>   auditado linha a linha no código.

## Legenda de status

| Marca | Status | Significado |
|-------|--------|-------------|
| `[x]` ✅ | Concluído (`Done`) | Item finalizado e validado |
| `[ ]` 👀 | Em revisão (`In review`) | Implementado, aguardando revisão/PR |
| `[ ]` 🔄 | Em andamento (`In progress`) | Desenvolvimento em curso |
| `[ ]` 📋 | Pronto p/ iniciar (`Ready`) | Refinado, ainda não iniciado |
| `[ ]` ⬜ | Backlog | Ainda não iniciado / não refinado |

---

## Sprint 1

> Período: 14/09/2026 → 18/09/2026

### Equipe Completa

| ✔ | PBI | Título | Status |
|---|-----|--------|--------|
| [x] | TAP | Termo de Abertura de Projeto | ✅ Concluído |

### Backend (Lucas e Marcela)

| ✔ | PBI | Título | Status |
|---|-----|--------|--------|
| [x] | PBI-001 | Repositórios e convenções definidos | ✅ Concluído |
| [x] | PBI-004 | API Spring Boot conectada ao PostgreSQL com migrações | ✅ Concluído |
| [x] | PBI-006 | Contrato inicial OpenAPI e dados simulados para frontends | ✅ Concluído |
| [x] | PBI-007 | Autenticação por e-mail e senha na API | ✅ Concluído |
| [x] | PBI-010 | Renovação automática de sessão (refresh token) | ✅ Concluído |
| [x] | PBI-012 | Autorização por perfil na API | ✅ Concluído |
| [x] | PBI-011 | CRUD de usuários pelo administrador | ✅ Concluído |
| [x] | PBI-013 | CRUD de clientes | ✅ Concluído |
| [x] | PBI-014 | CRUD de locais vinculados a clientes | ✅ Concluído — `InspectionSiteController` (CRUD + status), migration V5 |
| [x] | PBI-015 | CRUD de equipamentos com QR Code único | ✅ Concluído |
| [x] | PBI-016 | QR Code único por equipamento | ✅ Concluído |
| [x] | PBI-017 | Pesquisa, filtros e paginação nos cadastros | ✅ Concluído |
| [x] | PBI-018 | Criar modelo de inspeção em rascunho | ✅ Concluído |
| [x] | PBI-019 | Criar e ordenar seções do checklist | ✅ Concluído |
| [x] | PBI-020 | Criar itens com tipos de resposta | ✅ Concluído |
| [x] | PBI-021 | Definir obrigatoriedade e regras de evidência | ✅ Concluído |
| [ ] | PBI-022 | Validação e prévia do checklist antes de publicar | ❌ Não feito — sem endpoint de prévia; validação só no publish |
| [x] | PBI-023 | Publicar versão imutável do modelo | ✅ Concluído |
| [x] | PBI-024 | Snapshot dos itens ao criar inspeção | ✅ Concluído |
| [x] | PBI-025 | Agendar inspeção a partir de modelo publicado | ✅ Concluído — `POST /api/v1/inspections` exige versão publicada |
| [ ] | PBI-027 | Atribuir inspeção a técnico ativo | 🟡 Parcial — valida role TECHNICIAN, mas não valida status ATIVO |
| [x] | PBI-028 | Definir prioridade, prazo e instruções na inspeção | ✅ Concluído — campos em `CreateInspectionRequest`, migration V7 |
| [ ] | PBI-029 | Cancelar inspeção com justificativa | ❌ Não feito — sem endpoint/serviço nem campo de justificativa |

### Frontend Web (Andressa, Ian, Júlia e Carol)

| ✔ | PBI | Título | Status |
|---|-----|--------|--------|
| [x] | PBI-001 | Repositórios e convenções definidos (participação) | ✅ Concluído |
| [x] | PBI-003 | Projeto com layout, rotas protegidas e estrutura modular | ✅ Concluído (React + Vite) |
| [x] | PBI-005 | Lint, verificação de tipos e fluxo de PR | ✅ Concluído |
| [x] | PBI-009 | Login e sessão na interface web | ✅ Concluído |
| [x] | PBI-011 | CRUD de usuários pelo administrador (telas) | ✅ Concluído |
| [x] | PBI-013 | CRUD de clientes (telas) | ✅ Concluído |
| [ ] | PBI-014 | CRUD de locais vinculados a clientes (telas) | 🔄 Em andamento |
| [x] | PBI-015 | CRUD de equipamentos com QR Code único (telas) | ✅ Concluído |
| [x] | PBI-017 | Pesquisa, filtros e paginação nos cadastros (telas) | ✅ Concluído |
| [x] | PBI-018 | Criar modelo de inspeção em rascunho (telas) | ✅ Concluído |
| [x] | PBI-019 | Criar e ordenar seções do checklist (telas) | ✅ Concluído |
| [x] | PBI-020 | Criar itens com tipos de resposta (telas) | ✅ Concluído |
| [x] | PBI-022 | Visualizar prévia do checklist antes de publicar | ✅ Concluído |
| [ ] | PBI-026 | Seleção encadeada cliente → local → equipamento | 🔄 Em andamento |
| [ ] | PBI-029 | Cancelar inspeção com justificativa (tela) | 🔄 Em andamento |
| [ ] | PBI-030 | Acompanhar inspeções em listagem com filtros | 📋 Pronto p/ iniciar |

### Mobile (Rodrigo, Natália e Cutiur)

| ✔ | PBI | Título | Status |
|---|-----|--------|--------|
| [x] | PBI-001 | Repositórios e convenções definidos (participação) | ✅ Concluído |
| [x] | PBI-002 | Projeto Expo com TypeScript e estrutura por features | ✅ Concluído |
| [x] | PBI-008 | Login e sessão no aplicativo mobile | ✅ Concluído |
| [ ] | PBI-031 | Download e visualização das inspeções atribuídas | ⬜ Backlog |
| [ ] | PBI-032 | Filtrar inspeções por estado, data e prioridade | 🔄 Em andamento |
| [ ] | PBI-033 | Detalhes da inspeção no mobile | 👀 Em revisão |
| [ ] | PBI-034 | Iniciar inspeção com registro de horário | 👀 Em revisão |
| [ ] | PBI-035 | Checklist dinâmico a partir do snapshot | 📋 Pronto p/ iniciar |
| [ ] | PBI-036 | Componentes de resposta para cada tipo de item | 📋 Pronto p/ iniciar |
| [x] | PBI-037 | Salvar cada resposta localmente (SQLite) | ✅ Concluído |
| [ ] | PBI-038 | Visualizar progresso e itens pendentes | 📋 Pronto p/ iniciar |
| [ ] | PBI-039 | Registrar observações em itens | 📋 Pronto p/ iniciar |
| [x] | PBI-048 | Acesso offline a inspeções baixadas | ✅ Concluído |

---

## Sprint 2

> Período: 19/09/2026 → 19/09/2026

### Backend (Lucas e Marcela)

| ✔ | PBI | Título | Status |
|---|-----|--------|--------|
| [ ] | PBI-051 | Envio em lote respeitando dependências | ⬜ Backlog |
| [ ] | PBI-052 | Idempotência — impedir duplicidade no reenvio | ⬜ Backlog |
| [ ] | PBI-060 | Aprovar inspeção | ⬜ Backlog |
| [ ] | PBI-061 | Reprovar inspeção com motivo obrigatório | ⬜ Backlog |
| [ ] | PBI-063 | Auditoria de mudanças de estado | ⬜ Backlog |
| [ ] | PBI-066 | Dados de demonstração reproduzíveis (seed) | ⬜ Backlog |
| [ ] | PBI-070 | API em contêiner Docker para demonstração | ⬜ Backlog |
| [ ] | PBI-071 | OpenAPI completo e diagramas | ⬜ Backlog |
| [ ] | PBI-073 | *P1:* Dashboard com indicadores por estado e criticidade (API) | ⚠️ Sem card no quadro |
| [ ] | PBI-075 | *P1:* Notificações push — integração servidor | ⚠️ Sem card no quadro |
| [ ] | PBI-077 | *P1:* Relatório PDF básico | ⚠️ Sem card no quadro |
| [ ] | PBI-078 | *P1:* Histórico detalhado de respostas | ⚠️ Sem card no quadro |
| [ ] | PBI-079 | *P1:* Comentários de revisão por item | ⚠️ Sem card no quadro |
| [ ] | PBI-082 | *P1:* Exportação CSV | ⚠️ Sem card no quadro |

### Frontend Web (Andressa, Ian, Júlia e Carol)

| ✔ | PBI | Título | Status |
|---|-----|--------|--------|
| [ ] | PBI-047 | Visualizar evidências e NCs no admin | ⬜ Backlog |
| [ ] | PBI-056 | Lista de inspeções aguardando revisão | ⬜ Backlog |
| [ ] | PBI-057 | Revisão de respostas por seção e item | ⬜ Backlog |
| [ ] | PBI-058 | Lightbox de fotografias na revisão | ⬜ Backlog |
| [ ] | PBI-059 | Iniciar revisão formalmente | ⬜ Backlog |
| [ ] | PBI-064 | Estados de carregamento, vazio, erro e offline | ⬜ Backlog |
| [ ] | PBI-069 | Build e publicação do painel web admin | ⬜ Backlog |
| [ ] | PBI-073 | *P1:* Dashboard com indicadores (telas) | ⚠️ Sem card no quadro |
| [ ] | PBI-077 | *P1:* Relatório PDF básico (visualização/download) | ⚠️ Sem card no quadro |
| [ ] | PBI-078 | *P1:* Histórico detalhado de respostas (telas) | ⚠️ Sem card no quadro |
| [ ] | PBI-079 | *P1:* Comentários de revisão por item (telas) | ⚠️ Sem card no quadro |
| [ ] | PBI-081 | *P1:* Tema escuro | ⚠️ Sem card no quadro |
| [ ] | PBI-082 | *P1:* Exportação CSV (botão e download) | ⚠️ Sem card no quadro |

### Mobile (Rodrigo, Natália e Cutiur)

| ✔ | PBI | Título | Status |
|---|-----|--------|--------|
| [ ] | PBI-040 | Conclusão com validação de obrigatórios | ⬜ Backlog |
| [ ] | PBI-041 | Leitura de QR Code para confirmar equipamento | ⬜ Backlog |
| [ ] | PBI-042 | Capturar fotografia e visualizar prévia | ✅ Concluído |
| [ ] | PBI-043 | Associar fotografia ao item correto | ⬜ Backlog |
| [ ] | PBI-044 | Foto pendente quando upload falha | ⬜ Backlog |
| [ ] | PBI-045 | Registrar localização no início e conclusão | ⬜ Backlog |
| [ ] | PBI-046 | Registrar não conformidade com criticidade | ⬜ Backlog |
| [x] | PBI-049 | Respostas persistem após fechar o aplicativo | ✅ Concluído |
| [x] | PBI-050 | Registrar alterações na outbox persistente | ✅ Concluído |
| [ ] | PBI-053 | Pull de alterações com cursor de sincronização | ⬜ Backlog |
| [ ] | PBI-054 | Tela de status de sincronização | ⬜ Backlog |
| [ ] | PBI-055 | Detecção de conflito de versão | ⬜ Backlog |
| [ ] | PBI-062 | Técnico recebe inspeção reprovada para correção | ⬜ Backlog |
| [ ] | PBI-065 | Testes automatizados dos fluxos críticos | ⬜ Backlog |
| [ ] | PBI-067 | READMEs com instruções de execução | ⬜ Backlog |
| [ ] | PBI-068 | Build Android (APK) para demonstração | ⬜ Backlog |
| [ ] | PBI-072 | Demonstração ponta a ponta | ⬜ Backlog |
| [ ] | PBI-074 | *P1:* Notificações locais de prazo | ⚠️ Sem card no quadro |
| [ ] | PBI-075 | *P1:* Notificações push de nova atribuição | ⚠️ Sem card no quadro |
| [ ] | PBI-076 | *P1:* Assinatura desenhada no dispositivo | ⚠️ Sem card no quadro |
| [ ] | PBI-080 | *P1:* Biometria para reabertura de sessão local | ⚠️ Sem card no quadro |
| [ ] | PBI-081 | *P1:* Tema escuro (mobile) | ⚠️ Sem card no quadro |

---

## Resumo de progresso (Sprint 1)

> Backend contado a partir da **auditoria do código** (11/09/2026). Frontend/Mobile
> a partir do quadro Kanban. Itens repetidos entre equipes (ex.: PBI-011, PBI-013)
> compartilham o mesmo PBI.

**Backend (verificado no código):**

| Total | ✅ Concluído | 🟡 Parcial | ❌ Não feito |
|-------|-------------|-----------|-------------|
| 23 | 20 | 1 (PBI-027) | 2 (PBI-022, PBI-029) |

> Concluídos: PBI-001, 004, 006, 007, 010, 011, 012, 013, 014, 015, 016, 017, 018, 019, 020,
> 021, 023, 024, 025, 028. Parcial: PBI-027 (falta validar técnico ATIVO). Não feito no
> backend: PBI-022 (prévia) e PBI-029 (cancelamento com justificativa).

**Frontend Web / Mobile (status do quadro, ainda não auditado no código):**

| Frente | Total | Concluído | Em revisão | Em andamento | Pronto | Backlog |
|--------|-------|-----------|------------|--------------|--------|---------|
| Frontend Web | 16 | 12 | 0 | 3 | 1 | 0 |
| Mobile | 13 | 5 | 2 | 1 | 4 | 1 |

---

## Comparação e checagem (código × cronograma × análise × quadro)

> Esta seção registra as divergências encontradas ao cruzar quatro fontes:
> **(A)** o **código real** do backend (`api/`), **(B)** este cronograma,
> **(C)** `analise-sprint1-back-web.md` e **(D)** o quadro Kanban do projeto.
>
> **Regra adotada: para o backend, o código é a fonte da verdade.** Onde o quadro e o
> código divergem, o cronograma segue o código.

### Backend — status real no código vs. quadro Kanban

| PBI | Quadro Kanban | Código (`api/`) | Evidência no código |
|-----|---------------|-----------------|---------------------|
| PBI-014 | 🔄 In progress | ✅ **Concluído** | `InspectionSiteController` (CRUD + status) + migration V5 |
| PBI-019 | ✅ Done | ✅ Concluído | `TemplateSectionService` (criar/ordenar) + migration V10 |
| PBI-020 | ✅ Done | ✅ Concluído | `TemplateItemService` + enum `ResponseType` + migrations V7/V11 |
| PBI-021 | ✅ Done | ✅ Concluído | flags `required`/`evidenceRequiredOnFailure` + migration V12 |
| PBI-022 | ✅ Done | ❌ **Não feito** | não há endpoint de prévia; validação só ocorre no publish |
| PBI-023 | ✅ Done | ✅ Concluído | `InspectionTemplateVersionService.publish` (imutável) + V13 |
| PBI-024 | ✅ Done | ✅ Concluído | `InspectionService.copyChecklist` → `InspectionItemSnapshot` + V14 |
| PBI-025 | 🔄 In progress | ✅ **Concluído** | `POST /api/v1/inspections` exige `templateVersionId` publicado |
| PBI-027 | 🔄 In progress | 🟡 **Parcial** | valida role TECHNICIAN, **não** valida status ATIVO do técnico |
| PBI-028 | 📋 Ready | ✅ **Concluído** | `CreateInspectionRequest` (priority/dueDate/instructions) + V7 |
| PBI-029 | 🔄 In progress | ❌ **Não feito** | sem endpoint/serviço de cancelamento nem campo de justificativa |

> Conclusões da auditoria de código:
> - O **quadro subestima** o backend em PBI-014, PBI-025 e PBI-028 (marcados como não
>   concluídos no quadro, mas já implementados no código).
> - O **quadro superestima** o backend em PBI-022 e PBI-029 (aparecem adiantados, mas
>   não existem no código).
> - PBI-027 está **parcial**: falta apenas validar que o técnico atribuído está ATIVO.

### Divergência com o documento de análise

O `analise-sprint1-back-web.md` lista PBI-019 a PBI-024 como "❌ Aberta" no backend, porém
o código mostra PBI-019, 020, 021, 023 e 024 **implementados** (só PBI-022 realmente falta).
Esse documento precisa ser atualizado para refletir o código.

### Divergências de escopo/numeração

- **PBI-003 (Web):** a issue original cita **Next.js**; a implementação real (e o card do
  quadro) usa **React + Vite**. No quadro o item está **Done** com o título já ajustado
  para React + Vite. Divergência de stack ainda a validar formalmente com o time/professor.
- **PBI-016:** aparece no cronograma como item separado do Backend e no quadro existe um
  card próprio **Done** (`PBI-016: QR Code único por equipamento`), além de estar embutido
  no texto do PBI-015. Mantido como item concluído.
- **PBI-073 a PBI-082 (itens *P1* da Sprint 2):** o cronograma referencia esses números
  como funcionalidades P1 (dashboard, push, PDF, CSV, tema escuro, biometria, etc.),
  **porém não existem cards com esses números no quadro** para essas funcionalidades.
  No quadro, os números **PBI-073 a PBI-076** estão sendo usados para outras tarefas já
  concluídas (protótipos e estruturas base). Marcados aqui com ⚠️ **"Sem card no quadro"** —
  é preciso criar/renumerar esses cards antes de rastrear o P1.

### Itens do cronograma sem card correspondente no quadro (a criar)

Backend S2: PBI-077, PBI-078, PBI-079, PBI-082 (P1).
Web S2: PBI-081 (P1).
Mobile S2: PBI-074, PBI-076, PBI-080, PBI-081 (P1).

> Os demais PBIs da Sprint 2 (051, 052, 053, 054, 055, 056–072) **existem no quadro** e
> estão todos em **Backlog**.

---

## Gráfico de Gantt

```mermaid
gantt
    title FieldOps - Cronograma 2 Sprints
    dateFormat  YYYY-MM-DD
    axisFormat  %d/%m

    section Backend S1
    Fundacao + API + Migracoes             :b1, 2026-08-21, 3d
    Contrato OpenAPI inicial               :b2, 2026-08-22, 2d
    Auth + Refresh + Autorizacao           :b3, after b1, 5d
    CRUD Usuarios                          :b4, after b3, 3d
    CRUD Clientes + Locais                 :b5, after b3, 4d
    CRUD Equipamentos + QR                 :b6, after b5, 4d
    Modelo rascunho + secoes + itens       :b7, after b6, 5d
    Previa + Publicacao + Snapshot         :b8, after b7, 4d
    Agendamento + Atribuicao               :b9, after b8, 3d

    section Web S1
    Projeto Next.js + Layout + Rotas       :w1, 2026-08-21, 4d
    Login web                              :w2, after b3, 3d
    Telas Usuarios                         :w3, after w2, 4d
    Telas Clientes + Locais + Filtros      :w4, after w2, 5d
    Telas Equipamentos                     :w5, after w4, 4d
    Construtor de modelos                  :w6, after b7, 5d
    Cancelamento + Acompanhamento          :w7, after w6, 3d

    section Mobile S1
    Projeto Expo + Estrutura               :mo1, 2026-08-21, 3d
    Login mobile                           :mo2, after b3, 3d
    Lista + Filtros + Detalhes             :mo3, after mo2, 5d
    Iniciar inspecao                        :mo4, after mo3, 2d
    Checklist dinamico                     :mo5, after mo4, 6d
    Salvamento local + progresso           :mo6, after mo5, 4d
    Offline basico                         :mo7, after mo3, 5d

    section Backend S2
    Sync em lote + Idempotencia            :b10, 2026-09-12, 5d
    Aprovacao + Reprovacao                 :b11, 2026-09-12, 4d
    Auditoria                              :b12, after b11, 3d
    Seed + Docker + OpenAPI                :b13, 2026-09-26, 5d
    P1 - Dashboard API                     :b14, after b13, 3d
    P1 - Push + PDF + CSV                  :b15, after b14, 4d
    P1 - Historico + Comentarios           :b16, after b14, 3d

    section Web S2
    Revisao - lista + secao + fotos        :w8, after b11, 6d
    Evidencias + NCs no admin              :w9, after w8, 4d
    Estados de interface                   :w10, 2026-09-12, 5d
    Build web admin                        :w11, 2026-09-28, 3d
    P1 - Dashboard telas                   :w12, after w11, 3d
    P1 - Tema escuro + PDF + CSV           :w13, after w12, 3d
    P1 - Historico + Comentarios           :w14, after w12, 3d

    section Mobile S2
    Conclusao + validacao                  :mo8, 2026-09-12, 3d
    QR Code                                :mo9, 2026-09-12, 3d
    Foto - captura + associacao            :mo10, after mo8, 5d
    Localizacao inicio e fim               :mo11, after mo9, 3d
    Nao conformidade                       :mo12, after mo10, 4d
    Outbox + persistencia                  :mo13, 2026-09-12, 5d
    Sync pull + conflitos                  :mo14, after mo13, 5d
    Tela sync + reprovacao                 :mo15, after mo14, 3d
    Testes criticos                        :mo16, 2026-09-22, 5d
    README + Build APK                     :mo17, 2026-09-26, 4d
    Demo ponta a ponta                     :mo18, 2026-09-29, 3d
    P1 - Notificacoes local + push         :mo19, after mo18, 3d
    P1 - Assinatura + Biometria            :mo20, after mo18, 3d
    P1 - Tema escuro mobile                :mo21, after mo19, 2d

    section Marcos
    MVP funcional P0 completo              :milestone, m3, 2026-09-28, 0d
    Entrega final com P1                   :milestone, m4, 2026-10-02, 0d
```
