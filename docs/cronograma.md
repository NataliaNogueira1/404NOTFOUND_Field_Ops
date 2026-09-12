# Cronograma do Projeto — FieldOps

## Sprint 1

> Período: 14/09/2026 → 18/09/2026

### Equipe Completa

| PBI | Título |
|-----|--------|
| TAP | Termo de Abertura de Projeto |

### Backend (Lucas e Marcela)

| PBI | Título |
|-----|--------|
| PBI-001 | Repositórios e convenções definidos |
| PBI-004 | API Spring Boot conectada ao PostgreSQL com migrações |
| PBI-006 | Contrato inicial OpenAPI e dados simulados para frontends |
| PBI-007 | Autenticação por e-mail e senha na API |
| PBI-010 | Renovação automática de sessão (refresh token) |
| PBI-012 | Autorização por perfil na API |
| PBI-011 | CRUD de usuários pelo administrador |
| PBI-013 | CRUD de clientes |
| PBI-014 | CRUD de locais vinculados a clientes |
| PBI-015 | CRUD de equipamentos com QR Code único |
| PBI-016 | QR Code único por equipamento |
| PBI-017 | Pesquisa, filtros e paginação nos cadastros |
| PBI-018 | Criar modelo de inspeção em rascunho |
| PBI-019 | Criar e ordenar seções do checklist |
| PBI-020 | Criar itens com tipos de resposta |
| PBI-021 | Definir obrigatoriedade e regras de evidência |
| PBI-022 | Validação e prévia do checklist antes de publicar |
| PBI-023 | Publicar versão imutável do modelo |
| PBI-024 | Snapshot dos itens ao criar inspeção |
| PBI-025 | Agendar inspeção a partir de modelo publicado |
| PBI-027 | Atribuir inspeção a técnico ativo |
| PBI-028 | Definir prioridade, prazo e instruções na inspeção |
| PBI-029 | Cancelar inspeção com justificativa |

### Frontend Web (Andressa, Ian, Júlia e Carol)

| PBI | Título |
|-----|--------|
| PBI-001 | Repositórios e convenções definidos (participação) |
| PBI-003 | Projeto Next.js com layout, rotas protegidas e estrutura modular |
| PBI-005 | Lint, verificação de tipos e fluxo de PR |
| PBI-009 | Login e sessão na interface web |
| PBI-011 | CRUD de usuários pelo administrador (telas) |
| PBI-013 | CRUD de clientes (telas) |
| PBI-014 | CRUD de locais vinculados a clientes (telas) |
| PBI-015 | CRUD de equipamentos com QR Code único (telas) |
| PBI-017 | Pesquisa, filtros e paginação nos cadastros (telas) |
| PBI-018 | Criar modelo de inspeção em rascunho (telas) |
| PBI-019 | Criar e ordenar seções do checklist (telas) |
| PBI-020 | Criar itens com tipos de resposta (telas) |
| PBI-022 | Visualizar prévia do checklist antes de publicar |
| PBI-026 | Seleção encadeada cliente → local → equipamento |
| PBI-029 | Cancelar inspeção com justificativa (tela) |
| PBI-030 | Acompanhar inspeções em listagem com filtros |

### Mobile (Rodrigo, Natália e Cutiur)

| PBI | Título |
|-----|--------|
| PBI-001 | Repositórios e convenções definidos (participação) |
| PBI-002 | Projeto Expo com TypeScript e estrutura por features |
| PBI-008 | Login e sessão no aplicativo mobile |
| PBI-031 | Download e visualização das inspeções atribuídas |
| PBI-032 | Filtrar inspeções por estado, data e prioridade |
| PBI-033 | Detalhes da inspeção no mobile |
| PBI-034 | Iniciar inspeção com registro de horário |
| PBI-035 | Checklist dinâmico a partir do snapshot |
| PBI-036 | Componentes de resposta para cada tipo de item |
| PBI-037 | Salvar cada resposta localmente (SQLite) |
| PBI-038 | Visualizar progresso e itens pendentes |
| PBI-039 | Registrar observações em itens |
| PBI-048 | Acesso offline a inspeções baixadas |

---

## Sprint 2

> Período: 19/09/2026 → 19/09/2026  

### Backend (Lucas e Marcela)

| PBI | Título |
|-----|--------|
| PBI-051 | Envio em lote respeitando dependências |
| PBI-052 | Idempotência — impedir duplicidade no reenvio |
| PBI-060 | Aprovar inspeção |
| PBI-061 | Reprovar inspeção com motivo obrigatório |
| PBI-063 | Auditoria de mudanças de estado |
| PBI-066 | Dados de demonstração reproduzíveis (seed) |
| PBI-070 | API em contêiner Docker para demonstração |
| PBI-071 | OpenAPI completo e diagramas |
| PBI-073 | *P1:* Dashboard com indicadores por estado e criticidade (API) |
| PBI-075 | *P1:* Notificações push — integração servidor |
| PBI-077 | *P1:* Relatório PDF básico |
| PBI-078 | *P1:* Histórico detalhado de respostas |
| PBI-079 | *P1:* Comentários de revisão por item |
| PBI-082 | *P1:* Exportação CSV |

### Frontend Web (Andressa, Ian, Júlia e Carol)

| PBI | Título |
|-----|--------|
| PBI-047 | Visualizar evidências e NCs no admin |
| PBI-056 | Lista de inspeções aguardando revisão |
| PBI-057 | Revisão de respostas por seção e item |
| PBI-058 | Lightbox de fotografias na revisão |
| PBI-059 | Iniciar revisão formalmente |
| PBI-064 | Estados de carregamento, vazio, erro e offline |
| PBI-069 | Build e publicação do painel web admin |
| PBI-073 | *P1:* Dashboard com indicadores (telas) |
| PBI-077 | *P1:* Relatório PDF básico (visualização/download) |
| PBI-078 | *P1:* Histórico detalhado de respostas (telas) |
| PBI-079 | *P1:* Comentários de revisão por item (telas) |
| PBI-081 | *P1:* Tema escuro |
| PBI-082 | *P1:* Exportação CSV (botão e download) |

### Mobile (Rodrigo, Natália e Cutiur)

| PBI | Título |
|-----|--------|
| PBI-040 | Conclusão com validação de obrigatórios |
| PBI-041 | Leitura de QR Code para confirmar equipamento |
| PBI-042 | Capturar fotografia e visualizar prévia |
| PBI-043 | Associar fotografia ao item correto |
| PBI-044 | Foto pendente quando upload falha |
| PBI-045 | Registrar localização no início e conclusão |
| PBI-046 | Registrar não conformidade com criticidade |
| PBI-049 | Respostas persistem após fechar o aplicativo |
| PBI-050 | Registrar alterações na outbox persistente |
| PBI-053 | Pull de alterações com cursor de sincronização |
| PBI-054 | Tela de status de sincronização |
| PBI-055 | Detecção de conflito de versão |
| PBI-062 | Técnico recebe inspeção reprovada para correção |
| PBI-065 | Testes automatizados dos fluxos críticos |
| PBI-067 | READMEs com instruções de execução |
| PBI-068 | Build Android (APK) para demonstração |
| PBI-072 | Demonstração ponta a ponta |
| PBI-074 | *P1:* Notificações locais de prazo |
| PBI-075 | *P1:* Notificações push de nova atribuição |
| PBI-076 | *P1:* Assinatura desenhada no dispositivo |
| PBI-080 | *P1:* Biometria para reabertura de sessão local |
| PBI-081 | *P1:* Tema escuro (mobile) |

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
