# 11 GERENCIAMENTO DAS PARTES INTERESSADAS

> **Projeto:** FieldOps — Plataforma de Inspeção em Campo
> **Equipe:** 404 Not Found
> **Documento:** Capítulo 11 do Relatório Final, adaptado ao *Template - Relatório Final*
> (seção *Gerenciamento das Partes Interessadas*, itens 11.1 e 11.2).
>
> Não havia um documento dedicado de partes interessadas em `docs/gestao/`. Este
> capítulo **consolida** os insumos existentes:
> [`plano-de-comunicacao.md`](./plano-de-comunicacao.md) (seção 2 — stakeholders,
> interesses e canais), [`organograma.md`](./organograma.md) (papéis e hierarquia)
> e [`matriz-raci.md`](./matriz-raci.md) (responsabilidades por entrega), adicionando
> a análise de influência × interesse e as estratégias de engajamento exigidas pelo
> template.

Neste capítulo são identificadas as partes interessadas do projeto FieldOps —
pessoas, grupos ou organizações que podem afetar ou ser afetados pelo projeto.
Para cada parte interessada analisam-se os **interesses**, as **expectativas** e o
**nível de influência** sobre as decisões do projeto. Em seguida são apresentadas a
**matriz de interesse × influência** e as **estratégias de engajamento** adotadas
para manter as partes alinhadas e comprometidas ao longo do ciclo de vida do projeto.

---

## 11.1 Identificação e Análise das Partes Interessadas

As partes interessadas foram identificadas a partir dos artefatos de gestão do
FieldOps: o organograma, o plano de comunicação e a matriz RACI. Para cada parte
são descritos o papel no projeto, o interesse principal, as expectativas e o nível
de influência.

### Escalas adotadas

- **Interesse:** Baixo / Médio / Alto — mede o quanto a parte se importa com os
  resultados e o andamento do projeto.
- **Influência:** Baixa / Média / Alta — mede a capacidade de a parte alterar
  decisões, escopo, prioridades ou recursos.
- **Engajamento atual:** Desinformado / Resistente / Neutro / Apoiador / Líder —
  classifica o nível de envolvimento observado no projeto.

### Registro de partes interessadas

| ID | Parte interessada | Papel | Interesse principal | Expectativas | Influência | Interesse | Engajamento atual |
|---|---|---|---|---|---|:--:|---|
| **PI-01** | Cliente / Product Owner | Define visão, valida entregas e prioriza o backlog | Receber uma plataforma funcional que substitua formulários em papel e planilhas | Demonstração ponta a ponta do MVP com dados reais; rastreabilidade e qualidade das inspeções | Alta | Alto | Apoiador |
| **PI-02** | Professor / Orientador | Avalia o projeto acadêmico e orienta a equipe | Aplicação integrada dos conteúdos da disciplina (gestão, backend, web, mobile, qualidade) | Artefatos de gestão completos; código funcional; documentação técnica e relatório final | Alta | Alto | Apoiador |
| **PI-03** | Natália — Gerente de Projeto + Líder Mobile | Coordena o projeto e desenvolve o aplicativo mobile | Entrega do MVP dentro do prazo; equipe alinhada; qualidade nas três frentes | Visibilidade sobre riscos e impedimentos; backlog priorizado; cerimônias de sprint produtivas | Alta | Alto | Líder |
| **PI-04** | Marcela — Líder Backend + Nuvem | Conduz a API REST, a infraestrutura e aprova entregas de backend | Robustez da API; sincronização offline confiável; ambiente Docker funcional | Contratos de API estáveis; clareza nos requisitos de integração; autonomia técnica | Alta | Alto | Líder |
| **PI-05** | Júlia — Líder Web + Nuvem | Conduz a interface administrativa e apoia a infraestrutura | Interface web de qualidade; integração confiável com a API | Requisitos claros de UX; contratos de API atualizados via OpenAPI; deploy da aplicação web | Média | Alto | Líder |
| **PI-06** | Equipe de desenvolvimento (Lucas, Andressa, Carol, Ian, Rodrigo, Felipe) | Executa o desenvolvimento nas frentes Backend, Web e Mobile | Tarefas bem definidas; ambiente configurado; feedback rápido nos PRs | Cards com critérios de aceite claros; autonomia técnica dentro da área; revisão de código ágil | Média | Médio | Apoiador |
| **PI-07** | Usuário final — Técnico de campo (persona Carlos) | Opera o aplicativo mobile para executar inspeções | Aplicativo simples, rápido e funcional mesmo sem internet | Checklist dinâmico; salvamento automático; feedback claro de sincronização; botões grandes e toque preciso | Baixa | Alto | Neutro |
| **PI-08** | Usuário final — Supervisora (persona Marina) | Usa a interface administrativa para planejar e revisar inspeções | Interface administrativa organizada para planejar, acompanhar e revisar inspeções | Painel de acompanhamento; filtros eficientes; visualização clara de evidências e NCs; aprovação/reprovação simples | Baixa | Alto | Neutro |
| **PI-09** | Usuário final — Administradora do sistema (persona Ana) | Gerencia cadastros, usuários e permissões | Cadastros centralizados, fáceis de manter e sem necessidade de acesso direto ao banco | Formulários validados; inativação em vez de exclusão destrutiva; mensagens de erro claras | Baixa | Médio | Neutro |

> **Observação sobre PI-07, PI-08 e PI-09:** no contexto acadêmico do FieldOps, os
> usuários finais são representados pelas **personas** descritas no documento de
> requisitos (`docs/notion.md`, seção 4). Eles não participam diretamente das
> cerimônias do projeto, mas seus interesses e expectativas direcionam as decisões de
> produto e critérios de aceite dos PBIs — por isso sua influência sobre o escopo é
> classificada como **Alta** (no caso de Carlos/Marina) e **Média** (Ana).

---

## 11.2 Estratégias de Engajamento e Gestão das Expectativas

### Matriz de interesse × influência

A matriz posiciona cada parte interessada conforme seus níveis de influência
(eixo vertical) e interesse (eixo horizontal), indicando a estratégia de gestão
recomendada para cada quadrante.

```
                    INTERESSE
                Baixo        Alto
             ┌────────────┬────────────┐
Alta         │  MANTER    │  GERENCIAR │
Influência   │ SATISFEITO │DE PERTO    │
             │ (Monitorar)│            │
             ├────────────┼────────────┤
Baixa        │  MONITORAR │  MANTER    │
Influência   │            │INFORMADO   │
             └────────────┴────────────┘
```

| Quadrante | Estratégia | Partes interessadas |
|---|---|---|
| **Alta influência / Alto interesse** — Gerenciar de perto | Comunicação frequente, envolvimento nas decisões, feedback contínuo | PI-01 (Cliente/PO), PI-02 (Professor), PI-03 (GP/Natália), PI-04 (Marcela), PI-05 (Júlia) |
| **Alta influência / Baixo interesse** — Manter satisfeito | Comunicar resultados de forma objetiva; evitar sobrecarga com detalhes operacionais | *(não aplicável — nenhuma parte tem alta influência e baixo interesse no FieldOps)* |
| **Baixa influência / Alto interesse** — Manter informado | Garantir visibilidade do progresso; coletar feedback de usabilidade | PI-06 (Equipe de desenvolvimento), PI-07 (Carlos), PI-08 (Marina) |
| **Baixa influência / Baixo interesse** — Monitorar | Acompanhar sem sobrecarga; comunicar apenas marcos relevantes | PI-09 (Ana) |

### Diagrama da matriz (Mermaid)

```mermaid
quadrantChart
    title Matriz Influência × Interesse — Partes Interessadas FieldOps
    x-axis Baixo Interesse --> Alto Interesse
    y-axis Baixa Influência --> Alta Influência
    quadrant-1 Gerenciar de perto
    quadrant-2 Manter satisfeito
    quadrant-3 Monitorar
    quadrant-4 Manter informado
    PI-01 Cliente/PO: [0.88, 0.90]
    PI-02 Professor: [0.82, 0.88]
    PI-03 GP Natalia: [0.90, 0.95]
    PI-04 Marcela: [0.85, 0.85]
    PI-05 Julia: [0.80, 0.68]
    PI-06 Equipe Dev: [0.60, 0.45]
    PI-07 Carlos (Tecnico): [0.75, 0.30]
    PI-08 Marina (Supervisora): [0.78, 0.28]
    PI-09 Ana (Admin): [0.45, 0.35]
```

### Estratégias de engajamento por parte interessada

| ID | Parte interessada | Engajamento desejado | Estratégia principal | Ações concretas |
|---|---|---|---|---|
| **PI-01** | Cliente / Product Owner | Líder | Gerenciar de perto; manter alinhamento contínuo sobre valor entregue | Relatório de status quinzenal por e-mail; demonstração ao fim de cada sprint; validação dos critérios de aceite do MVP antes da entrega final |
| **PI-02** | Professor / Orientador | Apoiador | Gerenciar de perto; evidenciar aplicação integrada dos conteúdos | Repositório público e versionado com artefatos de gestão; relatório final com todos os capítulos; demonstração ponta a ponta do MVP na entrega |
| **PI-03** | Natália (GP) | Líder | Manter liderança ativa; remover impedimentos; garantir visibilidade | Daily de alinhamento; cerimônias Scrum (planning/review/retro); acompanhamento do board no GitHub Projects |
| **PI-04** | Marcela (Backend) | Líder | Manter autonomia técnica e canal de comunicação direto com Web e Mobile | Contrato OpenAPI atualizado a cada mudança de API; alinhamento técnico semanal entre líderes; aprovação formal das entregas de backend |
| **PI-05** | Júlia (Web) | Líder | Garantir requisitos claros e estabilidade do contrato de API | Reuniões de alinhamento técnico semanal; OpenAPI como fonte única de contrato; revisão de PRs cruzada entre Web e Backend |
| **PI-06** | Equipe de desenvolvimento | Apoiador | Manter informada e engajada com tarefas claras e feedback ágil | Cards com critérios de aceite no GitHub Issues; revisão de PR em até 24 h; daily de impedimentos via WhatsApp; retrospectiva para melhoria contínua |
| **PI-07** | Carlos — Técnico de campo | Apoiador | Capturar expectativas de usabilidade e incorporar nos critérios de aceite | Critérios de aceite dos PBIs mobile orientados pela persona; testes manuais da experiência de campo (campo, offline, toque); feedback incorporado no backlog |
| **PI-08** | Marina — Supervisora | Apoiador | Capturar expectativas do fluxo de revisão e incorporar nos critérios de aceite | Critérios de aceite dos PBIs web orientados pela persona; validação do fluxo aprovação/reprovação; demonstração do dashboard e revisão de NCs ao PO/professor |
| **PI-09** | Ana — Administradora | Neutro → Apoiador | Manter informada sobre funcionalidades de cadastro; coletar feedback de UX administrativo | Critérios de aceite dos PBIs de CRUD orientados pela persona; mensagens de erro claras; fluxo de inativação sem exclusão destrutiva validado |

### Plano de monitoramento do engajamento

- **Revisão de sprint (demo):** oportunidade principal de engajar PI-01 e PI-02;
  cada demo deve mostrar progresso real e coletar feedback explícito.
- **Retrospectiva:** avalia o engajamento interno da equipe (PI-03 a PI-06);
  ações de melhoria registradas e acompanhadas na sprint seguinte.
- **Board do GitHub Projects:** visibilidade contínua do andamento para toda a
  equipe (PI-06) e para os líderes (PI-03 a PI-05).
- **Personas como proxy dos usuários finais (PI-07 a PI-09):** na ausência de
  usuários reais participando das cerimônias, os critérios de aceite dos PBIs
  traduzem as necessidades das personas para decisões concretas de produto.
- **Escalada de impedimentos:** qualquer parte interessada que sinalize risco ou
  bloqueio segue o fluxo dev → líder de área → Gerente de Projeto → Cliente/PO,
  conforme definido no plano de comunicação.
