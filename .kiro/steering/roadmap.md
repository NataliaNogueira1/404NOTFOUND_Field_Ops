---
inclusion: manual
---

# FieldOps — Roadmap e Backlog

## Organização: 8 sprints de 2 semanas (16 semanas efetivas)

## Épicos

| ID | Épico | Resultado |
|---|---|---|
| EP-01 | Fundação técnica | Projetos executáveis e integráveis |
| EP-02 | Identidade e acesso | Usuários autenticados e autorizados |
| EP-03 | Cadastros operacionais | Clientes, locais e equipamentos |
| EP-04 | Modelos de inspeção | Checklists configuráveis e versionados |
| EP-05 | Planejamento | Inspeções agendadas e atribuídas |
| EP-06 | Execução de campo | Técnico executa checklist pelo mobile |
| EP-07 | Recursos nativos e evidências | QR Code, câmera e localização |
| EP-08 | Offline e sincronização | Operação sem rede e envio confiável |
| EP-09 | Revisão e decisão | Supervisor revisa, aprova ou reprova |
| EP-10 | Qualidade e entrega | Testes, documentação, builds e demo |

## Roadmap por Sprint

| Sprint | Semanas | Entrega Mobile | Entrega Admin | Entrega Backend | Marco |
|---|---|---|---|---|---|
| 1 | 1-2 | Projeto base, rotas, design system, mocks | Projeto Angular, layout, rotas | API base, PostgreSQL, migrações, OpenAPI | M1: Apps executáveis |
| 2 | 3-4 | Login real, sessão, logout | Login, usuários, cadastros | JWT, autorização, CRUD | M2: Auth integrada |
| 3 | 5-6 | Lista de inspeções (mock→real) | Construtor de modelos, agendamento | Modelos versionados, snapshot, inspeções | M3: Supervisor cria e atribui |
| 4 | 7-8 | Checklist dinâmico, respostas, progresso | Acompanhamento | Respostas, transições, validações | M4: Execução online |
| 5 | 9-10 | Evidências, QR Code, GPS, NC | Visualização evidências/NC | Upload, QR, localização, NC | M5: Recursos nativos |
| 6 | 11-12 | SQLite, offline, outbox, sync | Visualização estado recebido | Push/pull, idempotência, cursor | M6: Offline + sync |
| 7 | 13-14 | Testes, robustez, correção | Revisão, aprovação, reprovação | Revisão, auditoria, testes | M7: Ciclo completo |
| 8 | 15-16 | Build Android, docs, ajustes | Build web | Contêiner, demo, OpenAPI final | M8: Release |

## Marcos Obrigatórios

| Marco | Final semana | Evidência |
|---|---|---|
| M1 — Fundação | 2 | Aplicações base e navegação simulada |
| M2 — Autenticação | 4 | Login integrado nos dois frontends |
| M3 — Planejamento | 6 | Modelo e inspeção criados pela web |
| M4 — Execução online | 8 | Checklist dinâmico enviado à API |
| M5 — Recursos nativos | 10 | Foto, QR Code e localização |
| M6 — Offline | 12 | Inspeção concluída sem rede e sincronizada |
| M7 — Revisão | 14 | Aprovação ou reprovação com histórico |
| M8 — Release | 16 | Build, painel e API demonstrados |

## Gestão de Risco (Ordem de redução de escopo)

1. Remover dashboard avançado
2. Limitar tipos de resposta aos essenciais
3. Apenas foto capturada (sem galeria)
4. Simplificar construtor de modelos (sem drag & drop)
5. Conflito = detecção e bloqueio apenas
6. Adiar notificações, PDF e assinatura
7. **MANTER OBRIGATORIAMENTE:** autenticação, planejamento, checklist, foto, offline, sincronização e revisão

## Backlog MVP (72 itens PBI-001 a PBI-072)

### Sprint 1 — Fundação (PBI-001 a PBI-006)
- Repositórios e convenções
- Projeto Expo com TypeScript e rotas
- Projeto Angular com layout modular
- API Spring Boot + PostgreSQL + migrações
- Lint e verificação de tipos
- Contrato OpenAPI inicial

### Sprint 2 — Auth + Cadastros (PBI-007 a PBI-017)
- Autenticação e-mail/senha na API
- Login mobile e web
- Renovação de sessão
- Gerenciamento de usuários
- Autorização por perfil
- CRUD clientes, locais, equipamentos
- QR Code único, pesquisa e paginação

### Sprint 3 — Modelos + Planejamento (PBI-018 a PBI-030)
- Modelo em rascunho
- Seções e itens com tipos de resposta
- Obrigatoriedade e regras de evidência
- Prévia e publicação de versão
- Snapshot
- Agendamento e atribuição
- Seleção encadeada (cliente → local → equip)
- Cancelamento e acompanhamento

### Sprint 4 — Execução Online (PBI-031 a PBI-040)
- Download e lista de inspeções
- Filtros por estado/data/prioridade
- Detalhes e início
- Checklist dinâmico
- Respostas por tipo
- Salvamento local
- Progresso e observações
- Conclusão com validação

### Sprint 5 — Recursos Nativos (PBI-041 a PBI-047)
- QR Code para confirmar equipamento
- Captura de fotografia + prévia
- Associação foto → item
- Foto pendente quando upload falha
- Localização no início e conclusão
- Não conformidade com criticidade
- Visualização admin de evidências e NC

### Sprint 6 — Offline + Sync (PBI-048 a PBI-055)
- Acesso offline a inspeções baixadas
- Respostas persistem após fechar app
- Outbox persistente
- Envio em lote com dependências
- Idempotência (sem duplicidade)
- Pull com cursor
- Tela de sincronização
- Detecção de conflito

### Sprint 7 — Revisão + Qualidade (PBI-056 a PBI-065)
- Lista de inspeções aguardando revisão
- Revisão por seção e item
- Fotografias vinculadas
- Início formal da revisão
- Aprovação e reprovação com motivo
- Inspeção reprovada chega ao técnico
- Auditoria de mudanças de estado
- Mensagens de carregamento/vazio/erro
- Testes automatizados

### Sprint 8 — Release (PBI-066 a PBI-072)
- Dados de demonstração
- READMEs completos
- Build Android
- Build/publicação web
- API em contêiner
- OpenAPI + diagramas
- Demonstração ponta a ponta
