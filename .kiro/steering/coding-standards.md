---
inclusion: auto
---

# FieldOps — Padrões de Código e Convenções

## Geral

- Idioma do código: Inglês
- Idioma da documentação: Português (BR)
- Commits: convenção Conventional Commits (feat:, fix:, docs:, refactor:, test:, chore:)
- Branches: feature/{epic}-{descricao}, fix/{descricao}, release/{versao}
- PRs obrigatórios para merge na main

## TypeScript (Mobile + Web Admin)

- Strict mode habilitado
- Interfaces para DTOs e contratos
- Types para unions e tipos auxiliares
- Enums como const objects ou string unions
- Nomes de componentes em PascalCase
- Nomes de funções/variáveis em camelCase
- Nomes de arquivos em kebab-case
- Imports absolutos via aliases (@/features/, @/components/, etc.)

## Mobile (Expo + React Native)

- Expo Router para navegação
- Organização por features
- TanStack Query para dados remotos
- SQLite (expo-sqlite) para persistência local
- React Hook Form + Zod para formulários
- Zustand ou Context para estado de UI pequeno
- Secure Store para tokens
- Componentes de design system reutilizáveis
- Virtualização em listas longas
- Validação offline antes de enviar

## Web Admin (Angular)

- Standalone components (Angular 17+)
- Formulários reativos (ReactiveFormsModule)
- Guards para proteção de rotas
- Interceptors para auth e tratamento de erros
- Services tipados para cada entidade
- Componentes shared para tabelas, filtros, estados
- Lazy loading por feature

## Backend (Java + Spring Boot)

- Java 17+
- Estrutura por feature (não por camada)
- DTOs separados das entidades JPA
- Validação com Bean Validation (@NotNull, @Size, etc.)
- Exceções mapeadas para respostas padronizadas
- Mappers explícitos (MapStruct ou manual)
- Migrations com Flyway ou Liquibase
- Testes unitários para regras de negócio
- Testes de integração para endpoints críticos
- OpenAPI gerado a partir de anotações

## Banco de Dados

- PostgreSQL para produção
- Nomes de tabelas em snake_case
- Colunas em snake_case
- UUIDs como PKs
- created_at e updated_at em todas as tabelas
- version para controle otimista onde necessário
- Índices para FKs e campos de busca frequente
- Constraints no banco para regras críticas (UNIQUE, NOT NULL)

## Segurança

- Nunca commitar .env, chaves ou credenciais
- Senhas com bcrypt
- JWT com expiração curta (15min) + refresh token
- Tokens no mobile em Secure Store (nunca AsyncStorage)
- CORS restrito
- Input validation em todas as camadas
- SQL injection prevenido via JPA/prepared statements
- Sem stack traces em respostas de erro
