# Relatório Final — Elementos Pré-Textuais

> **Projeto:** FieldOps — Plataforma de Inspeção em Campo
> **Equipe:** 404 Not Found
> **Documento:** Elementos pré-textuais do Relatório Final, adaptados ao
> *Template - Relatório Final* (`docs/referencias/modelos/Template - Relatório Final.docx`).
>
> Este documento preenche a parte pré-textual do template para o FieldOps: capa,
> folha de rosto, resumo, abstract, palavras-chave, listas (ilustrações, tabelas,
> quadros, abreviaturas e siglas) e sumário. Os marcadores `<NOME>` e `<TÍTULO>`
> do modelo foram substituídos, e o texto-exemplo de sustentabilidade foi
> integralmente removido. Mantêm-se a numeração e os títulos do template.

---

## Capa

```
CENTRO UNIVERSITÁRIO SENAI SÃO PAULO — UniSENAI-SP
CAMPUS SOROCABA — SANTA ROSÁLIA
ANÁLISE E DESENVOLVIMENTO DE SISTEMAS


EQUIPE 404 NOT FOUND

Andressa Almeida Bartolomeu Custódio
Caroline de Almeida Arruda
Felipe Cutiur dos Santos
Ian Lucas Borges de Oliveira Pinto
Lucas Miguel Leite
Marcela Moraes Mulato
Natália Nogueira
Rodrigo Ferreira Soares


FIELDOPS — PLATAFORMA DE INSPEÇÃO EM CAMPO


SOROCABA, SP
2026
```

---

## Folha de Rosto

```
EQUIPE 404 NOT FOUND

Andressa Almeida Bartolomeu Custódio
Caroline de Almeida Arruda
Felipe Cutiur dos Santos
Ian Lucas Borges de Oliveira Pinto
Lucas Miguel Leite
Marcela Moraes Mulato
Natália Nogueira
Rodrigo Ferreira Soares


FIELDOPS — PLATAFORMA DE INSPEÇÃO EM CAMPO


Trabalho apresentado ao Centro Universitário SENAI São Paulo — UniSENAI-SP
Campus Sorocaba — Santa Rosália como instrumento de avaliação da disciplina de
Gestão de Projetos.

Orientador(a): Deivison Takatu


SOROCABA, SP
2026
```

---

## RESUMO

O FieldOps é uma plataforma digital para o planejamento, a execução, o
acompanhamento e a revisão de inspeções técnicas realizadas em campo,
desenvolvida para substituir formulários em papel, planilhas e mensagens
informais por um fluxo digital integrado, rastreável e com funcionamento
offline. A solução é composta por um aplicativo mobile (Expo/React Native) usado
pelos técnicos de campo, uma interface administrativa web (React/Vite) destinada
a supervisores e administradores, uma API REST (Java/Spring Boot) responsável
pelas regras de negócio, autenticação e persistência, e uma infraestrutura de
dados baseada em PostgreSQL, SQLite e armazenamento de objetos para evidências.
O principal desafio técnico é garantir a continuidade do trabalho em campo mesmo
sem conexão, por meio de armazenamento local e sincronização idempotente que
evita perda ou duplicação de informações. Este relatório descreve a gestão do
projeto nas áreas de conhecimento do PMBOK — integração, escopo, cronograma,
custos, qualidade, recursos, comunicações, riscos, aquisições e partes
interessadas —, aplicadas a um Produto Mínimo Viável (MVP) planejado para um teto
de investimento de R$ 204.000,00 e um prazo de execução de três meses, com
demonstração ponta a ponta ao final. Conclui-se que a organização integrada das
frentes de backend, web, mobile e infraestrutura, apoiada por artefatos de gestão
(EAP, cronograma, orçamento, matriz RACI, plano de comunicação e registro de
riscos), torna o escopo viável dentro das restrições de orçamento, prazo e
equipe.

**Palavras-chave:** Inspeção em Campo; Aplicativo Offline-First; Gestão de Projetos.

---

## ABSTRACT

FieldOps is a digital platform for planning, executing, monitoring and reviewing
field technical inspections, designed to replace paper forms, spreadsheets and
informal messaging with an integrated, traceable and offline-capable digital
workflow. The solution comprises a mobile application (Expo/React Native) used by
field technicians, a web administrative interface (React/Vite) for supervisors
and administrators, a REST API (Java/Spring Boot) responsible for business rules,
authentication and persistence, and a data infrastructure based on PostgreSQL,
SQLite and object storage for evidence. The main technical challenge is ensuring
that field work continues even without connectivity, through local storage and
idempotent synchronization that prevents data loss or duplication. This report
describes project management across the PMBOK knowledge areas — integration,
scope, schedule, cost, quality, resources, communications, risk, procurement and
stakeholders — applied to a Minimum Viable Product (MVP) planned within an
investment ceiling of R$ 204,000.00 and a three-month execution timeline, with an
end-to-end demonstration at the end. It is concluded that the integrated
organization of the backend, web, mobile and infrastructure fronts, supported by
management artifacts (WBS, schedule, budget, RACI matrix, communication plan and
risk register), makes the scope feasible within the budget, time and team
constraints.

**Keywords:** Field Inspection; Offline-First Application; Project Management.

---

## LISTA DE ILUSTRAÇÕES

| Ilustração | Título | Fonte |
|---|---|---|
| FIGURA 1 | Diagrama da EAP (Estrutura Analítica do Projeto) | [`eap.md`](./eap.md) |
| FIGURA 2 | Organograma da equipe | [`organograma.md`](./organograma.md) |
| FIGURA 3 | Gráfico de Gantt — cronograma das sprints | [`cronograma.md`](./cronograma.md) |
| FIGURA 4 | Fluxo de comunicação do projeto | [`plano-de-comunicacao.md`](./plano-de-comunicacao.md) |

> As figuras são diagramas em Mermaid, renderizados a partir dos documentos-fonte
> indicados. Caso o relatório final seja consolidado em `.docx`, as figuras devem
> ser exportadas como imagem a partir desses diagramas.

---

## LISTA DE TABELAS

| Tabela | Título | Capítulo |
|---|---|---|
| TABELA 1 | Parâmetros autorizados no TAP | 5 — Custos |
| TABELA 2 | Estimativa de três pontos (PERT) dos pacotes-chave | 5 — Custos |
| TABELA 3 | Distribuição dos custos por iniciativa | 5 — Custos |
| TABELA 4 | Orçamento consolidado por categoria | 5 — Custos |
| TABELA 5 | Registro de riscos (probabilidade × impacto × severidade) | 9 — Riscos |
| TABELA 6 | Necessidades de aquisição por categoria | 10 — Aquisições |

---

## LISTA DE QUADROS

| Quadro | Título | Capítulo |
|---|---|---|
| QUADRO 1 | Dicionário da EAP | 3 — Escopo |
| QUADRO 2 | Backlog por sprint e área (PBIs) | 4 — Cronograma |
| QUADRO 3 | Equipe e papéis | 7 — Recursos Humanos |
| QUADRO 4 | Plano de comunicação | 8 — Comunicações |
| QUADRO 5 | Critérios de seleção e gestão de fornecedores | 10 — Aquisições |

---

## LISTA DE ABREVIATURAS

| Abreviatura | Significado |
|---|---|
| Apênd. | Apêndice |
| Doc. | Documento |
| Fig. | Figura |
| Qtd. | Quantidade |
| Seç. | Seção |
| Vlr. | Valor |

---

## LISTA DE SIGLAS

| Sigla | Significado |
|---|---|
| ADS | Análise e Desenvolvimento de Sistemas |
| API | Application Programming Interface |
| APK | Android Package (pacote de instalação Android) |
| CI/CD | Continuous Integration / Continuous Delivery |
| CRUD | Create, Read, Update, Delete |
| CSV | Comma-Separated Values |
| EAP | Estrutura Analítica do Projeto |
| GP | Gerente de Projeto |
| JWT | JSON Web Token |
| MVP | Minimum Viable Product (Produto Mínimo Viável) |
| NC | Não Conformidade |
| PBI | Product Backlog Item |
| PDF | Portable Document Format |
| PERT | Program Evaluation and Review Technique |
| PMBOK | Project Management Body of Knowledge |
| PO | Product Owner |
| QA | Quality Assurance |
| QR Code | Quick Response Code |
| RACI | Responsible, Accountable, Consulted, Informed |
| REST | Representational State Transfer |
| SQL | Structured Query Language |
| TAP | Termo de Abertura do Projeto |
| UI/UX | User Interface / User Experience |
| WBS | Work Breakdown Structure |

---

## SUMÁRIO

| Capítulo / Seção | Documento-fonte |
|---|---|
| **1 INTRODUÇÃO** | [`relatorio-final-cap1-introducao.md`](./relatorio-final-cap1-introducao.md) |
| &nbsp;&nbsp;1.1 Contextualização do Problema | |
| &nbsp;&nbsp;1.2 Justificativa e Objetivos | |
| &nbsp;&nbsp;1.3 Metodologia Utilizada | |
| **2 GERENCIAMENTO DA INTEGRAÇÃO** | [`relatorio-final-cap2-gerenciamento-integracao.md`](./relatorio-final-cap2-gerenciamento-integracao.md) |
| &nbsp;&nbsp;2.1 Estrutura e Direcionamento do Portfólio | |
| &nbsp;&nbsp;2.2 Integração entre Portfólio, Programas e Projetos | |
| **3 GERENCIAMENTO DO ESCOPO** | [`relatorio-final-cap3-gerenciamento-escopo.md`](./relatorio-final-cap3-gerenciamento-escopo.md) |
| &nbsp;&nbsp;3.1 Definição do Escopo e Entregas | |
| &nbsp;&nbsp;3.2 Estrutura Analítica do Projeto (EAP) | |
| **4 GERENCIAMENTO DO CRONOGRAMA** | [`relatorio-final-cap4-cronograma-roadmap.md`](./relatorio-final-cap4-cronograma-roadmap.md) |
| &nbsp;&nbsp;4.1 Planejamento e Sequenciamento das Atividades | |
| &nbsp;&nbsp;4.2 Cronograma e Roadmap do Portfólio | |
| **5 GERENCIAMENTO DOS CUSTOS** | [`relatorio-final-cap5-gerenciamento-custos.md`](./relatorio-final-cap5-gerenciamento-custos.md) |
| &nbsp;&nbsp;5.1 Estimativa e Distribuição dos Custos | |
| &nbsp;&nbsp;5.2 Orçamento Consolidado do Portfólio | |
| **6 GERENCIAMENTO DA QUALIDADE** | *(a consolidar)* |
| &nbsp;&nbsp;6.1 Critérios e Indicadores de Qualidade | |
| &nbsp;&nbsp;6.2 Controle e Garantia da Qualidade | |
| **7 GERENCIAMENTO DOS RECURSOS HUMANOS** | [`relatorio-final-cap7-gerenciamento-recursos-humanos.md`](./relatorio-final-cap7-gerenciamento-recursos-humanos.md) |
| &nbsp;&nbsp;7.1 Recursos e Responsabilidades | |
| &nbsp;&nbsp;7.2 Alocação e Gestão dos Recursos | |
| **8 GERENCIAMENTO DAS COMUNICAÇÕES** | [`relatorio-final-cap8-gerenciamento-comunicacoes.md`](./relatorio-final-cap8-gerenciamento-comunicacoes.md) |
| &nbsp;&nbsp;8.1 Plano de Comunicação | |
| &nbsp;&nbsp;8.2 Comunicação com as Partes Interessadas | |
| **9 GERENCIAMENTO DOS RISCOS** | [`relatorio-final-cap9-gerenciamento-riscos.md`](./relatorio-final-cap9-gerenciamento-riscos.md) |
| &nbsp;&nbsp;9.1 Identificação e Análise dos Riscos | |
| &nbsp;&nbsp;9.2 Respostas e Monitoramento dos Riscos | |
| **10 GERENCIAMENTO DAS AQUISIÇÕES** | [`relatorio-final-cap10-gerenciamento-aquisicoes.md`](./relatorio-final-cap10-gerenciamento-aquisicoes.md) |
| &nbsp;&nbsp;10.1 Necessidades e Estratégia de Aquisições | |
| &nbsp;&nbsp;10.2 Seleção e Gestão de Fornecedores | |
| **11 GERENCIAMENTO DAS PARTES INTERESSADAS** | *(a consolidar)* |
| &nbsp;&nbsp;11.1 Identificação e Análise das Partes Interessadas | |
| &nbsp;&nbsp;11.2 Estratégias de Engajamento e Gestão das Expectativas | |
| **12 RESULTADOS E DISCUSSÃO** | *(a consolidar)* |
| &nbsp;&nbsp;12.1 Portfólio e Programas Propostos | |
| &nbsp;&nbsp;12.2 Análise da Estratégia e Viabilidade | |
| **13 CONSIDERAÇÕES FINAIS** | *(a consolidar)* |
| **REFERÊNCIAS** | |
| **APÊNDICE A — CRONOGRAMA DE ATIVIDADES** | [`cronograma.md`](./cronograma.md) |

> **Observação:** o sumário acima reflete a estrutura completa do template. Os
> capítulos já adaptados estão linkados ao respectivo documento-fonte; os
> capítulos 6, 11, 12 e 13 ainda estão em consolidação por outras issues da
> épica de adaptação ao template de Relatório Final.
