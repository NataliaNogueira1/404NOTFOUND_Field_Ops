# 5 GERENCIAMENTO DOS CUSTOS

> **Projeto:** FieldOps — Plataforma de Inspeção em Campo
> **Equipe:** 404 Not Found
> **Documento:** Capítulo 5 do Relatório Final, adaptado ao *Template - Relatório Final*
> (seção *Gerenciamento dos Custos*, itens 5.1 e 5.2).
>
> Este capítulo reaproveita o orçamento consolidado em
> [`aula05-orcamento-custos.md`](./aula05-orcamento-custos.md), encaixando-o na
> estrutura do template. O método, os valores e o total permanecem os mesmos; o
> que muda é a organização nos subitens 5.1 e 5.2.

Neste capítulo são apresentados os investimentos necessários para a execução do
projeto FieldOps e como os custos foram considerados na tomada de decisão. Os
valores previstos para cada iniciativa (frente de trabalho) são comparados com o
orçamento máximo disponibilizado pela organização — a **estimativa de
investimentos de R$ 204.000,00 autorizada no Termo de Abertura do Projeto
(TAP)**, que atua como teto de investimento e linha de base de custos.

A distribuição consolidada do orçamento demonstra quanto é destinado a cada
frente e qual é o investimento total, evidenciando que a estratégia proposta é
financeiramente compatível com os recursos disponíveis.

| Parâmetro do TAP | Valor |
|---|---|
| Estimativa de investimentos (teto autorizado) | **R$ 204.000,00** |
| Base de esforço | 9 integrantes × ~3.400 horas de trabalho |
| Estimativa de prazo | 3 meses, a partir de agosto/2026 |
| Patrocinador (sponsor) | Fundação Toyota do Brasil |
| Gerente do projeto | Natália Nogueira |

---

## 5.1 Estimativa e Distribuição dos Custos

A estimativa de custos partiu da linha de base autorizada no TAP
(R$ 204.000,00) e foi distribuída entre as iniciativas (frentes de trabalho) do
projeto. As premissas de custeio adotadas foram:

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

### Método de estimativa — Três pontos (PERT)

Para os principais pacotes de trabalho utilizou-se a **estimativa de três
pontos (PERT)**, combinando os cenários otimista (cO), mais provável (cM) e
pessimista (cP) para obter o custo esperado (cE):

```
cE = (cO + 4·cM + cP) / 6
```

| Pacote de trabalho | cO (R$) | cM (R$) | cP (R$) | cE = (cO+4cM+cP)/6 |
|---|---:|---:|---:|---:|
| API — Autenticação e autorização (JWT) | 6.000 | 8.000 | 12.000 | **8.333,33** |
| Sincronização offline (mobile ↔ API) | 8.000 | 10.500 | 15.000 | **10.833,33** |
| Construtor de modelos de inspeção (web) | 7.000 | 9.500 | 13.500 | **9.750,00** |
| Execução de checklist dinâmico (mobile) | 7.500 | 10.000 | 14.500 | **10.166,67** |
| Provisionamento de infraestrutura/nuvem | 5.000 | 7.500 | 11.000 | **7.583,33** |

> A estimativa de três pontos concentra atenção nos pacotes de maior incerteza
> (sincronização offline e construtor de modelos), cuja folga entre os cenários
> otimista e pessimista é maior. Esse é o insumo que justifica a reserva de
> contingência apresentada em 5.2.

### Distribuição dos custos por iniciativa

Aplicando as premissas acima, o investimento distribui-se entre as cinco
iniciativas (categorias) do projeto. Cada valor previsto está dentro do teto de
R$ 204.000,00 autorizado pela organização:

| Iniciativa (categoria) | Investimento previsto (R$) | Participação |
|---|---:|---:|
| A — Recursos Humanos (mão de obra das frentes back, web, mobile, gestão, DevOps, design e QA) | 184.950,00 | 90,7% |
| B — Infraestrutura e Nuvem | 1.480,00 | 0,7% |
| C — Ferramentas e Licenças de Software | 865,00 | 0,4% |
| D — Equipamentos e Materiais | 2.100,00 | 1,0% |
| E — Reserva de Contingência (~7,7% dos custos diretos) | 14.605,00 | 7,2% |
| **Total estimado** | **204.000,00** | **100%** |

> O maior peso está em **Recursos Humanos** (90,7%), coerente com o TAP, cuja
> estimativa parte da mão de obra de 9 integrantes por ~3.400 horas. O esforço
> distribuído (3.425 h) e o custo-hora médio (~R$ 54,00) reproduzem essa base.
> O detalhamento item a item (37 itens) está em
> [`aula05-orcamento-custos.md`](./aula05-orcamento-custos.md).

---

## 5.2 Orçamento Consolidado do Portfólio

O orçamento consolidado demonstra a distribuição do investimento entre custos
diretos e reserva de contingência, chegando ao investimento total do projeto. O
total consolidado coincide com a linha de base autorizada no TAP, comprovando
que a estratégia proposta é financeiramente compatível com os recursos
disponibilizados pela organização.

| Categoria | Total (R$) | % do total |
|---|---:|---:|
| A — Recursos Humanos | 184.950,00 | 90,7% |
| B — Infraestrutura e Nuvem | 1.480,00 | 0,7% |
| C — Ferramentas e Licenças | 865,00 | 0,4% |
| D — Equipamentos e Materiais | 2.100,00 | 1,0% |
| **Subtotal — Custos Diretos** | **189.395,00** | **92,8%** |
| E — Reserva de Contingência | 14.605,00 | 7,2% |
| **TOTAL CONSOLIDADO DO PROJETO** | **204.000,00** | **100%** |

- **Investimento total:** R$ 204.000,00, exatamente o teto autorizado no TAP —
  não há projeto adiado ou descartado por restrição orçamentária, pois a
  estratégia proposta cabe integralmente dentro da linha de base.
- **Custos diretos:** R$ 189.395,00 (92,8%), concentrados em Recursos Humanos.
- **Reserva de contingência:** R$ 14.605,00 (~7,7% dos custos diretos), dentro
  do teto do TAP, dimensionada para cobrir os riscos de maior incerteza
  identificados na estimativa de três pontos (retrabalho de sincronização
  offline e ajustes no construtor de modelos).

> **Aderência ao TAP:** o total consolidado de **R$ 204.000,00** coincide com a
> estimativa de investimentos autorizada no Termo de Abertura do Projeto,
> atendendo ao critério de coerência com a linha de base. Este orçamento
> constitui a base de custos do FieldOps e deve ser monitorado no processo
> *7.4 — Controlar os custos*, comparando o previsto com o realizado ao longo
> das sprints.
