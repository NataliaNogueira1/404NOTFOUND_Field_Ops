# 7 GERENCIAMENTO DOS RECURSOS HUMANOS

> **Projeto:** FieldOps — Plataforma de Inspeção em Campo
> **Equipe:** 404 Not Found
> **Documento:** Capítulo 7 do Relatório Final, adaptado ao *Template - Relatório Final*
> (seção *Gerenciamento dos Recursos Humanos*, itens 7.1 e 7.2).
>
> Este capítulo consolida dois artefatos de gestão já existentes —
> [`organograma.md`](./organograma.md) (estrutura hierárquica e papéis) e
> [`matriz-raci.md`](./matriz-raci.md) (responsabilidades RACI por área) —
> encaixando-os na estrutura do template. Os dados não são recriados; o que muda
> é a organização nos subitens 7.1 e 7.2.

Neste capítulo são apresentados os recursos necessários para a execução do
projeto FieldOps, com destaque para os **recursos humanos** disponibilizados
pela organização. São identificados os profissionais envolvidos, suas
responsabilidades e quais frentes de trabalho necessitam de cada recurso.
Também são analisadas a disponibilidade e as limitações desses recursos, com as
soluções adotadas para os conflitos de alocação.

O projeto é conduzido por uma equipe de **9 integrantes**, organizada em quatro
frentes — **Gestão, Backend, Web e Mobile** (com Nuvem/Infraestrutura apoiada
por Backend e Web) — sob a coordenação da Gerente de Projeto, Natália Nogueira.

---

## 7.1 Recursos e Responsabilidades

Os recursos humanos do projeto e seus papéis seguem a estrutura hierárquica do
organograma. Cada integrante está associado a uma frente de trabalho, e alguns
acumulam papéis em razão da equipe enxuta de um projeto acadêmico.

### Equipe e papéis

| Integrante | Papel no projeto | Frente |
|---|---|---|
| **Natália** | Gerente de Projeto + Líder Mobile | Gestão / Mobile |
| **Marcela** | Líder de Backend + Nuvem | Backend / Nuvem |
| **Lucas** | Desenvolvedor Backend | Backend |
| **Júlia** | Líder Web + Nuvem | Web / Nuvem |
| **Andressa** | Desenvolvedora Web | Web |
| **Carol** | Desenvolvedora Web | Web |
| **Ian** | Desenvolvedor Web | Web |
| **Rodrigo** | Desenvolvedor Mobile | Mobile |
| **Felipe (Cutiur)** | Desenvolvedor Mobile | Mobile |

### Estrutura hierárquica

```text
Product Owner / Cliente (Stakeholders)
└── Natália — Gerente de Projeto
    ├── Backend
    │   ├── Marcela (Líder Backend + Nuvem)
    │   └── Lucas (Dev Backend)
    ├── Web
    │   ├── Júlia (Líder Web + Nuvem)
    │   ├── Andressa (Dev Web)
    │   ├── Carol (Dev Web)
    │   └── Ian (Dev Web)
    └── Mobile
        ├── Natália (Líder Mobile)
        ├── Rodrigo (Dev Mobile)
        └── Felipe / Cutiur (Dev Mobile)
```

> O organograma completo em formato gráfico (Mermaid) está em
> [`organograma.md`](./organograma.md).

### Responsabilidades por nível

- **Product Owner / Cliente (Stakeholders):** define a visão do produto, as
  prioridades de negócio e valida as entregas de valor (aprovação final do MVP).
- **Gerente de Projeto — Natália:** responsável pela gestão e planejamento (EAP,
  backlog, cronograma), pela coordenação entre as três frentes de
  desenvolvimento e pela comunicação com os stakeholders; acompanha desempenho,
  remove impedimentos e conduz as cerimônias.
- **Líderes de área:**
  - **Marcela — Líder Backend + Nuvem:** conduz a API REST (Java + Spring Boot),
    autenticação, regras de negócio, persistência e sincronização, e apoia a
    infraestrutura/nuvem; é a aprovadora das entregas de backend.
  - **Júlia — Líder Web + Nuvem:** conduz a interface administrativa
    (React/Vite) e apoia a infraestrutura/nuvem.
  - **Natália — Líder Mobile:** conduz o aplicativo (Expo/React Native),
    acumulando com a gerência do projeto.
- **Desenvolvedores:** Backend — Lucas; Web — Andressa, Carol e Ian; Mobile —
  Rodrigo e Felipe (Cutiur).

---

## 7.2 Alocação e Gestão dos Recursos

A alocação dos recursos aos pacotes de trabalho é formalizada pela **Matriz de
Responsabilidades (RACI)**, que associa cada card/PBI aos papéis **R**
(Responsável, executa), **A** (Aprovador, presta contas — único por atividade),
**C** (Consultado) e **I** (Informado). A matriz completa cobre 48 cards de
todas as áreas; o quadro abaixo resume a alocação por frente.

### Responsabilidade por frente de trabalho

| Frente | Aprovador (A) | Responsáveis pela execução (R) | Observação de alocação |
|---|---|---|---|
| **Gestão / Planejamento** | Natália (GP) | Natália | Coordena as três frentes e a entrega. |
| **Backend (API REST)** | Marcela (Líder Backend) | Lucas, Marcela | Marcela acumula Nuvem; é consultada pelas frentes que consomem a API. |
| **Web (admin)** | Júlia (Líder Web) | Júlia, Andressa, Carol, Ian | Maior equipe de execução; consome contratos do Backend. |
| **Mobile (app)** | Natália (Líder Mobile) | Rodrigo, Felipe (Cutiur) | Natália aprova acumulando a gerência. |
| **Nuvem / Entrega** | Marcela / Natália | Marcela, Júlia | Infraestrutura apoiada por Backend e Web. |

> A matriz RACI detalhada (por card/PBI) e o diagrama de responsabilidades por
> área estão em [`matriz-raci.md`](./matriz-raci.md).

### Regras de atribuição adotadas

- **Um único Aprovador (A) por atividade:** a aprovação cabe ao **líder da
  área** do card — Marcela aprova Backend e Nuvem, Júlia aprova Web e Natália
  (GP + Líder Mobile) aprova Mobile e Gestão/Entrega. Em cards de execução
  própria, o líder acumula A/R.
- **Responsável (R):** sempre o(s) desenvolvedor(es) da área que executa(m) o
  card.
- **Consultado (C):** tipicamente a área que fornece o contrato/dependência
  (ex.: Backend é consultado por Web/Mobile em cards que consomem a API).
- **Informado (I):** as demais áreas que precisam conhecer o resultado sem atuar
  diretamente.

### Disponibilidade, limitações e conflitos

- **Acúmulo de papéis (limitação principal):** por ser um projeto acadêmico com
  equipe enxuta, há sobreposição de funções — Natália é Gerente e Líder Mobile;
  Marcela e Júlia acumulam Nuvem com suas frentes de desenvolvimento. Isso
  concentra responsabilidade de aprovação em poucas pessoas e reduz a folga de
  disponibilidade das lideranças.
- **Dependências entre frentes:** Web e Mobile dependem dos contratos entregues
  pelo Backend (API). Um atraso no Backend pode ociosar as frentes consumidoras.
- **Soluções de gestão adotadas:**
  - **Redistribuição de profissionais:** a frente Web, com quatro
    desenvolvedores, absorve picos de demanda sem sobrecarregar uma única
    pessoa; cards que cruzam frentes (ex.: *Aprovar inspeção*, *CRUD de
    usuários*) têm **R** tanto no Backend (endpoint) quanto no Web (tela),
    dividindo o esforço.
  - **Sequenciamento por dependência:** os contratos de API (OpenAPI/dados
    simulados) são priorizados para destravar Web e Mobile cedo, reduzindo
    ociosidade.
  - **Priorização pela gerência:** quando há conflito de alocação das
    lideranças, a Gerente de Projeto repriorizia os cards conforme o cronograma,
    em vez de recorrer a contratação externa (fora do escopo acadêmico).

> **Cobertura das frentes:** backend, web, mobile e gestão estão representados
> tanto em 7.1 (papéis) quanto em 7.2 (alocação RACI), atendendo ao critério de
> aceite de representar as responsabilidades por frente.
