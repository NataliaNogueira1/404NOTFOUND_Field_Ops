# Orçamento do Projeto — FieldOps

> **Disciplina:** Gestão de Projetos — 4º semestre ADS
> **Professor:** Me. Deivison S. Takatu
> **Aula 05:** Custos e Qualidade — Atividade de Custos
> **Projeto:** FieldOps — Plataforma de Inspeção em Campo
> **Equipe:** 404 Not Found
> **Data:** 04/09/2026

---

## 1. Objetivo

Este documento apresenta o **orçamento do Projeto FieldOps**, elaborado conforme o processo de **Gerenciamento dos Custos do Projeto** (PMBOK, área 7): planejar o gerenciamento dos custos, estimar os custos e determinar o orçamento.

O orçamento contempla **37 itens** organizados em **5 categorias**, apresentando para cada item: descrição, quantidade, unidade, valor estimado, responsável e a categoria correspondente. As estimativas foram baseadas na **estimativa de investimentos registrada no Termo de Abertura do Projeto (TAP)** e nos demais artefatos do projeto.

### 1.1 Linha de base autorizada (TAP)

O TAP autoriza formalmente o investimento do projeto nos seguintes termos:

| Parâmetro do TAP | Valor |
|---|---|
| Estimativa de investimentos | **R$ 204.000,00** |
| Base de esforço | 9 desenvolvedores × ~3.400 horas de trabalho |
| Estimativa de prazo | 3 meses, a partir de agosto/2026 |
| Patrocinador (sponsor) | Fundação Toyota do Brasil |
| Gerente do projeto | Natália Nogueira |

> Este orçamento detalha e distribui a estimativa de **R$ 204.000,00** do TAP em categorias e itens, mantendo-a como **teto de investimento autorizado** e **linha de base de custos** do projeto.

---

## 2. Premissas de Custeio

| Premissa | Valor adotado |
|---|---|
| Regime de trabalho | Equipe de 9 integrantes (conforme TAP) |
| Esforço total de mão de obra | ~3.400 horas (conforme TAP) |
| Duração base | 3 meses a partir de agosto/2026 (conforme TAP) |
| Custo-hora — Desenvolvedor (Back/Web/Mobile) | R$ 50,00 |
| Custo-hora — Gerente / Coordenador de Projeto | R$ 90,00 |
| Custo-hora — Especialista de Nuvem / DevOps | R$ 70,00 |
| Custo-hora — QA / Testes | R$ 45,00 |
| Custo-hora — Designer (UI/UX) | R$ 55,00 |
| Custo-hora médio da mão de obra | ~R$ 54,00 |
| Moeda | Real (R$) |
| Impostos e encargos | Não considerados (projeto acadêmico) |

> Os valores de custo-hora são estimativas de mercado. O **custo-hora médio de ~R$ 54,00** aplicado às ~3.400 horas do TAP compõe o valor de mão de obra deste orçamento.

---

## 3. Método de Estimativa — Três Pontos

Para os principais pacotes de trabalho utilizou-se a **estimativa de três pontos** (PERT), combinando os cenários otimista, mais provável e pessimista:

```
cE = (cO + 4·cM + cP) / 6
```

- **cO (Otimista):** melhor cenário para a atividade
- **cM (Mais provável):** esforço realista esperado
- **cP (Pessimista):** pior cenário para a atividade
- **cE (Esperado):** custo esperado ponderado

### 3.1 Aplicação em pacotes-chave

| Pacote de trabalho | cO (R$) | cM (R$) | cP (R$) | cE = (cO+4cM+cP)/6 |
|---|---:|---:|---:|---:|
| API — Autenticação e autorização (JWT) | 6.000 | 8.000 | 12.000 | **8.333,33** |
| Sincronização offline (mobile ↔ API) | 8.000 | 10.500 | 15.000 | **10.833,33** |
| Construtor de modelos de inspeção (web) | 7.000 | 9.500 | 13.500 | **9.750,00** |
| Execução de checklist dinâmico (mobile) | 7.500 | 10.000 | 14.500 | **10.166,67** |
| Provisionamento de infraestrutura/nuvem | 5.000 | 7.500 | 11.000 | **7.583,33** |

---

## 4. Orçamento Detalhado por Categoria

### Categoria A — Recursos Humanos (Mão de obra)

> Total de esforço da categoria: **3.425 horas** (~3.400 h do TAP), distribuídas entre as frentes de backend, web, mobile, gestão, DevOps, design e QA.

| # | Item / Atividade | Qtd | Unid | Vlr Unitário (R$) | Total (R$) | Responsável |
|---|---|---:|---|---:|---:|---|
| A1 | Gestão e planejamento do projeto (TAP, EAP, cronograma, controle) | 290 | h | 90,00 | 26.100,00 | Natália (GP) |
| A2 | Desenvolvimento Backend — Autenticação e autorização | 165 | h | 50,00 | 8.250,00 | Lucas / Marcela |
| A3 | Desenvolvimento Backend — Cadastros de domínio (CRUDs) | 195 | h | 50,00 | 9.750,00 | Lucas / Marcela |
| A4 | Desenvolvimento Backend — Modelos e versionamento | 175 | h | 50,00 | 8.750,00 | Lucas |
| A5 | Desenvolvimento Backend — Ciclo de vida da inspeção | 165 | h | 50,00 | 8.250,00 | Marcela |
| A6 | Desenvolvimento Backend — Sincronização offline e idempotência | 215 | h | 50,00 | 10.750,00 | Lucas / Marcela |
| A7 | Desenvolvimento Backend — Auditoria, seed, Docker e OpenAPI | 135 | h | 50,00 | 6.750,00 | Marcela |
| A8 | Desenvolvimento Web — Base, layout e rotas protegidas | 130 | h | 50,00 | 6.500,00 | Andressa / Ian |
| A9 | Desenvolvimento Web — Telas de cadastros administrativos | 185 | h | 50,00 | 9.250,00 | Carol / Júlia |
| A10 | Desenvolvimento Web — Construtor de modelos de inspeção | 195 | h | 50,00 | 9.750,00 | Ian / Andressa |
| A11 | Desenvolvimento Web — Revisão, aprovação e dashboard | 175 | h | 50,00 | 8.750,00 | Carol / Ian |
| A12 | Desenvolvimento Mobile — Base, navegação e login | 130 | h | 50,00 | 6.500,00 | Rodrigo / Natália |
| A13 | Desenvolvimento Mobile — Consulta e detalhes de inspeções | 145 | h | 50,00 | 7.250,00 | Felipe (Cutiur) |
| A14 | Desenvolvimento Mobile — Checklist dinâmico | 205 | h | 50,00 | 10.250,00 | Rodrigo / Felipe |
| A15 | Desenvolvimento Mobile — Evidências, QR Code e GPS | 165 | h | 50,00 | 8.250,00 | Natália / Rodrigo |
| A16 | Desenvolvimento Mobile — Offline, outbox e sincronização | 215 | h | 50,00 | 10.750,00 | Felipe / Natália |
| A17 | Configuração de nuvem e DevOps | 110 | h | 70,00 | 7.700,00 | Júlia / Marcela |
| A18 | Design UI/UX e protótipo (Figma) | 135 | h | 55,00 | 7.425,00 | Andressa |
| A19 | Testes automatizados e QA | 155 | h | 45,00 | 6.975,00 | Equipe QA |
| A20 | Documentação, apresentação e demonstração final | 140 | h | 50,00 | 7.000,00 | Equipe completa |
| | **Subtotal A — Recursos Humanos** | **3.425** | **h** | | **184.950,00** | |

### Categoria B — Infraestrutura e Nuvem

| # | Item / Atividade | Qtd | Unid | Vlr Unitário (R$) | Total (R$) | Responsável |
|---|---|---:|---|---:|---:|---|
| B1 | Servidor de aplicação (hospedagem API) | 2 | mês | 180,00 | 360,00 | Júlia |
| B2 | Banco de dados PostgreSQL gerenciado | 2 | mês | 150,00 | 300,00 | Marcela |
| B3 | Armazenamento de objetos (evidências/fotos) | 2 | mês | 90,00 | 180,00 | Júlia |
| B4 | Domínio e certificado SSL | 1 | ano | 120,00 | 120,00 | Júlia |
| B5 | Serviço de notificações push | 2 | mês | 60,00 | 120,00 | Marcela |
| B6 | Pipeline CI/CD (build e deploy) | 2 | mês | 80,00 | 160,00 | Júlia |
| B7 | Ambiente de homologação/testes | 2 | mês | 120,00 | 240,00 | Marcela |
| | **Subtotal B — Infraestrutura e Nuvem** | | | | **1.480,00** | |

### Categoria C — Ferramentas e Licenças de Software

| # | Item / Atividade | Qtd | Unid | Vlr Unitário (R$) | Total (R$) | Responsável |
|---|---|---:|---|---:|---:|---|
| C1 | Licença Figma (design/protótipo) | 2 | mês | 75,00 | 150,00 | Andressa |
| C2 | Conta de distribuição Google Play (build APK) | 1 | única | 135,00 | 135,00 | Rodrigo |
| C3 | Ferramenta de gestão de projeto (board/backlog) | 2 | mês | 50,00 | 100,00 | Natália |
| C4 | IDEs e plugins premium | 9 | licença | 40,00 | 360,00 | Equipe completa |
| C5 | Ferramenta de testes de API (ex.: Postman) | 2 | mês | 60,00 | 120,00 | Lucas |
| | **Subtotal C — Ferramentas e Licenças** | | | | **865,00** | |

### Categoria D — Equipamentos e Materiais

| # | Item / Atividade | Qtd | Unid | Vlr Unitário (R$) | Total (R$) | Responsável |
|---|---|---:|---|---:|---:|---|
| D1 | Dispositivo Android para testes de campo | 2 | un | 900,00 | 1.800,00 | Equipe Mobile |
| D2 | Impressão de etiquetas QR Code para equipamentos | 100 | un | 1,20 | 120,00 | Natália |
| D3 | Material de transporte para visita de campo (demo) | 2 | visita | 50,00 | 100,00 | Equipe |
| D4 | Impressão de documentação e material de apresentação | 1 | pacote | 80,00 | 80,00 | Natália |
| | **Subtotal D — Equipamentos e Materiais** | | | | **2.100,00** | |

### Categoria E — Reserva de Contingência

| # | Item / Atividade | Qtd | Unid | Vlr Unitário (R$) | Total (R$) | Responsável |
|---|---|---:|---|---:|---:|---|
| E1 | Reserva de contingência (~7,7% dos custos diretos) | 1 | verba | 14.605,00 | 14.605,00 | Natália (GP) |
| | **Subtotal E — Contingência** | | | | **14.605,00** | |

---

## 5. Resumo do Orçamento (Linha de Base de Custos)

| Categoria | Total (R$) | % do total |
|---|---:|---:|
| A — Recursos Humanos | 184.950,00 | 90,7% |
| B — Infraestrutura e Nuvem | 1.480,00 | 0,7% |
| C — Ferramentas e Licenças | 865,00 | 0,4% |
| D — Equipamentos e Materiais | 2.100,00 | 1,0% |
| **Subtotal — Custos Diretos** | **189.395,00** | **92,8%** |
| E — Reserva de Contingência | 14.605,00 | 7,2% |
| **TOTAL GERAL DO PROJETO** | **204.000,00** | **100%** |

> **Total de itens orçados:** 37 itens distribuídos em 5 categorias (20 de RH, 7 de infraestrutura, 5 de ferramentas, 4 de equipamentos e 1 de contingência).
>
> **Aderência ao TAP:** o total geral de **R$ 204.000,00** coincide exatamente com a estimativa de investimentos autorizada no Termo de Abertura do Projeto.

---

## 6. Considerações Finais

- O orçamento foi elaborado de forma a **respeitar a linha de base de R$ 204.000,00 autorizada no TAP**, distribuindo esse valor em categorias e itens detalhados.
- O maior peso está em **Recursos Humanos** (90,7%), coerente com o TAP, cuja estimativa parte da mão de obra de 9 desenvolvedores por ~3.400 horas. O esforço aqui distribuído (3.425 h) e o custo-hora médio (~R$ 54,00) reproduzem essa base.
- Os custos de **nuvem e ferramentas** foram estimados por assinatura mensal ao longo do período do projeto.
- A **reserva de contingência** (~7,7% dos custos diretos, R$ 14.605,00) mantém o total dentro do teto do TAP e cobre riscos como retrabalho de sincronização offline e ajustes no construtor de modelos, itens identificados como de maior incerteza na estimativa de três pontos.
- Este orçamento constitui a **linha de base de custos** do FieldOps e deverá ser monitorado no processo *7.4 — Controlar os custos*, comparando o previsto com o realizado ao longo das sprints.
