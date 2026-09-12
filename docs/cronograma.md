# Cronograma do Projeto — FieldOps

> Documento de **controle de execução**. Cada PBI possui uma caixa de status para
> acompanhar o que já foi concluído. Marque `[x]` quando o item for finalizado.
>
> Fonte da verdade do status: **quadro Kanban do projeto** (`kanban-fieldops`).
> Última sincronização com o quadro: **11/09/2026**.

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
| [ ] | PBI-014 | CRUD de locais vinculados a clientes | 🔄 Em andamento |
| [x] | PBI-015 | CRUD de equipamentos com QR Code único | ✅ Concluído |
| [x] | PBI-016 | QR Code único por equipamento | ✅ Concluído |
| [x] | PBI-017 | Pesquisa, filtros e paginação nos cadastros | ✅ Concluído |
| [x] | PBI-018 | Criar modelo de inspeção em rascunho | ✅ Concluído |
| [x] | PBI-019 | Criar e ordenar seções do checklist | ✅ Concluído |
| [x] | PBI-020 | Criar itens com tipos de resposta | ✅ Concluído |
| [x] | PBI-021 | Definir obrigatoriedade e regras de evidência | ✅ Concluído |
| [x] | PBI-022 | Validação e prévia do checklist antes de publicar | ✅ Concluído |
| [x] | PBI-023 | Publicar versão imutável do modelo | ✅ Concluído |
| [x] | PBI-024 | Snapshot dos itens ao criar inspeção | ✅ Concluído |
| [ ] | PBI-025 | Agendar inspeção a partir de modelo publicado | 🔄 Em andamento |
| [ ] | PBI-027 | Atribuir inspeção a técnico ativo | 🔄 Em andamento |
| [ ] | PBI-028 | Definir prioridade, prazo e instruções na inspeção | 📋 Pronto p/ iniciar |
| [ ] | PBI-029 | Cancelar inspeção com justificativa | 🔄 Em andamento |

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

> Contagem por status conforme o quadro Kanban (11/09/2026). Itens repetidos entre
> equipes (ex.: PBI-011, PBI-013, PBI-014) compartilham o mesmo card de status.

| Frente | Total | Concluído | Em revisão | Em andamento | Pronto | Backlog |
|--------|-------|-----------|------------|--------------|--------|---------|
| Backend | 23 | 18 | 0 | 4 | 1 | 0 |
| Frontend Web | 16 | 12 | 0 | 3 | 1 | 0 |
| Mobile | 13 | 5 | 2 | 1 | 4 | 1 |

---

## Comparação e checagem (cronograma × análise × quadro)

> Esta seção registra as divergências encontradas ao cruzar três fontes:
> **(A)** este cronograma, **(B)** `analise-sprint1-back-web.md` e **(C)** o quadro Kanban do projeto.

### Divergências de status

| PBI | Cronograma (antes) | Análise (`analise-sprint1`) | Quadro Kanban | Ação tomada aqui |
|-----|--------------------|-----------------------------|---------------|------------------|
| PBI-014 | sem status | ✅ Concluído | 🔄 In progress | Marcado **Em andamento** (segue o quadro) |
| PBI-019 | sem status | ❌ Aberta (backend) | ✅ Done | Marcado **Concluído** (segue o quadro) |
| PBI-020 | sem status | ❌ Aberta (backend) | ✅ Done | Marcado **Concluído** |
| PBI-021 | sem status | ❌ Aberta (backend) | ✅ Done | Marcado **Concluído** |
| PBI-022 | sem status | ❌ Aberta (backend) | ✅ Done | Marcado **Concluído** |
| PBI-023 | sem status | ❌ Aberta (backend) | ✅ Done | Marcado **Concluído** |
| PBI-024 | sem status | ❌ Aberta (backend) | ✅ Done | Marcado **Concluído** |
| PBI-025 | sem status | ❌ Aberta (backend) | 🔄 In progress | Marcado **Em andamento** |
| PBI-027 | sem status | ❌ Aberta (backend) | 🔄 In progress | Marcado **Em andamento** |
| PBI-028 | sem status | ❌ Aberta (backend) | 📋 Ready | Marcado **Pronto** |
| PBI-029 | sem status | ✅ front / ❌ back | 🔄 In progress | Marcado **Em andamento** |
| PBI-030 | sem status | ✅ front | 📋 Ready | Marcado **Pronto** |
| PBI-026 | sem status | ✅ front | 🔄 In progress | Marcado **Em andamento** |

> Observação: o quadro está **mais atualizado** que o documento de análise no bloco de
> Modelos de Inspeção (PBI-019 a PBI-024), que a análise ainda listava como "Aberta".
> O `analise-sprint1-back-web.md` deve ser atualizado para refletir esses itens como concluídos.

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
