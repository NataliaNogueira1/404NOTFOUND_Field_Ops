# FieldOps — Plataforma de Inspeção em Campo

> Plataforma integrada para planejamento, execução, acompanhamento e revisão de inspeções técnicas realizadas em campo.

---

## Sobre o projeto

O **FieldOps** substitui processos baseados em formulários impressos, planilhas e registros informais por um fluxo digital integrado. A solução conecta o trabalho do técnico de campo à gestão administrativa, preservando evidências, histórico, localização e regras de negócio em um único fluxo rastreável.

### Links Úteis
* **Documentação Original:** [Notion - Projeto FieldOps](https://glaucotodesco.notion.site/Projeto-FieldOps-3af5d52a81f580c0b92ec261c686abb4)
* **Design/Protótipo:** [Figma - Design](https://www.figma.com/design/TDZgjSw38R35CxhmAmyt64/Field-Ops?node-id=0-1&p=f&t=CF8K5GbmQBdqvael-0)

---

## Equipe

| Nome | Atuação / Componente |
|---|---|
| **Andressa** | Web |
| **Carol** | Web |
| **Felipe** | Mobile |
| **Ian** | Web |
| **Julia** | Web e Nuvem |
| **Lucas** | Backend |
| **Marcela** | Backend e Nuvem |
| **Natália** | Mobile |
| **Rodrigo** | Mobile |

---

## O problema

Inspeções técnicas em campo ainda dependem, em muitos cenários, de formulários em papel, arquivos avulsos e mensagens por diferentes canais. Isso gera uma cadeia fragmentada entre planejamento, execução e análise, com problemas como:

- Perda de respostas quando não há internet
- Fotografias sem vínculo ao item inspecionado
- Falta de visibilidade do supervisor sobre o andamento
- Retrabalho por informações incompletas
- Ausência de fluxo formal de aprovação

---

## Arquitetura

```text
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
│ PostgreSQL   │  │ Armazenamento de │
│ Dados        │  │ evidências       │
└──────────────┘  └──────────────────┘
        ▲
        │ HTTPS / JSON
┌───────┴─────────────────────┐
│ Interface Administrativa    │
│ Angular + TypeScript        │
└─────────────────────────────┘
```

---

## Componentes

### Aplicativo Mobile
Destinado aos técnicos de campo. Desenvolvido com **Expo + React Native + TypeScript**.

- Consulta de inspeções atribuídas
- Execução de checklists dinâmicos
- Identificação de equipamentos por QR Code
- Captura de fotografias e geolocalização
- Armazenamento local com **SQLite**
- **Funcionamento offline** com sincronização automática ao reconectar

### Interface Administrativa Web
Destinada a administradores e supervisores. Desenvolvida com **Angular + TypeScript**.

- Cadastro de clientes, locais, equipamentos e usuários
- Criação e versionamento de modelos de inspeção
- Agendamento e atribuição de inspeções a técnicos
- Acompanhamento do andamento em tempo real
- Revisão de respostas e evidências
- Aprovação, reprovação e solicitação de correção
- Acompanhamento de não conformidades

### API REST
Componente central da solução. Desenvolvida com **Java + Spring Boot**.

- Autenticação e autorização por perfil (JWT)
- Centralização das regras de negócio
- Persistência em **PostgreSQL**
- Upload e consulta de evidências
- Operações idempotentes para sincronização
- Registro de auditoria
- Documentação **OpenAPI / Swagger**

---

## Fluxo principal

```text
Configuração administrativa
        ↓
Criação do modelo de inspeção
        ↓
Agendamento e atribuição
        ↓
Disponibilização ao técnico
        ↓
Execução em campo (com suporte offline)
        ↓
Registro de respostas e evidências
        ↓
Sincronização
        ↓
Revisão do supervisor
        ↓
Aprovação ou solicitação de correção
```

---

## Perfis de usuário

| Perfil | Responsabilidades |
|--------|-------------------|
| **Técnico** | Executa inspeções, preenche checklists, registra fotos e localização |
| **Supervisor** | Cria modelos, agenda inspeções, revisa resultados e aprova/reprova |
| **Administrador** | Gerencia cadastros, usuários e permissões do sistema |

---

## Tecnologias

| Componente | Tecnologias |
|------------|-------------|
| **Mobile** | Expo, React Native, TypeScript, Expo Router, SQLite |
| **Backend** | Java, Spring Boot, JPA, PostgreSQL, JWT |
| **Web Admin** | Angular, TypeScript |
| **Infraestrutura** | PostgreSQL, SQLite, armazenamento de objetos (evidências) |

---

## Estrutura dos repositórios

Este projeto é composto por três repositórios independentes:

```bash
fieldops-api/      # API REST — Java + Spring Boot
fieldops-mobile/   # Aplicativo mobile — Expo + React Native
fieldops-web/      # Interface administrativa — Angular
```

---

## MVP

O MVP contempla o fluxo completo de ponta a ponta:

1. Administrador cadastra dados básicos (clientes, locais, equipamentos, usuários)
2. Supervisor cria um modelo de inspeção
3. Supervisor agenda e atribui a inspeção a um técnico
4. Técnico recebe a inspeção no aplicativo mobile
5. Técnico executa o checklist, registra fotos, QR Code e localização
6. Técnico consegue trabalhar sem internet e os dados são preservados localmente
7. Aplicativo sincroniza os dados ao reconectar
8. Supervisor revisa o resultado
9. Supervisor aprova ou reprova a inspeção

---

## Documentação

A documentação completa do projeto está organizada nos seguintes documentos:

- **01 - Visão Geral** — Resumo executivo, escopo e declaração da visão
- **02 - Objetivos** — Objetivos de negócio, técnicos e acadêmicos
- **03 - Problema** — Contexto, dores por perfil e oportunidade
- **04 - Personas** — Carlos (técnico), Marina (supervisora), Ana (administradora)
- **05 - Perfis de Usuário** — Permissões e capacidades por perfil
- **06 - Casos de Uso** — Fluxos detalhados por ator
- **07 - Fluxo Geral** — Diagrama do fluxo completo
- **08 - Funcionalidades** — Lista de funcionalidades por componente
- **09 - Regras de Negócio** — Regras e validações do domínio
- **10 - Modelo de Dados** — Entidades e relacionamentos
- **11 - Arquitetura** — Decisões arquiteturais e estrutura de código
- **12 - API REST** — Contrato de endpoints
- **13 - Aplicativo Mobile** — Especificação de telas e comportamentos
- **14 - Interface Administrativa Web** — Especificação de telas e fluxos
- **15 - Backlog do Produto** — Histórias de usuário e critérios de aceitação
- **16 - Roadmap** — Fases de entrega
- **17 - Critérios de Aceitação** — Critérios por funcionalidade

---

## Como começar

### Pré-requisitos

- **Java 21+** e **Maven** (para a API)
- **Node.js 20+** e **npm** (para mobile e web)
- **PostgreSQL 15+**
- **Expo CLI** (`npm install -g expo-cli`)

### API

```bash
cd fieldops-api
cp .env.example .env
# configure as variáveis de banco e JWT
mvn spring-boot:run
```

A documentação da API estará disponível em `http://localhost:8080/swagger-ui.html`.

### Mobile

```bash
cd fieldops-mobile
npm install
npx expo start
```

### Web Admin

```bash
cd fieldops-web
npm install
ng serve
```
