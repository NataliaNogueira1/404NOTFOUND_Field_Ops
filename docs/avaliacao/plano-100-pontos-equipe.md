# Plano coletivo para maximizar a avaliação — FieldOps

> Versão de coordenação para a gerência e a equipe. Elaborado em 20/10/2026 a partir de `FieldOps.md` (fonte de escopo e rubrica), `Auditoria_Final_FieldOps.md`, `Plano_100_Pontos_FieldOps.md`, `Auditoria_da_IA_do_professor.md` e dos exports locais do GitHub Project. Este plano não altera código, issues, Project, responsáveis, commits ou branches.

## 1. Estado atual e regra de leitura

| Indicador | Estimativa atual |
|---|---:|
| Diagnóstico observado pela IA do professor | **69/100** |
| Pontuação tecnicamente sustentada estimada | **~81/100** |
| Potencial após validação/documentação honesta | **~90/100** |
| Potencial após fechamento dos P0 | **~96/100** |
| Potencial após qualidade/P1 | **~99–100/100** |

Esses valores são **estimativas de planejamento, não garantia de nota**. A diferença entre 69 e o potencial técnico ocorre sobretudo porque várias funções estão no código, mas ainda não foram reproduzidas de ponta a ponta, demonstradas em dispositivo/ambiente público ou tornadas fáceis de localizar para o avaliador.

O export do Project contém 268 itens: 237 `Done`, 13 `Ready`, 9 `In review`, 7 `In progress` e 2 `Backlog`. Esse status é sinal de gestão, não prova funcional. Quando houver conflito, valem nesta ordem: escopo/rubrica em `FieldOps.md`, código integrado e testes reproduzíveis, evidência de execução e, por último, estado do quadro.

**Legenda de gaps:** `IMPLEMENTATION_GAP` exige alteração de produto; `VALIDATION_GAP` exige provar algo existente; `DOCUMENTATION_GAP` exige localizar e explicar evidência; `DEMO_GAP` exige execução registrada; `PROCESS_GAP` exige rastreabilidade honesta.

## 2. O que realmente falta

### 2.1 Gaps técnicos reais

| Item | Estado real | Ação mínima coletiva |
|---|---|---|
| #229 — upload de evidência/foto | Cliente e endpoint existem, mas o fluxo completo mobile → API → revisão ainda precisa aceite. A issue está `In progress`; depende do endpoint irmão #221, marcado `Done`. | Manter responsável atual; validar o contrato multipart, fila/retry/idempotência e foto visível na revisão. Corrigir somente defeito reproduzido. |
| #65 — GPS na conclusão | PR #254 está `In review` e descreve captura, sync, persistência e exibição. Ainda precisa revisão, integração e aceite reprodutível; a issue permanece `In review`. | **MANTER RESPONSÁVEL ATUAL**; concluir revisão e testar em dispositivo/ambiente real, inclusive ausência de permissão/sinal. |
| Publicação API + painel/CORS | #204 e #89 estão `Ready`; PR #252 deixa a configuração Render pronta, mas publicação HTTPS, CORS real e smoke test ainda são externos ao repositório. | Publicar, registrar URLs, configurar origens explícitas e testar login/sync reais. |
| APK | #88 está `Done`, mas há configuração EAS, não artefato instalado verificado. | Gerar APK preview, instalar em Android e registrar identificador, data e resultado. |
| Testes mobile reproduzíveis | Jest não iniciou no ambiente auditado por dependência nativa/toolchain; isto não prova falha do produto, mas é um gap de qualidade. | Preparar ambiente compatível, executar suíte e registrar falhas reais antes de decidir correções. |
| #263/#264 — detalhes de cliente/local | As telas de detalhe web usam seeds/mocks; ambas estão `Ready`. | **MANTER RESPONSÁVEL ATUAL**; integrar API real e adicionar smoke test/manual verificável. |
| #154 — CSV no web | PR #192 e issue #154 estão `In review`. | **MANTER RESPONSÁVEL ATUAL**; revisar, testar filtros/encoding/injeção CSV e integrar. |
| Dependências | #259/#260 estão `Ready`; números de vulnerabilidade são snapshots, não auditoria atual. | Rodar auditoria atual, classificar dependência direta/transitiva e corrigir apenas mudanças validadas. |

### 2.2 Gaps de validação — não reimplementar

Os itens abaixo já possuem evidência no código/auditoria e devem receber teste, demonstração ou índice de localização, não uma segunda implementação: SQLite local; outbox; cursor incremental; idempotência; retry; QR; câmera; sincronização de respostas; sincronização de não conformidades; revisão; aprovação/reprovação; comentários por item; autorização no backend; OpenAPI; Docker/container da API.

O teste decisivo é um cenário offline → fechar/reabrir quando aplicável → reconectar → sincronizar → revisar, verificando que não há perda nem duplicação. QR/câmera requerem também validação em Android, não apenas inspeção de código.

### 2.3 Gaps de evidência e documentação

Ainda faltam ou estão parciais: APK instalável; URL web; URL/API pública ou contêiner reproduzível; resultado datado de testes (em especial mobile); roteiro E2E; limitações conhecidas; índice de evidências da rubrica; índice de PRs principais. Isso é `DOCUMENTATION_GAP`/`DEMO_GAP`, salvo quando o teste revelar defeito real.

## 3. Caminho crítico coletivo

```text
1. Upload/evidência (#229) e aceite do endpoint (#221)
2. GPS final (#65 / PR #254 em revisão)
3. API e web publicadas, CORS e smoke test (#204 / #89)
4. APK instalável (#88: provar, não apenas manter Done)
5. Demo E2E sem Swagger nem alteração manual de banco (#92 / #197)
6. Suíte mobile reproduzível e auditoria de dependências (#85 / #259 / #260)
7. Ajustes web restantes (#263 / #264; #154 em revisão)
8. Evidências, limites e documentação final (#219)
9. Polish/P1 somente após o fluxo acima
```

O Project não mostra dependência que justifique inverter essa ordem. Deploy/API é pré-requisito prático para APK e demonstração; upload e GPS são os riscos funcionais de maior valor na rubrica. CSV, notificações, assinatura e cosmética não devem interromper o caminho crítico.

## 4. Plano por ondas

`Responsável atual` vem do export do Project. “MANTER RESPONSÁVEL ATUAL” significa que a equipe não deve reassumir nem editar a mesma área sem alinhamento e handoff explícito.

### Wave 0 — blockers e aceite do núcleo

| Issue | Descrição | Frente | Responsável atual / Project | Dependências | Prioridade | Rubrica | Critério de pronto | Paralelo seguro |
|---|---|---|---|---|---|---|---|---|
| #229 | Foto/evidência mobile até backend e review. | Mobile + API | **Cutiur — In progress, P0. MANTER RESPONSÁVEL ATUAL.** | #221 endpoint; ambiente API | P0 | Nativos, sync, API | Foto capturada offline fica pendente, retry envia uma vez, aparece em review. | #65, #89, documentação |
| #65 / PR #254 | GPS no início e na conclusão, persistido e exibido. | Mobile + API + web | **IanLucasss/NataliaNogueira1 — In review, P0. MANTER RESPONSÁVEL ATUAL.** | revisão/merge; permissões do aparelho | P0 | Mobile, nativos, demo | Aceite em aparelho com e sem permissão; dados visíveis na revisão. | #229, deploy |
| #204 / PR #252 | API pública de demonstração e APK apontando para ela. | Infra/API/mobile | **lucasmiguelleite, MarcelaMulato — Ready. MANTER RESPONSÁVEL ATUAL.** | Render/DB/segredos de ambiente; CORS | P0 | API, docs, demo | HTTPS ativa, health/login/sync de APK passam; URL registrada. | #65, #89 |
| #89 | Build e publicação do painel web. | Web/infra | **IanLucasss — Ready, P0. MANTER RESPONSÁVEL ATUAL.** | API pública e CORS | P0 | Admin, demo | URL acessível, login e fluxo de review em API real. | #229, APK |

### Wave 1 — integração E2E

| Issue | Descrição | Frente | Responsável atual / Project | Dependências | Prioridade | Rubrica | Critério de pronto | Paralelo seguro |
|---|---|---|---|---|---|---|---|---|
| #197 | Integração ponta a ponta de sync. | Integração | **lucasmiguelleite, Rodrigof981, MarcelaMulato, NataliaNogueira1, Cutiur — Ready, P0. MANTER RESPONSÁVEL ATUAL.** | #229, #65, #204 | P0 | Sync, API, mobile | Cenário executado sem duplicação/conflito não tratado e com registro. | runbook e testes |
| #92 | Demonstração ponta a ponta. | Equipe | Equipe ampla — Ready, P0. Coordenar, sem duplicar donos técnicos. | #197, URLs, APK | P0 | Demo/defesa | Roteiro integral executado sem Swagger/SQL manual. | documentação e security |
| #88 | APK de demonstração. | Mobile/release | **Cutiur — Done, P0.** Não reabrir por status; tratar como evidência pendente. | API pública | P0 | Mobile/nativos/demo | APK real instalado e validado, com artefato/link. | web/deploy |
| #230 | Detalhe de inspeção por ID no mobile. | Mobile | **IanLucasss — In progress, P0. MANTER RESPONSÁVEL ATUAL.** | API/ambiente | P0 | Mobile/sync | Fluxo de pull aberto no app e demonstrado. | demais testes |

### Wave 2 — validação e testes

| Issue | Descrição | Frente | Responsável atual / Project | Dependências | Prioridade | Rubrica | Critério de pronto | Paralelo seguro |
|---|---|---|---|---|---|---|---|---|
| #85 | Revalidar testes críticos. | QA | Equipe ampla — Done, P0. Não assumir como evidência final sem execução atual. | ambiente mobile | P0 | Testes/qualidade | API, web e mobile com comandos, ambiente, data, resultado e bloqueios. | docs, #263/#264 |
| #31 | Offline/sync idempotente. | Mobile/API | **lucasmiguelleite, MarcelaMulato — In progress, P0. MANTER RESPONSÁVEL ATUAL.** | #197 | P0 | Offline/sync | Reenvio e recuperação offline provados sem duplicar dados. | #154 e docs |
| #259 | Auditoria/correção de vulnerabilidades mobile. | Mobile/segurança | **Cutiur — Ready, P1. MANTER RESPONSÁVEL ATUAL.** | auditoria atual | P1 | Qualidade/segurança | Relatório atual, correções validadas e risco residual documentado. | #260 |
| #260 | Auditoria/correção de vulnerabilidades web. | Web/segurança | **Cutiur — Ready, P1. MANTER RESPONSÁVEL ATUAL.** | auditoria atual | P1 | Qualidade/segurança | Mesmo critério de #259. | #259 |

### Wave 3 — qualidade e ajustes web

| Issue | Descrição | Frente | Responsável atual / Project | Dependências | Prioridade | Rubrica | Critério de pronto | Paralelo seguro |
|---|---|---|---|---|---|---|---|---|
| #263 | Detalhe de cliente com API real. | Web | **almeida-carol — Ready, P1. MANTER RESPONSÁVEL ATUAL.** | contrato API | P1 | Interface admin | Sem `seedClients` no detalhe e smoke test. | #154, #264 se arquivos não colidirem |
| #264 | Detalhe de localização com API real. | Web | **almeida-carol — Ready, P1. MANTER RESPONSÁVEL ATUAL.** | contrato API | P1 | Interface admin | Sem `seedSites` no detalhe e smoke test. | #154; coordenar com #263 por provável colisão |
| #154 / PR #192 | Exportação CSV no web. | Web/API | **DreBartolomeu — In review, P1. MANTER RESPONSÁVEL ATUAL.** | revisão/merge | P1 | Admin/API | Download correto com filtros, UTF-8 e segurança CSV. | documentação/testes |

### Wave 4 — evidências e documentação

| Issue | Descrição | Frente | Responsável atual / Project | Dependências | Prioridade | Rubrica | Critério de pronto | Paralelo seguro |
|---|---|---|---|---|---|---|---|---|
| #219 | Guia consolidado de avaliação. | Documentação | **lucasmiguelleite, Rodrigof981, MarcelaMulato, JujubsPaes, NataliaNogueira1 — In progress, P1. MANTER RESPONSÁVEL ATUAL.** | resultados de waves 0–2 | P1 | Processo/docs/defesa | Índice rastreável sem afirmar testes não executados. | todas as waves; uma pessoa por arquivo |
| #92 | Runbook e registro da demo. | Demo | Equipe ampla — Ready, P0. | Waves 0–1 | P0 | Demo/defesa | Execução datada, capturas/logs honestos e limitações. | #219 |

### Wave 5 — polish/bonus

Notificações, assinatura, visual, itens P1/P2 sem relação com risco de rubrica e novas melhorias entram aqui. Só iniciar se o APK, deploy, testes, demo e evidências das waves anteriores estiverem completos. Eles não são caminho para compensar falha no fluxo principal.

## 5. Matriz para 100/100

| Dimensão | Máx. | Situação atual | O que falta | Ação | Evidência final esperada | Risco |
|---|---:|---|---|---|---|---|
| Visão/requisitos | 5 | Escopo e PBIs existem. | Rastreio curto requisito→prova. | Índice de evidências. | mapa da rubrica e links. | Médio |
| Arquitetura | 10 | Monorepo, Spring, React, Expo, SQLite/Flyway auditados. | Explicar decisões e limite UUID sem migração tardia. | Registrar ADR/explicação curta no índice. | diagramas, OpenAPI, estrutura. | Baixo–médio |
| Mobile | 20 | Fluxos principais presentes. | APK e smoke em aparelho; detalhes #230. | concluir/validar waves 0–2. | APK + roteiro/testes. | Alto |
| Recursos nativos | 10 | QR/câmera existem; GPS final aguarda aceite; upload precisa prova real. | #65 e #229. | validar em Android. | vídeo/capturas e dado na revisão. | Alto |
| Offline/sincronização | 15 | SQLite, outbox, cursor e idempotência existem. | prova completa, reinício/retry/sem duplicidade. | #31/#197 + demo. | log/cenário testado. | Alto |
| Interface administrativa | 10 | Cadastros, template, agenda e review presentes. | Detalhes sem mocks, CSV e URL. | #263/#264/#154/#89. | painel publicado e smoke. | Médio |
| API/regras/dados | 15 | JWT/roles, regras, Flyway, sync, OpenAPI e 180 testes API reportados. | deploy, upload E2E e explicação de modelo. | #204/#229 + registro testável. | OpenAPI/API pública e teste. | Médio–alto |
| Testes/segurança/qualidade | 7 | API/web tiveram resultados; mobile/scan atual pendentes. | mobile reproduzível e audit atualizado. | #85/#259/#260. | relatório datado de testes/audit. | Alto |
| Documentação/processo | 4 | READMEs e material base existem. | Índice, limites, PRs e comandos validados. | #219 / `docs/avaliacao`. | links verificáveis. | Médio |
| Demonstração/defesa | 4 | Ainda sem prova E2E final. | fluxo não manual e preparo individual. | #92. | runbook, gravação/registro e defesa. | Alto |

### Síntese de rubricas específicas

| Rubrica | Situação | Próxima prova/ação |
|---|---|---|
| Expo | Router, SQLite, SecureStore, QR e câmera existem. APK, GPS final, upload e testes em aparelho carecem de aceite. | APK instalado + cenário offline/nativo documentado. |
| Java/Spring Boot | Domínio, auth, transições, idempotência, upload e OpenAPI existem; API teve 180 testes reportados. | `verify`/container e upload contra ambiente público, com registro. |
| Interface administrativa | React + TypeScript + Vite é stack autorizada por `FieldOps.md`; não há migração Angular a fazer. | Publicação, fluxos reais e remoção de mocks delimitados. |

## 6. Checklist coletivo de evidências

| Evidência | Estado | Fonte atual / fechamento |
|---|---|---|
| Backlog/Kanban atualizado | PARTIAL | Export do Project; ajustar apenas via gestão normal após aceite, sem usar `Done` como prova. |
| PRs principais | PARTIAL | Project inclui, entre outros, PRs #252, #253, #254, #192, #194 e #195; criar índice por fluxo. |
| README API | READY | `api/README.md`. |
| README web | READY | `frontend/README.md`. |
| README mobile | READY | `mobile/README.md`. |
| Instruções de execução | PARTIAL | Existem nos READMEs; validar clone/ambiente e registrar. |
| OpenAPI | READY | Configuração API e `/v3/api-docs`; linkar no índice. |
| Modelo/diagrama de dados | READY | `FieldOps.md` e documentação/diagramas da #219. |
| APK | MISSING | Configuração EAS existe; falta artefato instalado/identificado. |
| URL web | MISSING | #89. |
| API pública/container | PARTIAL | Docker/Render e PR #252; falta URL e smoke real. |
| Usuários demo | READY | seed/README API; não publicar senhas fora do contexto controlado. |
| Roteiro E2E | MISSING | Criar e executar sob #92. |
| Resultados de testes | PARTIAL | API e web reportados; mobile e atualização de audit faltam. |
| Limitações conhecidas | PARTIAL | Auditorias/PRs dispersos; consolidar honestamente. |

## 7. Documentação de avaliação recomendada

Recomenda-se manter `docs/avaliacao/` **somente dentro do trabalho já coordenado da #219**, evitando duas pessoas no mesmo arquivo:

```text
docs/avaliacao/
├── README.md              # índice rubrica → evidência existente
├── demo-runbook.md        # roteiro e resultado esperado da demo
├── test-results.md        # comando, ambiente, data, resultado e bloqueio
├── known-limitations.md   # limites honestos, impacto e workaround
└── contributions.md       # rastreabilidade individual por evidência
```

Esses documentos apontam para README, OpenAPI, testes, PRs e diagramas existentes; não os copiam. Nenhum resultado deve ser marcado como aprovado sem execução e identificação do ambiente.

## 8. Autoria, commits, PRs e merges

Merge não é sinônimo de implementação. A gerência deve registrar separadamente:

| Papel | O que comprova | O que não comprova sozinho |
|---|---|---|
| **IMPLEMENTOU** | commit original, diff, issue e teste associados. | autoria do merge. |
| **ABRIU PR** | autor da PR e descrição. | autoria integral de commits de terceiros. |
| **REVISOU** | review, comentário ou aprovação. | implementação. |
| **MERGEOU** | commit/evento de merge. | autoria do código contido no PR. |
| **COAUTORIA** | trailers `Co-authored-by`, commits e escopo explícito. | participação presumida por estar no time. |

Para cada PR, conferir autor da PR, commits contidos, arquivos alterados, issue ligada, reviews, merge e eventuais coautores. Tratar squash merges, commits com e-mails alternativos e branches ainda não integradas com cuidado. A contagem de commits não é métrica suficiente de contribuição.

### Estrutura verificável para `contributions.md`

| Integrante/GitHub | Principais issues | Principais PRs | Principais commits | Áreas | Tipo | Evidências | Pontos para defesa |
|---|---|---|---|---|---|---|---|
| NataliaNogueira1 | preencher após cruzar issues/PRs | preencher | separar commits originais de merges | gestão/revisão e, se houver, código comprovado | abrir PR / revisar / mergear / implementar — marcar separadamente | URLs de PR, reviews, commits | decisões, integração e revisões realizadas |
| lucasmiguelleite | preencher | preencher | preencher | preencher | preencher | preencher | fluxos comprovados |
| MarcelaMulato | preencher | preencher | preencher | preencher | preencher | preencher | fluxos comprovados |
| Rodrigof981 | preencher | preencher | preencher | preencher | preencher | preencher | fluxos comprovados |
| JujubsPaes | preencher | preencher | preencher | preencher | preencher | preencher | fluxos comprovados |
| Cutiur | preencher | preencher | preencher | preencher | preencher | preencher | fluxos comprovados |
| DreBartolomeu | preencher | preencher | preencher | preencher | preencher | preencher | fluxos comprovados |
| IanLucasss | preencher | preencher | preencher | preencher | preencher | preencher | fluxos comprovados |
| almeida-carol | preencher | preencher | preencher | preencher | preencher | preencher | fluxos comprovados |

O quadro é propositalmente uma estrutura de prova, não uma atribuição automática. O export permite relacionar responsáveis/revisores de alguns itens, mas não autoriza transferir autoria de código a quem apenas revisou ou fez merge.

## 9. Responsabilidades atuais e prevenção de conflitos

| Tema | Responsável atual no Project | Situação | Regra de coordenação |
|---|---|---|---|
| #229 upload de evidência | Cutiur | In progress, P0 | Não editar sync/upload mobile em paralelo. |
| #65 GPS final | IanLucasss, NataliaNogueira1 | In review, P0 | Não alterar a mesma cadeia sem finalizar review/handoff. |
| #263/#264 detalhes cliente/local | almeida-carol | Ready, P1 | Coordenar porque as duas mudanças provavelmente tocam `ClientsPage.tsx`. |
| #154 CSV | DreBartolomeu | In review, P1 | Priorizar revisão/aceite antes de nova implementação. |
| Segurança/dependências #259/#260 | Cutiur | Ready, P1 | Uma frente única de dependências para evitar lockfiles concorrentes. |
| Documentação/evidências #219 | lucasmiguelleite, Rodrigof981, MarcelaMulato, JujubsPaes, NataliaNogueira1 | In progress, P1 | Dividir por arquivo e designar um editor final. |

## 10. Plano mínimo de demonstração

| Passo | Estado | Tipo de ação antes da demo |
|---|---|---|
| Login admin | Implementado; requer ambiente publicado. | VALIDATION_GAP |
| Cadastro/dados | Implementado. | VALIDATION_GAP |
| Template | Implementado. | VALIDATION_GAP |
| Publicação | Implementado. | VALIDATION_GAP |
| Agendamento e atribuição | Implementados. | VALIDATION_GAP |
| Login técnico/mobile e download | Implementados; exigem APK/API pública. | VALIDATION_GAP |
| Início e QR | Implementados. | VALIDATION_GAP em Android |
| Checklist, foto e GPS | Foto depende do aceite #229; GPS final aguarda #65/PR #254. | IMPLEMENTATION/ACCEPTANCE_GAP + validação |
| Offline, respostas e NCs | Implementados no código. | VALIDATION_GAP: desligar rede, reiniciar quando aplicável e reconectar |
| Fechar/reabrir app | Fluxo deve ser ensaiado com a outbox. | VALIDATION_GAP |
| Sincronização | Implementada; integrar #197. | VALIDATION_GAP |
| Review, foto na revisão | Review existe; foto depende #229. | VALIDATION_GAP após #229 |
| Aprovar/reprovar e correção | Implementados. | VALIDATION_GAP |
| Histórico/auditoria | Implementados. | VALIDATION_GAP |

O roteiro deve usar seed/UI/API normal. Não usar Swagger para inserir estados nem alteração manual no banco para “consertar” uma demonstração. Consultas de banco podem ser evidência complementar, jamais condição para o fluxo do usuário.

## 11. Resumo executivo para gerência

O projeto tem base técnica mais forte que o diagnóstico estático de 69/100 sugere; a estimativa técnica é ~81/100, mas ainda não é nota garantida.  
O maior risco é transformar funcionalidades existentes em evidência verificável: foto/sync, GPS final, APK, URLs publicadas, testes mobile e demo E2E.  
#229 está com Cutiur; #65 está em revisão com IanLucasss/NataliaNogueira1; #263/#264 com almeida-carol; #154 em revisão com DreBartolomeu.  
#204 está com lucasmiguelleite/MarcelaMulato; #89 com IanLucasss; #259/#260 com Cutiur; #219 é compartilhada e exige divisão por arquivo.  
Não redistribuir nem abrir trabalho paralelo nesses arquivos sem handoff explícito.  
O caminho crítico é: upload e GPS aceitos → API/web/CORS publicados → APK validado → demo E2E → testes/audit → evidências finais.  
Publicação, documentação, revisão de CSV e preparação dos testes podem ocorrer em paralelo; upload/GPS/deploy não devem aguardar polish.  
Não priorizar agora cosmética, notificações, assinatura ou novas features P1/P2.  
Faltam APK verificável, URLs, runbook E2E executado, resultados mobile/audit atualizados, índice de evidências e limitações consolidadas.  
Para buscar 100/100 legitimamente, fechar apenas defeitos reproduzidos, provar o que já existe e manter uma cadeia clara requisito → código/teste → PR → demonstração → responsável.  
