# 10 GERENCIAMENTO DAS AQUISIÇÕES

> **Projeto:** FieldOps — Plataforma de Inspeção em Campo
> **Equipe:** 404 Not Found
> **Documento:** Capítulo 10 do Relatório Final, adaptado ao *Template - Relatório Final*
> (seção *Gerenciamento das Aquisições*, itens 10.1 e 10.2).
>
> Não existe um documento dedicado de aquisições em `docs/gestao/`. Conforme
> previsto na issue, este capítulo **cria + adapta** o conteúdo, derivando as
> necessidades de aquisição das categorias **B (Infraestrutura e Nuvem)**,
> **C (Ferramentas e Licenças)** e **D (Equipamentos e Materiais)** do orçamento
> consolidado em [`aula05-orcamento-custos.md`](./aula05-orcamento-custos.md). Os
> valores e responsáveis mantêm-se coerentes com o orçamento; o que muda é a
> organização nos subitens 10.1 e 10.2.

Neste capítulo são identificados os produtos, serviços, equipamentos e recursos
externos necessários à execução do FieldOps, distinguindo o que é atendido
internamente (pela própria equipe) do que exige contratação de fornecedores ou
aquisição externa. Em seguida, apresenta-se a estratégia e os critérios de
seleção e gestão de fornecedores.

---

## 10.1 Necessidades e Estratégia de Aquisições

### Interno x contratado

- **Atendido internamente (sem aquisição):** todo o desenvolvimento — backend,
  web, mobile, DevOps, design, QA, gestão e documentação — é realizado pela
  própria equipe (categoria A — Recursos Humanos do orçamento). Não há contratação
  de mão de obra externa; conflitos de recursos são resolvidos por
  repriorização da gerência, não por contratação (ver Capítulos 7 e 9).
- **Contratado / adquirido externamente:** serviços de nuvem, ferramentas/licenças
  de software e equipamentos/materiais, que correspondem às categorias B, C e D do
  orçamento.

### Necessidades de aquisição por categoria

#### Categoria B — Infraestrutura e Nuvem (serviços externos)

| Item | Natureza | Qtd | Unid | Total (R$) | Responsável |
|---|---|---:|---|---:|---|
| Servidor de aplicação (hospedagem API) | Serviço (assinatura) | 2 | mês | 360,00 | Júlia |
| Banco de dados PostgreSQL gerenciado | Serviço (assinatura) | 2 | mês | 300,00 | Marcela |
| Armazenamento de objetos (evidências/fotos) | Serviço (assinatura) | 2 | mês | 180,00 | Júlia |
| Domínio e certificado SSL | Serviço (anual) | 1 | ano | 120,00 | Júlia |
| Serviço de notificações push | Serviço (assinatura) | 2 | mês | 120,00 | Marcela |
| Pipeline CI/CD (build e deploy) | Serviço (assinatura) | 2 | mês | 160,00 | Júlia |
| Ambiente de homologação/testes | Serviço (assinatura) | 2 | mês | 240,00 | Marcela |
| **Subtotal B** | | | | **1.480,00** | |

#### Categoria C — Ferramentas e Licenças de Software

| Item | Natureza | Qtd | Unid | Total (R$) | Responsável |
|---|---|---:|---|---:|---|
| Licença Figma (design/protótipo) | Licença (assinatura) | 2 | mês | 150,00 | Andressa |
| Conta de distribuição Google Play (build APK) | Licença (única) | 1 | única | 135,00 | Rodrigo |
| Ferramenta de gestão de projeto (board/backlog) | Licença (assinatura) | 2 | mês | 100,00 | Natália |
| IDEs e plugins premium | Licença | 9 | licença | 360,00 | Equipe completa |
| Ferramenta de testes de API (ex.: Postman) | Licença (assinatura) | 2 | mês | 120,00 | Lucas |
| **Subtotal C** | | | | **865,00** | |

#### Categoria D — Equipamentos e Materiais

| Item | Natureza | Qtd | Unid | Total (R$) | Responsável |
|---|---|---:|---|---:|---|
| Dispositivo Android para testes de campo | Equipamento | 2 | un | 1.800,00 | Equipe Mobile |
| Impressão de etiquetas QR Code para equipamentos | Material | 100 | un | 120,00 | Natália |
| Material de transporte para visita de campo (demo) | Serviço/material | 2 | visita | 100,00 | Equipe |
| Impressão de documentação e material de apresentação | Material | 1 | pacote | 80,00 | Natália |
| **Subtotal D** | | | | **2.100,00** | |

### Estratégia de aquisição

| Diretriz | Descrição |
|---|---|
| **Preferência por serviços gerenciados por assinatura** | Nuvem (hospedagem, PostgreSQL gerenciado, storage, CI/CD, homologação) contratada por mês, dimensionada para os ~2 meses de execução, evitando investimento em hardware de servidor. |
| **Licenças mínimas e essenciais** | Apenas ferramentas realmente necessárias ao fluxo (design, distribuição de app, board, testes de API, IDEs). Preferência por opções com planos gratuitos/educacionais quando equivalentes. |
| **Equipamento obrigatório priorizado** | Dispositivos Android são obrigatórios para validação do mobile (premissa do TAP); por isso compõem a maior parte da categoria D. |
| **Aderência ao orçamento** | Total de aquisições externas = B + C + D = **R$ 4.445,00** (≈ 2,2% do orçamento de R$ 204.000,00), dentro da linha de base de custos. |
| **Sem contratação de mão de obra** | O desenvolvimento é interno; não há aquisição de serviços de terceiros para codificação. |

> **Total de aquisições externas:** R$ 1.480,00 (B) + R$ 865,00 (C) + R$ 2.100,00
> (D) = **R$ 4.445,00**, coerente com o orçamento consolidado (Capítulo 5).

---

## 10.2 Seleção e Gestão de Fornecedores

Como as aquisições são de baixo valor e majoritariamente serviços por assinatura,
a seleção prioriza **custo-benefício, confiabilidade e baixo risco de lock-in**,
sem necessidade de concorrência formal.

### Critérios de seleção

| Critério | Peso | O que avalia |
|---|:--:|---|
| **Custo** | Alto | Preço mensal/total compatível com a linha de base; preferência por planos gratuitos/educacionais equivalentes. |
| **Prazo / disponibilidade** | Alto | Provisionamento rápido (self-service) para não bloquear o cronograma apertado de 3 meses. |
| **Qualidade / confiabilidade** | Alto | Estabilidade do serviço (uptime), maturidade e suporte, especialmente para banco e storage de evidências. |
| **Capacidade técnica / compatibilidade** | Médio | Aderência à stack (PostgreSQL gerenciado, storage S3-compatível, build Android, OpenAPI). |
| **Risco (lock-in e dados)** | Médio | Preferência por padrões abertos (S3-compatível, PostgreSQL, OpenAPI) que permitam troca de fornecedor sem reescrita. |

### Tipos de fornecedor e critérios aplicados

| Tipo de fornecedor | Exemplos de aquisição | Critério decisivo |
|---|---|---|
| **Provedor de nuvem / PaaS** | Hospedagem da API, PostgreSQL gerenciado, storage, CI/CD, homologação | Confiabilidade + custo mensal + padrão aberto (anti lock-in). |
| **Plataforma de distribuição de app** | Conta Google Play (APK) | Obrigatória para publicar no Android (premissa do TAP). |
| **Ferramentas de produtividade** | Figma, board de projeto, Postman, IDEs | Custo e produtividade; planos educacionais quando disponíveis. |
| **Fornecedor de equipamento/material** | Dispositivo Android, etiquetas QR, impressão | Preço e disponibilidade local; equipamento obrigatório para validação de campo. |

### Gestão e acompanhamento dos fornecedores

- **Responsáveis definidos:** cada item de aquisição tem um responsável nomeado
  (coluna "Responsável" em 10.1), que cuida da contratação, do pagamento e do
  acompanhamento do serviço.
- **Monitoramento de custo:** as assinaturas são acompanhadas junto ao controle de
  custos (processo *7.4 — Controlar os custos*), comparando o previsto com o
  realizado ao longo das sprints, de modo a não ultrapassar o teto do TAP.
- **Revisão de continuidade:** serviços contratados por mês são reavaliados ao fim
  de cada sprint; o que não for mais necessário é descontinuado para preservar o
  orçamento.
- **Redução de risco de fornecedor:** o uso de padrões abertos (PostgreSQL,
  storage S3-compatível, OpenAPI) mantém a capacidade de trocar de fornecedor sem
  retrabalho significativo, o que também endereça o risco de dependência externa.

> **Coerência com o orçamento:** as necessidades e os critérios deste capítulo
> derivam diretamente das categorias B, C e D de
> [`aula05-orcamento-custos.md`](./aula05-orcamento-custos.md), somando
> R$ 4.445,00 em aquisições externas, integralmente dentro da linha de base de
> R$ 204.000,00 autorizada no TAP.
