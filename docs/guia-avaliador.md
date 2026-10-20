# Guia do Avaliador — FieldOps

> Ponto único de entrada para avaliar o projeto **FieldOps**. Este guia **não duplica**
> documentação: ele consolida e aponta, por links, tudo o que já existe no repositório
> (OpenAPI/Swagger, diagramas, READMEs de execução, modelo de dados e regras de negócio).

Relacionado ao **PBI-071** ("Como avaliador, quero consultar o OpenAPI e os principais
diagramas"). O requisito-base do PBI-071 já consta como ✅ concluído na
[análise de sprint](./analise-sprint1-back-web.md); este guia apenas reúne o material
para a defesa/avaliação.

---

## 1. Visão geral

O FieldOps é uma plataforma para planejar, executar, acompanhar e revisar inspeções
técnicas em campo, com funcionamento offline. É um monorepo com três módulos e uma camada
de infraestrutura. A visão completa, personas, casos de uso e fluxos estão no
[documento do produto](./notion.md) e no [README da raiz](../README.md).

| Módulo | Pasta | Stack real | Responsabilidade |
|---|---|---|---|
| API REST | [`api/`](../api/README.md) | Java 21 + Spring Boot 3.5 + PostgreSQL + JWT | Regras de negócio, autenticação, persistência, OpenAPI |
| Web Admin | [`frontend/`](../frontend/README.md) | **React 19 + Vite + TypeScript** (React Router, Tailwind CSS) | Gestão, planejamento e revisão de inspeções |
| Mobile | [`mobile/`](../mobile/README.md) | Expo SDK 57 + React Native + TypeScript + SQLite | Execução de inspeções em campo, offline-first |
| Infraestrutura | — | PostgreSQL + SQLite + armazenamento de evidências | Dados centrais + locais + evidências |

> **Atenção à stack do web (divergência do documento do professor).** O documento do
> professor cita "Angular/React". O frontend web **não usa Angular**: a stack real é
> **React + Vite + TypeScript**, confirmada em
> [`frontend/package.json`](../frontend/package.json),
> [`frontend/vite.config.ts`](../frontend/vite.config.ts) e no
> [README do frontend](../frontend/README.md).

---

## 2. Como executar cada módulo

Cada módulo tem seu próprio README com pré-requisitos e comandos. Pré-requisitos gerais:
**Java 21+**, **Node.js 20+** e **npm**, e **PostgreSQL 15+** (ou Docker).

| Módulo | README | Comando de execução (resumo) |
|---|---|---|
| API | [`api/README.md`](../api/README.md) | `cd api` → `cp .env.example .env` → `./mvnw spring-boot:run` (Windows: `.\mvnw.cmd spring-boot:run`) |
| Web Admin | [`frontend/README.md`](../frontend/README.md) | `cd frontend` → `npm install` → `npm run dev` |
| Mobile | [`mobile/README.md`](../mobile/README.md) | `cd mobile` → `npm install` → `npx expo start` |

Os comandos acima são um resumo. **Siga sempre os READMEs linkados** para pré-requisitos,
variáveis de ambiente e detalhes de cada alvo de execução.

---

## 3. Documentação da API (OpenAPI / Swagger)

Com a API em execução no perfil `dev` (`cd api` → `./mvnw spring-boot:run`), o contrato
fica disponível em:

- **Swagger UI:** <http://localhost:8080/swagger-ui.html>
- **OpenAPI JSON:** <http://localhost:8080/v3/api-docs>

O contrato é gerado pelo springdoc e cobre todos os grupos de endpoints (auth, usuários,
clientes, locais, equipamentos, modelos de inspeção, inspeções admin, revisão/decisão,
mobile e sync), com o esquema de autenticação **Bearer JWT**. Detalhes e as convenções da
API estão em [`api/README.md`](../api/README.md) e no
[documento do produto, seção 12](./notion.md).

> Alternativa para demonstração: a API também sobe via Docker
> (`cd api` → `docker compose up --build`), já com migrações Flyway e dados de seed do
> perfil `demo` — ver [`api/README.md`](../api/README.md).

---

## 4. Diagramas

Os dois diagramas pedidos estão em [`docs/api-diagrams.md`](./api-diagrams.md), em
[Mermaid](https://mermaid.js.org/), e renderizam diretamente no GitHub:

- **Diagrama de entidades (ER):** [`docs/api-diagrams.md` — Diagrama de entidades](./api-diagrams.md#diagrama-de-entidades)
- **Máquina de estados da inspeção:** [`docs/api-diagrams.md` — Diagrama de estados da inspeção](./api-diagrams.md#diagrama-de-estados-da-inspeção)

A máquina de estados reflete o `InspectionStatus` e as transições aplicadas no backend
(`InspectionService` e `MobileInspectionService`), com os endpoints de cada transição
documentados no próprio arquivo.

---

## 5. Modelo de dados e regras de negócio

| Tema | Onde está |
|---|---|
| Modelo de dados (entidades e relacionamentos) | [`docs/notion.md` — seção 10](./notion.md) · steering [`data-model.md`](../.kiro/steering/data-model.md) |
| Regras de negócio (RN-001 … RN-090) | [`docs/notion.md` — seção 9](./notion.md) · steering [`business-rules.md`](../.kiro/steering/business-rules.md) |
| Arquitetura e decisões técnicas | [`docs/notion.md` — seção 11](./notion.md) · steering [`architecture.md`](../.kiro/steering/architecture.md) |
| Contrato da API (convenções) | [`docs/notion.md` — seção 12](./notion.md) · steering [`api-contract.md`](../.kiro/steering/api-contract.md) |
| Casos de uso e personas | [`docs/notion.md` — seções 4 e 6](./notion.md) · steering [`use-cases.md`](../.kiro/steering/use-cases.md) |

---

## 6. Mapa de requisitos do professor → onde são atendidos

Tabela ligando os requisitos citados no [documento do professor](./notion.md) às
evidências no repositório.

| Requisito | Enunciado (resumo) | Onde é atendido |
|---|---|---|
| **RN-090** | A documentação da API deve refletir estados, validações e erros implementados. | OpenAPI/Swagger gerado pelo springdoc (`/swagger-ui.html`, `/v3/api-docs`); máquina de estados em [`docs/api-diagrams.md`](./api-diagrams.md#diagrama-de-estados-da-inspeção); erros padronizados via `@RestControllerAdvice` (ver [`api/README.md`](../api/README.md)). |
| **RNF-008** | O contrato da API deve ser documentado. | Contrato OpenAPI 3 (springdoc) em `/v3/api-docs` e Swagger UI em `/swagger-ui.html`; convenções em [`docs/notion.md` — seção 12](./notion.md). |
| **RNF-012** | Os componentes devem poder ser executados por instruções documentadas. | READMEs por módulo: [`api/README.md`](../api/README.md), [`frontend/README.md`](../frontend/README.md), [`mobile/README.md`](../mobile/README.md); resumo na seção 2 deste guia. |
| **PBI-071** | Como avaliador, quero consultar o OpenAPI e os principais diagramas. | OpenAPI/Swagger (seção 3) + diagramas de entidades e de estados em [`docs/api-diagrams.md`](./api-diagrams.md) (seção 4). Status ✅ concluído na [análise de sprint](./analise-sprint1-back-web.md). |

---

## 7. Referências

- Documento do professor: [`docs/notion.md`](./notion.md) (RN-090, RNF-008, RNF-012, PBI-071, seção 12 — Convenções da API)
- Cronograma: [`docs/cronograma.md`](./cronograma.md) (PBI-071, Sprint 2)
- Análise de sprint: [`docs/analise-sprint1-back-web.md`](./analise-sprint1-back-web.md) (PBI-071 ✅ concluído)
- Diagramas: [`docs/api-diagrams.md`](./api-diagrams.md)
- READMEs: [`api/README.md`](../api/README.md) · [`frontend/README.md`](../frontend/README.md) · [`mobile/README.md`](../mobile/README.md)
