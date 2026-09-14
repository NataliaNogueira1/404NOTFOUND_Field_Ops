---
inclusion: auto
---

# FieldOps — Arquitetura

## Visão Arquitetural

```
┌─────────────────────────────┐
│ Aplicativo Mobile           │
│ Expo + React Native         │
│ SQLite + Secure Store       │
└──────────────┬──────────────┘
               │ HTTPS / JSON / Multipart
               ▼
┌─────────────────────────────┐
│ API REST                    │
│ Java + Spring Boot          │
│ Segurança + Regras          │
└───────┬──────────────┬──────┘
        │              │
        ▼              ▼
┌──────────────┐  ┌──────────────────┐
│ PostgreSQL   │  │ Object Storage   │
│ Dados        │  │ Evidências       │
└──────────────┘  └──────────────────┘
        ▲
        │ HTTPS / JSON
┌───────┴─────────────────────┐
│ Interface Administrativa    │
│ Angular + TypeScript        │
└─────────────────────────────┘
```

## Estrutura do Mobile (Expo + React Native)

```
src/
├── app/                      # Rotas do Expo Router
├── features/
│   ├── auth/
│   ├── home/
│   ├── inspections/
│   ├── checklist/
│   ├── evidence/
│   ├── scanner/
│   ├── location/
│   └── synchronization/
├── components/               # Componentes compartilhados
├── design-system/            # Tokens, tema e componentes visuais
├── application/              # Casos de uso e orquestração
├── domain/                   # Tipos e regras independentes da interface
├── infrastructure/
│   ├── api/
│   ├── database/
│   ├── repositories/
│   ├── storage/
│   └── sync/
├── hooks/
├── schemas/
├── utils/
└── config/
```

## Estrutura do Web Admin (Angular)

```
src/app/
├── core/
│   ├── auth/
│   ├── guards/
│   ├── interceptors/
│   ├── http/
│   └── layout/
├── shared/
│   ├── components/
│   ├── directives/
│   ├── pipes/
│   └── validators/
├── features/
│   ├── dashboard/
│   ├── users/
│   ├── clients/
│   ├── sites/
│   ├── equipment/
│   ├── templates/
│   ├── inspections/
│   ├── reviews/
│   └── non-conformities/
└── app.routes.ts
```

## Estrutura da API (Spring Boot)

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
└── shared/
```

Cada feature contém: controller/, application/, domain/, repository/, dto/, mapper/, validation/

## Persistência

- **PostgreSQL:** fonte oficial dos dados sincronizados
- **SQLite:** persistência operacional offline no dispositivo
- **Object Storage:** arquivos de evidências (fotos)
- Migrações versionadas no banco
- Controle otimista com campo `version`
- Exclusão lógica para entidades históricas

## Segurança

- HTTPS obrigatório em ambientes publicados
- Senhas com hash seguro (bcrypt)
- JWT com duração limitada + refresh token
- Tokens no mobile em Secure Store
- CORS configurado para origens autorizadas
- Logs sem senhas, tokens ou stack traces
- Segredos via variáveis de ambiente

## Estratégia Offline-First

1. Download: app baixa inspeções atribuídas ao técnico
2. Escrita local: toda alteração vai primeiro no SQLite
3. Outbox: cada alteração cria operação com UUID idempotente
4. Envio: operações ordenadas por dependência, em lote
5. Confirmação: API retorna resultado individual por operação
6. Conflitos: versão divergente gera conflito explícito, dados locais preservados

## Ambientes

| Ambiente | Finalidade |
|---|---|
| Local | Desenvolvimento individual |
| Integração | Integração entre mobile, web e API |
| Teste/Demo | Avaliação e apresentação |
