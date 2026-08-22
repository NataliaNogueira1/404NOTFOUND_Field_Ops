---
inclusion: auto
---

# FieldOps — Contexto do Projeto

## Identidade

- **Nome:** FieldOps — Plataforma de Inspeção em Campo
- **Tipo:** Projeto Integrador acadêmico (4º semestre ADS — SENAI Gaspar Ricardo Júnior)
- **Prazo:** 16 semanas efetivas (8 sprints de 2 semanas)
- **Equipe:** 9 integrantes
- **Gerente do Projeto:** Nathalia Nogueira
- **Repositório monorepo:** `404NOTFOUND_Field_Ops` com pastas `api/`, `mobile/`, `frontend/`

## Objetivo

Desenvolver uma plataforma integrada para configurar, planejar, executar, sincronizar, revisar e auditar inspeções técnicas em campo, com funcionamento offline no aplicativo mobile.

## Componentes e Stack

| Componente | Tecnologias | Pasta |
|---|---|---|
| API REST | Java 21, Spring Boot, JPA, PostgreSQL, JWT, OpenAPI | `api/` |
| Mobile | Expo, React Native, TypeScript, Expo Router, SQLite, TanStack Query | `mobile/` |
| Web Admin | Angular, TypeScript | `frontend/` |
| Banco central | PostgreSQL | via Docker (`api/docker-compose.yml`) |
| Banco local mobile | SQLite (expo-sqlite) | dentro do app |

## Perfis de Usuário

- **ADMIN** — gerencia cadastros e usuários
- **SUPERVISOR** — cria modelos, agenda inspeções, revisa e aprova/reprova
- **TECHNICIAN** — executa inspeções em campo via mobile
- **CLIENT_VIEWER** — somente leitura, fora do MVP

## Fluxo Principal do MVP

1. Admin cadastra clientes, locais, equipamentos e usuários
2. Supervisor cria modelo de inspeção (seções + itens + tipos de resposta)
3. Supervisor publica versão imutável do modelo
4. Supervisor agenda inspeção e atribui a um técnico
5. API cria snapshot dos itens do checklist
6. Técnico sincroniza e recebe inspeção no mobile
7. Técnico executa: QR Code, checklist dinâmico, fotos, localização, não conformidades
8. Técnico conclui offline — dados ficam em SQLite + outbox
9. Ao reconectar, outbox envia em lote com IDs idempotentes
10. Supervisor revisa respostas e evidências na interface web
11. Supervisor aprova ou reprova (motivo obrigatório na reprovação)

## Entidades Principais do Modelo de Dados

- `User`, `Client`, `InspectionSite`, `Equipment`
- `InspectionTemplate` → `InspectionTemplateVersion` → `TemplateSection` → `TemplateItem`
- `Inspection` → `InspectionItemSnapshot` → `InspectionResponse`
- `Evidence`, `NonConformity`, `InspectionReview`, `AuditEvent`
- Local: `SyncOperation`, `SyncMetadata`

## Estados de Negócio da Inspeção

DRAFT → ASSIGNED → IN_PROGRESS → SUBMITTED → UNDER_REVIEW → APPROVED / REJECTED / CANCELED

## Regras Críticas de Negócio

- Versão publicada do modelo é imutável
- Cada inspeção usa um snapshot dos itens (não referência direta ao modelo)
- Sincronização usa operações idempotentes (UUID como chave)
- Reenvio não cria duplicidade
- Dados locais não são descartados silenciosamente
- Inspeção aprovada é protegida contra edição
- API valida autorização em todos os endpoints (a interface não é barreira suficiente)
- Entidades históricas usam inativação lógica, nunca exclusão física

## API — Convenções

- Prefixo: `/api/v1`
- Formato: JSON (upload via multipart)
- IDs: UUID
- Datas: ISO 8601
- Auth: Bearer token (JWT)
- Erros: objeto padronizado com `timestamp`, `status`, `code`, `message`, `path`, `requestId`, `fieldErrors`
- Paginação: `page`, `size`, `sort`

## Estrutura da API Spring Boot

```
com.fieldops
├── auth/
├── user/
├── client/
├── site/
├── equipment/
├── template/
├── inspection/
├── evidence/
├── synchronization/
├── review/
├── audit/
└── shared/ (exception, security, config)
```

Cada feature contém: `controller/`, `service/`, `domain/` (entity), `repository/`, `dto/`, `mapper/`

## Mobile — Estrutura

```
src/
├── app/           # Rotas Expo Router
├── features/      # auth, home, inspections, checklist, evidence, scanner, sync
├── components/    # Componentes compartilhados
├── design-system/ # Tokens, tema
├── infrastructure/
│   ├── api/
│   ├── database/  # SQLite
│   ├── storage/
│   └── sync/      # Outbox
├── hooks/
├── schemas/       # Zod
└── config/
```

## Tipos de Resposta do Checklist (MVP)

TEXT_SHORT, TEXT_LONG, NUMBER, BOOLEAN, CONFORMITY, SINGLE_CHOICE, DATE

## Backlog — Épicos

| ID | Épico | Sprint |
|---|---|---|
| EP-01 | Fundação técnica | 1 |
| EP-02 | Identidade e acesso | 2 |
| EP-03 | Cadastros operacionais | 2 |
| EP-04 | Modelos de inspeção | 3 |
| EP-05 | Planejamento | 3 |
| EP-06 | Execução de campo | 4 |
| EP-07 | Recursos nativos e evidências | 5 |
| EP-08 | Offline e sincronização | 6 |
| EP-09 | Revisão e decisão | 7 |
| EP-10 | Qualidade e entrega | 7-8 |

## Links Úteis

- **Notion (documentação e kanban):** https://glaucotodesco.notion.site/Projeto-FieldOps-3af5d52a81f580c0b92ec261c686abb4
- **Figma:** https://www.figma.com/design/TDZgjSw38R35CxhmAmyt64/Field-Ops

## Convenções de Desenvolvimento

- Branches por feature, merge via pull request
- Lint e verificação de tipos obrigatórios antes do merge
- Commits em português ou inglês (manter consistência)
- Segredos em `.env` (nunca no repositório)
- API documentada via OpenAPI/Swagger
- Mobile validado em Android (prioridade)

## Papel da Natália (usuária deste workspace)

- **Atuação:** Mobile (Expo + React Native)
- **GitHub:** @NataliaNogueira1
- **Gerente do Projeto** — coordena entregas e integração entre frentes

## Orientações para o Assistente

- Respostas preferencialmente em **português brasileiro**
- Ao implementar código na API, seguir a estrutura por feature já existente
- Ao implementar código mobile, seguir a estrutura por features com Expo Router
- Priorizar funcionalidades P0 (MVP) sobre P1/P2
- Consultar a documentação no Notion quando necessário para detalhes de regras de negócio
- Considerar sempre o comportamento offline ao trabalhar no mobile
- Não expor segredos em código ou logs
