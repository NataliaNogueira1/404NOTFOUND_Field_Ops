# 8 GERENCIAMENTO DAS COMUNICAÇÕES

> **Projeto:** FieldOps — Plataforma de Inspeção em Campo
> **Equipe:** 404 Not Found
> **Documento:** Capítulo 8 do Relatório Final, adaptado ao *Template - Relatório Final*
> (seção *Gerenciamento das Comunicações*, itens 8.1 e 8.2).
>
> Este capítulo reaproveita o
> [`plano-de-comunicacao.md`](./plano-de-comunicacao.md), encaixando-o na
> estrutura do template. A matriz de comunicação, os canais e os stakeholders
> não são recriados; o que muda é a organização nos subitens 8.1 e 8.2.

Neste capítulo é apresentado como as informações do projeto FieldOps são
comunicadas aos envolvidos: **quais** informações precisam ser compartilhadas,
**quem** deve recebê-las, por **quais canais** e com **qual frequência**. O
plano considera os diferentes públicos — Cliente/Product Owner, Gerente de
Projeto, líderes de área, equipe de desenvolvimento e orientador —, adequando o
tipo e o nível de informação às necessidades de cada um.

---

## 8.1 Plano de Comunicação

O plano de comunicação define, para cada tipo de comunicação, a frequência, o
canal (síncrono ou assíncrono), o público, o responsável (proprietário), o
formato e o momento em que ocorre.

| Descrição da comunicação | Frequência | Canal (síncrono/assíncrono) | Público | Proprietário | Formato | Momento |
|---|---|---|---|---|---|---|
| **Daily / alinhamento rápido** | Diária | WhatsApp (assíncrono) / chamada (síncrono) | Equipe de desenvolvimento | Natália (GP) | Feito / a fazer / impedimentos | Início do dia |
| **Planejamento de Sprint** | A cada sprint | Google Meet (síncrono) | Toda a equipe | Natália (GP) | Backlog e metas da sprint | Início da sprint |
| **Revisão de Sprint (demo)** | A cada sprint | Google Meet (síncrono) | Equipe + Cliente/PO + Orientador | Natália (GP) | Demonstração das entregas | Fim da sprint |
| **Retrospectiva** | A cada sprint | Google Meet (síncrono) | Equipe de desenvolvimento | Natália (GP) | O que manter / melhorar | Fim da sprint |
| **Coordenação técnica entre áreas** | Semanal | Google Meet / GitHub | Líderes (Backend, Web, Mobile, Nuvem) | Líderes de área | Alinhamento de contratos/integração | Meio da semana |
| **Revisão de código (Pull Request)** | Contínua (a cada PR) | GitHub — Pull Requests (assíncrono) | Área responsável + revisores | Autor do PR | Descrição do PR + comentários | A cada entrega de código |
| **Acompanhamento do backlog / board** | Contínua | GitHub Issues / Projects (assíncrono) | Toda a equipe | Natália (GP) | Cards (PBIs) com status | Ao longo da sprint |
| **Contrato de API (OpenAPI/Swagger)** | A cada mudança | GitHub + Swagger UI (assíncrono) | Backend, Web, Mobile | Marcela (Líder Backend) | Documentação OpenAPI publicada | A cada alteração de endpoint |
| **Relatório de status ao Cliente/PO** | Quinzenal / por sprint | E-mail (assíncrono) | Cliente / Product Owner | Natália (GP) | Progresso, riscos e próximos passos | Fim de cada sprint |
| **Comunicação de riscos e impedimentos** | Conforme necessário | WhatsApp / Google Meet (síncrono) | GP + Líderes + envolvidos | Quem identifica o risco | Alerta + plano de ação | Ao surgir o risco |
| **Documentação do projeto (docs/)** | Conforme necessário | Repositório GitHub (assíncrono) | Toda a equipe + Orientador | Autor do documento | Markdown versionado | A cada atualização |
| **Entrega final / apresentação do MVP** | Uma vez (marco) | Presencial / Meet (síncrono) | Cliente/PO + Orientador + Equipe | Natália (GP) | Apresentação + demo ponta a ponta | Encerramento do projeto |

### Matriz de canais

| Canal | Tipo | Uso principal |
|---|---|---|
| **WhatsApp** | Assíncrono / Síncrono | Comunicação rápida do dia a dia, alertas e impedimentos |
| **Google Meet** | Síncrono | Cerimônias Scrum (planning, review, retro) e alinhamentos |
| **GitHub (Issues/Projects)** | Assíncrono | Backlog, acompanhamento de cards (PBIs) e status |
| **GitHub (Pull Requests)** | Assíncrono | Revisão de código e integração entre áreas |
| **Swagger UI / OpenAPI** | Assíncrono | Contrato da API compartilhado entre Backend, Web e Mobile |
| **E-mail** | Assíncrono | Relatórios de status formais ao Cliente/PO e Orientador |
| **Repositório `docs/`** | Assíncrono | Documentação versionada do projeto |

> O fluxo de comunicação completo em formato gráfico (Mermaid) está em
> [`plano-de-comunicacao.md`](./plano-de-comunicacao.md).

---

## 8.2 Comunicação com as Partes Interessadas

A comunicação é adequada ao tipo e ao nível de informação que cada público
precisa. O quadro abaixo relaciona cada parte interessada ao seu interesse
principal, canal preferencial, frequência e nível de detalhe.

| Parte interessada | Interesse principal | Canal preferencial | Frequência | Nível de informação |
|---|---|---|---|---|
| **Cliente / Product Owner** | Valor entregue, andamento do MVP | Reunião (demo) + e-mail | Por sprint / quinzenal | Executivo: progresso, riscos e próximos passos, sem detalhe técnico |
| **Professor / Orientador** | Evolução e entregas acadêmicas | Reunião + repositório | Por sprint / marcos | Evolução das entregas e artefatos de gestão/documentação |
| **Gerente de Projeto (Natália)** | Andamento geral, riscos, impedimentos | Todos | Contínua | Visão completa: backlog, riscos, integração entre frentes |
| **Líderes de área (Marcela, Júlia, Natália)** | Coordenação técnica entre frentes | Google Meet + GitHub | Semanal + contínua | Técnico de coordenação: contratos, dependências e integração |
| **Equipe de desenvolvimento** | Tarefas, dúvidas técnicas, integração | WhatsApp + GitHub | Diária / contínua | Operacional: cards, PRs e dúvidas técnicas do dia a dia |

### Matriz de interesse × influência

| Parte interessada | Interesse | Influência | Estratégia de engajamento |
|---|:--:|:--:|---|
| Cliente / Product Owner | Alto | Alta | **Gerenciar de perto:** demos por sprint e relatório de status; administrar expectativas e manter o apoio. |
| Professor / Orientador | Alto | Alta | **Gerenciar de perto:** apresentar evolução e entregas nos marcos; repositório sempre atualizado. |
| Líderes de área | Alto | Média/Alta | **Manter envolvido:** coordenação técnica semanal e decisões registradas em PRs/`docs/`. |
| Equipe de desenvolvimento | Alto | Média | **Manter informado e ativo:** daily, board e WhatsApp para fluxo rápido. |

### Estratégias de comunicação por público

- **Diretoria / Cliente / PO:** comunicação executiva e orientada a valor —
  demonstração ao fim de cada sprint (síncrono) e relatório de status quinzenal
  por e-mail (assíncrono), focando progresso, riscos e próximos passos, sem
  ruído técnico. Objetivo: manter o apoio e alinhar expectativas.
- **Orientador:** evolução acadêmica e artefatos — acompanhada via repositório
  (`docs/` versionado) e nas revisões de sprint/marcos.
- **Líderes de área:** coordenação técnica — alinhamento semanal de contratos e
  integração (API ↔ Web ↔ Mobile), com o contrato de API comunicado via
  OpenAPI/Swagger antes de impactar as frentes consumidoras.
- **Equipe de desenvolvimento:** comunicação operacional e de alta frequência —
  daily, board (Issues/Projects) e Pull Requests, com WhatsApp para dúvidas e
  alertas rápidos.

### Diretrizes de relacionamento

- **Fonte única da verdade:** backlog e status oficiais no GitHub
  (Issues/Projects); decisões técnicas registradas em PRs e na pasta `docs/`.
- **Contratos primeiro:** mudanças de API são comunicadas via OpenAPI/Swagger
  antes de impactar Web e Mobile, reduzindo retrabalho e conflito entre frentes.
- **Escalada de impedimentos:** dev → líder de área → Gerente de Projeto →
  Cliente/PO, quando necessário.
- **Transparência com o cliente:** relatórios de status e demonstrações a cada
  sprint asseguram que as necessidades das partes interessadas sejam atendidas
  ao longo de todo o ciclo de vida do projeto.

> **Cobertura de públicos e canais:** o plano contempla públicos distintos
> (Cliente/PO, orientador, GP, líderes e equipe) e múltiplos canais (WhatsApp,
> Google Meet, GitHub Issues/PR, Swagger/OpenAPI, e-mail e `docs/`), atendendo
> ao critério de aceite.
