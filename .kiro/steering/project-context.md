---
inclusion: auto
---

# FieldOps — Contexto do Projeto

## Visão Geral

**FieldOps** é uma plataforma digital para planejamento, execução, acompanhamento e revisão de inspeções técnicas realizadas em campo. Substitui formulários em papel, planilhas e mensagens informais por um fluxo digital integrado, rastreável e com funcionamento offline.

## Componentes da Solução

| Componente | Stack | Responsabilidade |
|---|---|---|
| App Mobile | Expo + React Native + TypeScript + SQLite | Execução de inspeções pelo técnico, offline-first |
| API REST | Java + Spring Boot + PostgreSQL | Regras de negócio, autenticação, persistência |
| Web Admin | Angular + TypeScript | Gestão, planejamento e revisão |
| Infraestrutura | PostgreSQL + SQLite + Object Storage (S3-compatível) | Dados centrais + locais + evidências |

## Perfis de Usuário

- **ADMIN** — gerencia usuários e cadastros
- **SUPERVISOR** — cria modelos, agenda inspeções, revisa e aprova
- **TECHNICIAN** — executa inspeções em campo (app mobile)
- **CLIENT_VIEWER** — futuro (fora do MVP)

## Fluxo Principal (MVP)

```
Admin cadastra dados → Supervisor cria modelo → Publica versão →
Agenda e atribui inspeção → Técnico sincroniza → Inicia inspeção →
Responde checklist + fotos + QR Code + localização →
Conclui offline → Sincroniza → Supervisor revisa → Aprova/Reprova
```

## Estados da Inspeção

RASCUNHO → ATRIBUÍDA → EM_ANDAMENTO → ENVIADA → EM_REVISÃO → APROVADA / REPROVADA / CANCELADA

## Princípios Técnicos

- **Offline-first:** SQLite é persistência operacional, não apenas cache
- **Sincronização idempotente:** outbox com UUID por operação, dependências, retry
- **Modelos versionados:** alterações geram nova versão, inspeções preservam snapshot
- **Checklist dinâmico:** tipos de resposta mapeados para componentes UI
- **Segurança:** JWT Bearer, autorização validada na API, menor privilégio
- **Auditoria:** alterações críticas registradas com usuário, data e entidade
- **Exclusão lógica:** entidades históricas nunca são excluídas fisicamente

## Convenções da API

- Prefixo: `/api/v1`
- Formato: JSON
- IDs: UUID
- Datas: ISO 8601
- Auth: Bearer token
- Documentação: OpenAPI/Swagger
- Erros: objeto padronizado com timestamp, status, code, message, fieldErrors

## Prazo

- 16 semanas efetivas (8 sprints de 2 semanas)
- Demonstração ponta a ponta obrigatória no final
