# 1 INTRODUÇÃO

> **Projeto:** FieldOps — Plataforma de Inspeção em Campo
> **Equipe:** 404 Not Found
> **Documento:** Capítulo 1 do Relatório Final, adaptado ao *Template - Relatório Final*
> (seção *Introdução*, itens 1.1, 1.2 e 1.3).
>
> Este capítulo consolida, no formato do template, o contexto, a justificativa, os
> objetivos e a metodologia do FieldOps a partir do Termo de Abertura do Projeto
> (TAP), do `project-context.md` (steering) e dos requisitos do MVP
> ([`fieldops-requisitos-rubrica.md`](../requisitos/fieldops-requisitos-rubrica.md)).
> Mantêm-se a numeração e os títulos do template.

---

## 1.1 Contextualização do Problema

As inspeções técnicas em campo — vistorias de equipamentos, verificação de
conformidade e registro de ocorrências — são, em muitas organizações, executadas
com **formulários impressos, planilhas e mensagens informais**. Esse cenário
descentralizado dificulta a padronização das atividades e o acompanhamento das
informações geradas durante o trabalho em campo.

A organização analisada é uma **prestadora de serviços de inspeção** que atende
diferentes clientes, com equipes de técnicos que se deslocam até os locais dos
equipamentos. Os principais desafios enfrentados são:

- **Perda e inconsistência de dados:** preenchimentos incompletos, fotografias
  sem vínculo com a inspeção correspondente e registros que se perdem entre o
  campo e o escritório.
- **Demora na consolidação dos resultados:** o intervalo entre a execução da
  inspeção e a disponibilização dos resultados aos responsáveis é longo, gerando
  retrabalho.
- **Baixa rastreabilidade:** a ausência de um fluxo único dificulta identificar
  responsáveis, acompanhar alterações e analisar o histórico de cada inspeção.
- **Conectividade instável em campo:** muitas inspeções ocorrem em locais sem
  internet confiável, o que inviabiliza soluções exclusivamente online.

Diante disso, a organização precisa de uma solução digital integrada que conecte
o trabalho do técnico em campo às atividades administrativas de planejamento,
acompanhamento e revisão. A iniciativa, porém, está sujeita a **restrições**
relevantes que obrigam a priorização e a tomada de decisão sobre onde concentrar
recursos:

| Restrição | Descrição |
|---|---|
| **Orçamento** | Teto de investimento de **R$ 204.000,00** autorizado no TAP, usado como linha de base de custos. |
| **Prazo** | **Três meses** de execução a partir de agosto/2026, com demonstração ponta a ponta obrigatória ao final. |
| **Recursos humanos** | Equipe acadêmica enxuta de **9 integrantes**, com acúmulo de papéis (ex.: a gerente também atua no mobile). |
| **Tecnológicas** | Stack obrigatória: mobile em Expo/React Native, API em Java/Spring Boot, dados em PostgreSQL e SQLite, comunicação por API REST. |
| **Dependências** | Backend, web e mobile dependem de um contrato de API comum; atrasos em uma frente impactam a integração e os testes. |
| **Escopo** | Foco no MVP; funcionalidades complementares (roteirização automática, IoT, IA de diagnóstico, assinatura com validade jurídica) ficam fora do escopo inicial. |

Essas restrições tornam a **gestão integrada das frentes** (backend, web, mobile
e infraestrutura) um requisito, e não uma opção: o conjunto de iniciativas precisa
ser planejado de forma coordenada para caber no orçamento, no prazo e na
capacidade da equipe.

---

## 1.2 Justificativa e Objetivos

### Justificativa

A gestão do portfólio de iniciativas do FieldOps é importante porque o projeto
**não é um único entregável monolítico**, mas um conjunto de frentes
interdependentes (API, web, mobile e infraestrutura) que só geram valor quando
integradas em um fluxo completo de inspeção. Com recursos limitados (R$
204.000,00, três meses e nove pessoas), é indispensável **selecionar, priorizar e
organizar** o que será desenvolvido em cada sprint, considerando custos, prazos,
riscos, benefícios e dependências entre as frentes.

A execução atual com formulários impressos e planilhas provoca perda de dados,
retrabalho e baixa rastreabilidade. Centralizar essas atividades em uma
plataforma digital integrada traz benefícios diretos: maior **padronização** das
inspeções, melhor **qualidade** das informações coletadas, **redução de erros e
retrabalho** e maior **rastreabilidade** de todo o processo. O diferencial
estratégico é o funcionamento **offline-first**: o técnico continua trabalhando
mesmo sem conexão, com sincronização posterior confiável que evita perda ou
duplicação de informações.

### Objetivo geral

Desenvolver uma plataforma integrada que apoie todo o ciclo de inspeções técnicas
em campo — do planejamento à revisão final —, tornando o processo mais
padronizado, seguro, rastreável e eficiente, com funcionamento offline e
sincronização confiável, dentro das restrições de orçamento, prazo e equipe
definidas no TAP.

### Objetivos específicos

Os objetivos específicos representam as principais ações de planejamento e
execução conduzidas pela equipe e são mensuráveis em relação ao escopo do MVP:

1. **Digitalizar e padronizar** o processo de inspeção por meio de modelos e
   checklists previamente configurados e versionados.
2. **Planejar, agendar e atribuir** inspeções aos técnicos responsáveis a partir
   de modelos publicados.
3. **Executar inspeções no mobile** com checklist dinâmico, registro de respostas,
   observações, fotografias, leitura de QR Code de equipamentos, localização e não
   conformidades.
4. **Garantir a persistência local** dos dados ainda não sincronizados, inclusive
   após o fechamento do aplicativo (offline-first com SQLite).
5. **Implementar sincronização idempotente** entre mobile e API, evitando perda ou
   duplicação de informações.
6. **Centralizar regras de negócio, autenticação, autorização, persistência e
   auditoria** em uma API REST (Java/Spring Boot).
7. **Disponibilizar à supervisão** o acompanhamento das inspeções e a revisão dos
   resultados (aprovar, reprovar ou solicitar correção).
8. **Estruturar a gestão do projeto** nas áreas do PMBOK (integração, escopo,
   cronograma, custos, qualidade, recursos, comunicações, riscos, aquisições e
   partes interessadas), produzindo os artefatos correspondentes (EAP, cronograma,
   orçamento, RACI, plano de comunicação e registro de riscos).
9. **Demonstrar o fluxo ponta a ponta** do MVP ao final do prazo, comprovando a
   integração entre as frentes.

---

## 1.3 Metodologia Utilizada

A análise e a elaboração da proposta de portfólio seguiram uma abordagem
**ágil e incremental**, organizada em sprints, combinada com as **áreas de
conhecimento do PMBOK** para estruturar a gestão. O trabalho foi conduzido nas
seguintes etapas:

1. **Entendimento e abertura do projeto** — elaboração do Termo de Abertura do
   Projeto (TAP), definindo objetivos, premissas, restrições, orçamento, prazo,
   riscos e partes interessadas.
2. **Definição de escopo e backlog** — delimitação do MVP e organização do
   backlog de produto em *Product Backlog Items* (PBIs), com priorização P0
   (núcleo) e P1 (complementares).
3. **Decomposição das entregas** — construção da **EAP (WBS)**, quebrando o
   produto em seis grandes entregas (gestão, API, web, mobile, infraestrutura e
   qualidade/entrega) e seus pacotes de trabalho.
4. **Planejamento temporal** — montagem do **cronograma** por sprint e área, com
   sequenciamento, dependências e marcos (gráfico de Gantt em Mermaid).
5. **Estimativa e orçamento** — estimativa de custos pela técnica de **três
   pontos (PERT)** para os pacotes de maior incerteza e distribuição da linha de
   base de R$ 204.000,00 em cinco categorias de custo.
6. **Organização dos recursos** — definição do **organograma** e da **matriz
   RACI** (responsabilidades por card), tratando o acúmulo de papéis da equipe
   enxuta.
7. **Comunicação e riscos** — elaboração do **plano de comunicação** (canais,
   frequência e públicos) e do **registro de riscos** com análise de
   probabilidade × impacto e estratégias de resposta.
8. **Execução e verificação** — desenvolvimento incremental com revisão de código
   por *Pull Request*, testes dos fluxos críticos e demonstração ao fim de cada
   sprint.

### Critérios de análise e decisão

As decisões de seleção, priorização e agrupamento das iniciativas consideraram:
**alinhamento estratégico** com os objetivos do TAP, **investimento** dentro do
teto autorizado, **prazo** de três meses, **risco** (com destaque para a
sincronização offline), **benefícios** ao fluxo de inspeção, **dependências**
entre frentes e **disponibilidade de recursos** da equipe.

### Ferramentas e técnicas

| Ferramenta / técnica | Uso no projeto |
|---|---|
| **EAP (WBS)** | Decomposição das entregas e pacotes de trabalho ([`eap.md`](./eap.md)). |
| **Cronograma / Gantt** | Sequenciamento, dependências e marcos ([`cronograma.md`](./cronograma.md)). |
| **Roadmap por sprint** | Visão temporal das entregas P0 e P1. |
| **Estimativa de três pontos (PERT)** | Custos dos pacotes de maior incerteza ([`aula05-orcamento-custos.md`](./aula05-orcamento-custos.md)). |
| **Matriz RACI** | Responsabilidades por card ([`matriz-raci.md`](./matriz-raci.md)). |
| **Organograma** | Estrutura hierárquica e papéis ([`organograma.md`](./organograma.md)). |
| **Plano de comunicação** | Canais, frequência e públicos ([`plano-de-comunicacao.md`](./plano-de-comunicacao.md)). |
| **Registro de riscos** | Probabilidade × impacto e respostas ([`relatorio-final-cap9-gerenciamento-riscos.md`](./relatorio-final-cap9-gerenciamento-riscos.md)). |
| **GitHub Issues / Projects** | Backlog, board (Kanban) e rastreabilidade das tarefas. |
| **Mermaid** | Diagramas (EAP, Gantt, organograma, comunicação) versionados no repositório. |

O grupo organizou o trabalho em um **repositório único** com documentação
versionada em `docs/`, usando o board do GitHub como fonte da verdade das tarefas
e consolidando as informações de gestão nos documentos acima, que alimentam este
relatório final apresentado à diretoria (Cliente/Product Owner) e ao orientador.
