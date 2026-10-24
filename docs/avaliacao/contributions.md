# Rastreabilidade de contribuições — FieldOps

## 1. Objetivo e metodologia

Este documento organiza evidências de contribuição individual encontradas no histórico Git alcançável a partir de develop e em documentos coletivos do repositório. Ele diferencia implementação, revisão, merge, gestão, documentação e validação.

Quantidade de commits, isoladamente, não representa percentual de implementação nem nota individual. Um commit pode ser documentação, ajuste pequeno, integração, merge ou squash; a avaliação deve considerar o diff, os arquivos alterados, a issue/PBI relacionada, o PR, revisões e a capacidade de explicar a entrega.

As identidades abaixo são identidades Git encontradas no histórico; não constituem, por si só, confirmação de composição atual da equipe. Nomes ou usernames distintos com o mesmo e-mail devem ser tratados com cuidado.

Fontes: [auditoria técnica](auditorias/auditoria-final-fieldops.md), [diagnóstico da IA do professor](auditorias/auditoria-ia-professor.md), [plano coletivo](plano-100-pontos-equipe.md), [índice de evidências](README.md) e histórico Git local.

## 2. Tipos de contribuição

| Tipo | Significado |
|---|---|
| IMPLEMENTOU | Produziu alteração funcional ou documental comprovável por commit, diff e arquivos alterados. |
| ABRIU_PR | Criou o pull request identificado na página do GitHub. O autor do PR deve ser conferido no próprio PR. |
| REVISOU | Revisou, testou ou aprovou alteração de outra pessoa, quando há registro de review. |
| MERGEOU | Realizou ou consta como autor de evento de integração/merge. Não prova autoria do código interno. |
| COAUTORIA | Contribuição conjunta explicitamente evidenciada, por exemplo trailer Co-authored-by ou registro do PR. |
| DOCUMENTOU | Produziu documentação rastreável por commit/diff. |
| VALIDOU | Executou e registrou validação/teste/demonstração com evidência verificável. |
| GESTÃO | Registrou atividade de coordenação, backlog ou integração quando houver fonte própria. |

## 3. Integrantes e identidades encontradas

Foram encontradas as identidades Git NataliaNogueira1/Natália Nogueira, Marcela Mulato, Lucas Miguel Leite, Júlia Paes de Medeiros, Rodrigo Soares/Rodrigo, Cutiur, Andressa Bartolomeu, IanLucasss, Caroline Arruda e almeida-carol.

NataliaNogueira1 e Natália Nogueira usam o mesmo e-mail no histórico. Rodrigo Soares e Rodrigo também usam o mesmo e-mail. Caroline Arruda e almeida-carol usam o mesmo e-mail. Essas associações são evidência de identidade Git semelhante, não substituem confirmação da equipe/conta GitHub pelo avaliador.

## 4. Matriz resumida de contribuição

| Integrante/identidade Git | Áreas encontradas | Implementação | PRs | Revisão | Merge | Documentação/validação | Evidências principais |
|---|---|---|---|---|---|---|---|
| NataliaNogueira1 / Natália Nogueira | Web, API, testes, documentação e integração. | Commits funcionais e de teste identificados. | Não determinado apenas pelo Git local. | Não identificado nas fontes locais consultadas. | Múltiplos commits de merge identificados. | Commits de análise/documentação identificados. | [acc4549](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/acc4549), [32ab542](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/32ab542) |
| Marcela Mulato | API de evidências e testes Mobile. | Endpoint/upload de evidências e testes de componente. | Não determinado apenas pelo Git local. | Não identificado nas fontes locais consultadas. | Um merge de branch identificado. | Não identificado além dos commits listados. | [faac0d7](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/faac0d7), [a6f58b8](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/a6f58b8) |
| Lucas Miguel Leite | Sync Mobile/API, review e deploy. | Pull incremental, sync de respostas/NCs, revisão e endpoint Mobile. | Não determinado apenas pelo Git local. | Não identificado nas fontes locais consultadas. | Não identificado nesta coleta. | Não identificado além dos commits listados. | [211f09b](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/211f09b), [88d3e46](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/88d3e46) |
| Júlia Paes de Medeiros | Integração Web/API, não conformidades e documentação de avaliação. | Integração de não conformidades com API. | Não determinado apenas pelo Git local. | Não identificado nas fontes locais consultadas. | Não identificado nesta coleta. | Auditorias, plano coletivo e documentos de evaluation. | [84f28b7](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/84f28b7), [865b3cd](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/865b3cd) |
| Rodrigo Soares / Rodrigo | Sync Mobile, portal técnico, dashboard e documentação. | Sync de respostas/NCs e integração do portal técnico. | Não determinado apenas pelo Git local. | Não identificado nas fontes locais consultadas. | Não identificado nesta coleta. | Guia do avaliador identificado. | [caf40a0](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/caf40a0), [62519b3](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/62519b3) |
| Cutiur | QR Code e fluxo de inspeção Mobile. | Scanner QR real e confirmação de equipamento. | Não determinado apenas pelo Git local. | Não identificado nas fontes locais consultadas. | Não identificado nesta coleta. | Não identificado além dos commits listados. | [2fc887b](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/2fc887b), [ed5c3cb](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/ed5c3cb) |
| Andressa Bartolomeu | Assinatura Mobile e dashboard Web. | SignaturePad, persistência/sync de assinatura e integração de dashboard. | Não determinado apenas pelo Git local. | Não identificado nas fontes locais consultadas. | Commit de merge #271 identificado; não transfere autoria dos commits internos. | Não identificado além dos commits listados. | [e1b91a1](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/e1b91a1), [995c294](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/995c294) |
| IanLucasss | Biometria Mobile. | Hook, tela e integração de bloqueio biométrico. | Não determinado apenas pelo Git local. | Não identificado nas fontes locais consultadas. | Não identificado nesta coleta. | Não identificado além dos commits listados. | [a513957](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/a513957), [cf59bc7](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/cf59bc7) |
| Caroline Arruda | Integração Web de inspeções/auditoria, estados de UI e lightbox. | Listagem/criação de inspeções, timeline e estados Web. | Não determinado apenas pelo Git local. | Não identificado nas fontes locais consultadas. | Não identificado nesta coleta. | Não identificado além dos commits listados. | [0e0dd86](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/0e0dd86), [1d2cf8a](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/1d2cf8a) |
| almeida-carol | Relatório PDF Web. | Página, rota e botão de relatório PDF. | Não determinado apenas pelo Git local. | Não identificado nas fontes locais consultadas. | Não identificado nesta coleta. | Não identificado além dos commits listados. | [6937294](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/6937294), [61e4206](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/61e4206) |

## 5. Evidências por integrante

### NataliaNogueira1 / Natália Nogueira

- **IMPLEMENTOU:** correções de filtro de dashboard em PostgreSQL no commit [acc4549](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/acc4549), que altera repositories de inspection e nonconformity.
- **DOCUMENTOU:** commits de análise de sprint identificados no histórico.
- **MERGEOU:** commits de merge incluem [32ab542](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/32ab542), [3067767](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/3067767) e outros eventos de integração.
- **Observação:** os merges são evidência de integração, não autoria automática das funcionalidades trazidas pelos PRs.

### Marcela Mulato

- **IMPLEMENTOU:** endpoint POST de evidência no commit [faac0d7](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/faac0d7), incluindo commits relacionados de service/idempotência; teste de componente Mobile em [a6f58b8](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/a6f58b8).
- **MERGEOU:** o commit [5d8fcc3](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/5d8fcc3) é merge de develop em branch de dashboard, não prova autoria do código de develop.

### Lucas Miguel Leite

- **IMPLEMENTOU:** pull incremental Mobile em [211f09b](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/211f09b), sync de respostas/NCs em [88d3e46](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/88d3e46), início formal de revisão em [a02629b](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/a02629b) e detalhe de inspeção Mobile em [a2990c4](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/a2990c4).

### Júlia Paes de Medeiros

- **IMPLEMENTOU:** integração da página de não conformidades com API em [84f28b7](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/84f28b7).
- **DOCUMENTOU:** auditoria final, plano coletivo e fontes de avaliação em [72d171c](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/72d171c), [a91abfd](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/a91abfd) e [e4e0842](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/e4e0842).
- **DOCUMENTOU:** índice, runbook, limitações e resultados de testes em [865b3cd](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/865b3cd), [4344d5b](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/4344d5b), [0cb04fa](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/0cb04fa) e [5ecbf7b](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/5ecbf7b).

### Rodrigo Soares / Rodrigo

- **IMPLEMENTOU:** envio de respostas/NCs no sync em [caf40a0](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/caf40a0); portal técnico ligado à API em [62519b3](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/62519b3).
- **DOCUMENTOU:** guia do avaliador no commit [18ca7d6](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/18ca7d6).
- **Observação:** as duas assinaturas Git compartilham e-mail no histórico; a associação de conta deve ser confirmada pelo avaliador.

### Cutiur

- **IMPLEMENTOU:** scanner QR real e confirmação de equipamento em [2fc887b](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/2fc887b); critérios adicionais de QR em [ed5c3cb](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/ed5c3cb).

### Andressa Bartolomeu

- **IMPLEMENTOU:** SignaturePad, persistência SQLite e integração da assinatura na conclusão em [e1b91a1](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/e1b91a1), [e67c54f](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/e67c54f), [35b7a04](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/35b7a04) e [995c294](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/995c294).
- **MERGEOU:** [f497865](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/f497865) é um commit de merge; este fato é separado da implementação acima.

### IanLucasss

- **IMPLEMENTOU:** biometria Mobile por hook, AuthContext e tela de bloqueio em [a513957](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/a513957), [d71835e](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/d71835e) e [cf59bc7](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/cf59bc7).

### Caroline Arruda

- **IMPLEMENTOU:** listagem/criação de inspeções Web em [0e0dd86](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/0e0dd86), timeline de auditoria em [1d2cf8a](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/1d2cf8a) e estados de UI/offline em [033423d](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/033423d).
- **Observação:** almeida-carol aparece como outra identidade Git com o mesmo e-mail; não atribuir suas alterações a Caroline sem confirmação.

### almeida-carol

- **IMPLEMENTOU:** página e integração de relatório PDF em [6937294](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/6937294), [0d9ebdf](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/0d9ebdf) e [61e4206](https://github.com/NataliaNogueira1/404NOTFOUND_Field_Ops/commit/61e4206).
- **Observação:** não foi identificado nome civil separado nas fontes locais consultadas.

## 6. Tratamento especial de merges

Um merge é evidência de integração e pode indicar a pessoa que realizou ou assinou o evento de merge. Ele não substitui autoria dos commits internos, dos diffs ou da implementação original.

O histórico contém diversos merges assinados por Natália Nogueira/NataliaNogueira1. Isso deve ser lido como evidência de integração; não transfere para essa identidade a implementação feita nas branches de outras pessoas. Squash merge, rebase e commits com identidade Git diferente podem alterar a aparência da autoria e exigem leitura do PR e dos commits internos.

## 7. Commits

As auditorias anteriores registram contagens históricas de commits alcançáveis a partir de develop. Elas são apenas contexto e podem incluir merges, documentação, ajustes pequenos, integrações, squash/rebase e aliases de identidade. Este documento não repete contagens, não gera ranking e não usa mais commits como sinônimo de mais implementação.

## 8. PRs e issues

A cadeia preferida de avaliação é:

Issue/PBI → branch/commit original → PR → review → merge.

O Git local permite verificar commits, diffs e merges, mas não estabelece sozinho autor de PR, reviews ou aprovações. Essas categorias devem ser preenchidas somente após consulta ao PR no GitHub. Nenhuma issue é atribuída a uma pessoa neste documento sem essa cadeia de evidência.

## 9. Trabalho documental e de avaliação

DOCUMENTOU é separado de IMPLEMENTOU. O histórico identifica commits de Júlia Paes de Medeiros para `docs/analises` e `docs/avaliacao`, além de documentos de análise assinados por NataliaNogueira1. Esses registros facilitam a auditoria e a rastreabilidade, mas não são apresentados como implementação de funcionalidade.

VALIDOU não foi atribuído individualmente neste documento porque a coleta local não contém, por si só, um registro pessoal suficiente de execução de testes, dispositivo ou demo.

## 10. Gestão e revisão

GESTÃO, REVISOU e ABRIU_PR exigem evidência própria: atividade do Project, autoria/reviews na página do PR ou registro de coordenação. Eventos de merge encontrados no Git foram classificados somente como MERGEOU. Não foi feita atribuição de GESTÃO ou REVISOU sem essa evidência.

## 11. Evidências para avaliação individual

- [ ] commits originais;
- [ ] diff dos commits;
- [ ] autoria de PRs;
- [ ] issues/PBIs relacionadas;
- [ ] arquivos alterados;
- [ ] reviews;
- [ ] merges;
- [ ] coautoria;
- [ ] demos/validações;
- [ ] capacidade de explicar o código.

## 12. Limitações da análise

- squash merge ou rebase pode concentrar autoria em um commit;
- commits feitos em dupla podem não conter trailer de coautoria;
- uma pessoa pode usar nomes/e-mails Git diferentes;
- merges podem estar centralizados em uma pessoa;
- gestão e revisão podem não aparecer no código;
- trabalho oral, demo e validação podem não ficar registrados no Git.

Não foram encontrados trailers Co-authored-by no histórico local consultado. A ausência desse trailer não prova ausência de colaboração; apenas impede atribuí-la automaticamente.

