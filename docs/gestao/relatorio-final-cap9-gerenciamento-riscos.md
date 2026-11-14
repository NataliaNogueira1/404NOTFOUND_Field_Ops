# 9 GERENCIAMENTO DOS RISCOS

> **Projeto:** FieldOps — Plataforma de Inspeção em Campo
> **Equipe:** 404 Not Found
> **Documento:** Capítulo 9 do Relatório Final, adaptado ao *Template - Relatório Final*
> (seção *Gerenciamento dos Riscos*, itens 9.1 e 9.2).
>
> Não havia um documento dedicado de riscos em `docs/gestao/`; este capítulo
> **consolida** riscos reais já identificados em outros artefatos do projeto:
> a análise de qualidade ([`aula05-analise-qualidade.md`](./aula05-analise-qualidade.md)
> — Ishikawa, folha de verificação e Pareto), a gestão de risco do cronograma
> (`docs/requisitos/fieldops-requisitos-rubrica.md`, seção 16.7) e a escalada de
> impedimentos do [`plano-de-comunicacao.md`](./plano-de-comunicacao.md).

Neste capítulo são identificados os principais riscos do projeto FieldOps. Para
cada risco relevante consideram-se a **probabilidade de ocorrência** e o
**impacto** sobre custo, prazo, qualidade, recursos e resultados esperados. Em
seguida são apresentadas as **estratégias de resposta** (evitar, reduzir,
transferir ou aceitar) e o **plano de monitoramento**, demonstrando como o
acompanhamento reduz impactos negativos e aumenta a chance de alcançar os
objetivos.

---

## 9.1 Identificação e Análise dos Riscos

Os riscos foram identificados a partir dos artefatos do projeto, com destaque
para a sincronização offline — apontada como risco central pelo diagrama de
Ishikawa e líder do diagrama de Pareto de defeitos (35%).

### Escala adotada

- **Probabilidade:** Baixa / Média / Alta.
- **Impacto:** Baixo / Médio / Alto, avaliado sobre custo, prazo, qualidade,
  recursos e resultados.
- **Severidade (exposição):** combinação de probabilidade × impacto
  (Baixa/Média/Alta/Crítica), usada para priorizar as respostas.

### Registro de riscos

| ID | Risco | Categoria | Prob. | Impacto | Dimensões mais afetadas | Severidade |
|---|---|---|:--:|:--:|---|:--:|
| **R1** | Perda ou inconsistência de respostas durante o uso offline / sincronização | Técnico | Alta | Alto | Qualidade, Resultados | **Crítica** |
| **R2** | Atraso do cronograma (prazo de 3 meses apertado para o escopo) | Prazo | Média | Alto | Prazo, Resultados | **Alta** |
| **R3** | Limitação de recursos humanos / acúmulo de papéis (equipe enxuta) | Recursos | Média | Médio | Recursos, Prazo | **Média** |
| **R4** | Falha de integração entre frentes por mudança de contrato da API | Técnico/Integração | Média | Médio | Qualidade, Prazo | **Média** |
| **R5** | Falha de validação de obrigatórios no checklist (2º no Pareto) | Qualidade | Média | Médio | Qualidade | **Média** |
| **R6** | Falha de autenticação/sessão — expiração de token (3º no Pareto) | Técnico | Média | Médio | Qualidade, Resultados | **Média** |
| **R7** | Perda de evidência fotográfica (upload falho ou foto sem vínculo ao item) | Técnico/Dados | Baixa | Alto | Qualidade, Resultados | **Média** |
| **R8** | Instabilidade de rede/ambiente na demonstração do MVP (causa especial) | Operacional | Média | Alto | Resultados | **Alta** |

> **Riscos centrais exigidos cobertos:** sincronização offline (**R1**), prazo
> (**R2**) e recursos (**R3**). As demais entradas complementam com os riscos
> técnicos e operacionais já observados nos dados de qualidade.

### Mapa de exposição (probabilidade × impacto)

| Probabilidade \ Impacto | Baixo | Médio | Alto |
|---|:--:|:--:|:--:|
| **Alta** | — | — | **R1** |
| **Média** | — | R3, R4, R5, R6 | R2, R8 |
| **Baixa** | — | — | R7 |

As causas-raiz de **R1** (risco crítico) foram mapeadas no diagrama de Ishikawa
e concentram-se em **Método** (falta de idempotência no reenvio, regras de
conflito mal definidas) e **Máquina/Tecnologia** (falha de gravação no SQLite,
instabilidade de rede) — exatamente os pontos endereçados pelos PBIs 050–055.

---

## 9.2 Respostas e Monitoramento dos Riscos

Para cada risco define-se a estratégia de resposta (evitar, reduzir, transferir
ou aceitar), as ações associadas e o responsável.

| ID | Estratégia | Ações de resposta | Responsável |
|---|---|---|---|
| **R1** | **Reduzir** | Outbox persistente com operações idempotentes (chave/UUID estável); regras de conflito por versão; tela de status de sincronização; testes automatizados dedicados de sync (PBIs 050–055). | Marcela (Backend) / Natália (Mobile) |
| **R2** | **Reduzir / Aceitar** | Priorização do backlog por valor; redução de escopo pré-definida em caso de atraso (ordem da seção 16.7: remover dashboard avançado → limitar tipos de resposta → só foto capturada → construtor sem drag-and-drop → conflito só detecção/bloqueio → adiar notificações/PDF/assinatura), mantendo o núcleo (auth, checklist, foto, offline, sync, revisão). | Natália (GP) |
| **R3** | **Reduzir** | Distribuição de carga na frente Web (4 devs); cards que cruzam frentes com R compartilhado; repriorização pela gerência em vez de contratação externa (fora do escopo acadêmico). | Natália (GP) / Líderes |
| **R4** | **Reduzir / Evitar** | "Contratos primeiro": mudança de API comunicada via OpenAPI/Swagger antes de impactar Web e Mobile; alinhamento técnico semanal entre líderes. | Marcela (Líder Backend) |
| **R5** | **Reduzir** | Barreira de validação de obrigatórios no mobile antes do envio; revisão do supervisor na web; testes de regressão para checklists com mais de 25 itens (correlação itens × defeitos). | Rodrigo/Felipe (Mobile) |
| **R6** | **Reduzir** | Renovação automática de sessão (refresh token) e tratamento explícito de 401; testes dos fluxos de autenticação. | Lucas/Marcela (Backend) |
| **R7** | **Reduzir** | Evidência vinculada ao item com dependência na outbox (foto espera o answer); nunca deletar arquivo em falha, mantendo-o para retry; persistência do erro para sobreviver a reinício. | Natália/Rodrigo (Mobile) |
| **R8** | **Evitar / Reduzir** | Ensaio da demonstração; ambiente de homologação preparado; dados de demonstração reproduzíveis (seed) e API em contêiner Docker; plano B offline para a demo. | Marcela / Júlia (Nuvem) |

### Plano de monitoramento

- **Indicador-chave (R1):** taxa de sincronizações com falha (%), acompanhada no
  **gráfico de controle** semanal (média ~8,3%; LSC ~16%). Pontos acima do LSC
  (como o Dia 8, 18%) disparam investigação de causa especial.
- **Folha de verificação** de defeitos adotada como rotina em todas as sprints,
  alimentando o Pareto para repriorizar onde o retorno é maior (sync, validação
  e autenticação respondem por ~72,5% dos defeitos).
- **Revisão de riscos** nas cerimônias de sprint (planning/retro); novos riscos
  ou mudanças de severidade são registrados aqui.
- **Comunicação e escalada de impedimentos:** dev → líder de área → Gerente de
  Projeto → Cliente/PO, conforme o plano de comunicação; riscos e impedimentos
  são comunicados assim que surgem (WhatsApp/Meet) com alerta + plano de ação.

> **Reserva de contingência:** o orçamento reserva ~7,7% dos custos diretos
> (R$ 14.605,00, Capítulo 5) para cobrir os riscos de maior incerteza
> — notadamente retrabalho de sincronização (R1) e ajustes no construtor de
> modelos —, mantendo o projeto dentro do teto de R$ 204.000,00 do TAP.
